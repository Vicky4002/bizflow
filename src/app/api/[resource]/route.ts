import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, unauthorized, badRequest, validId, serverError } from "@/lib/api";
import { withUserDb } from "@/lib/db";

export const runtime = "nodejs";
const businessSchema = z.object({ name: z.string().trim().min(2).max(160) });
const customerSchema = z.object({ businessId: z.string().uuid(), name: z.string().trim().min(1).max(160), email: z.string().trim().email().max(254).optional().or(z.literal("")), phone: z.string().max(40).optional(), notes: z.string().max(2000).optional() });
const serviceSchema = z.object({ businessId: z.string().uuid(), name: z.string().trim().min(1).max(160), description: z.string().max(1000).optional(), duration: z.coerce.number().int().min(5).max(1440).default(60), price: z.coerce.number().min(0).max(100000000) });
const appointmentSchema = z.object({ businessId: z.string().uuid(), title: z.string().trim().min(1).max(180), customerId: z.string().uuid().nullable().optional(), serviceId: z.string().uuid().nullable().optional(), startsAt: z.string().datetime(), endsAt: z.string().datetime(), notes: z.string().max(2000).optional() }).refine(v => new Date(v.endsAt) > new Date(v.startsAt));
const invoiceSchema = z.object({ businessId: z.string().uuid(), customerId: z.string().uuid().nullable().optional(), invoiceNumber: z.string().trim().min(1).max(60), total: z.coerce.number().min(0).max(100000000), dueDate: z.string().optional(), notes: z.string().max(2000).optional() });

type Resource = "businesses" | "customers" | "services" | "appointments" | "invoices" | "dashboard";
const allowed = new Set<Resource>(["businesses","customers","services","appointments","invoices","dashboard"]);

export async function GET(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { resource } = await ctx.params;
  if (!allowed.has(resource as Resource)) return badRequest("Unknown resource.");
  try {
    if (resource === "businesses") {
      const rows = await withUserDb(user.id, async db => (await db.query(
        "SELECT b.id,b.name,b.slug,b.timezone,b.currency,m.role FROM bizflow.businesses b JOIN bizflow.business_memberships m ON m.business_id=b.id WHERE m.user_id=$1 ORDER BY b.created_at DESC",
        [user.id]
      )).rows);
      return NextResponse.json({ businesses: rows });
    }
    const businessId = req.nextUrl.searchParams.get("businessId");
    if (!validId(businessId)) return badRequest("Choose a valid business.");
    if (resource === "dashboard") {
      const result = await withUserDb(user.id, async db => {
        const [customers, services, invoices, appointments, revenue] = await Promise.all([
          db.query("SELECT count(*)::int AS count FROM bizflow.customers WHERE business_id=$1",[businessId]),
          db.query("SELECT count(*)::int AS count FROM bizflow.services WHERE business_id=$1 AND active=true",[businessId]),
          db.query("SELECT count(*)::int AS count FROM bizflow.invoices WHERE business_id=$1",[businessId]),
          db.query("SELECT count(*)::int AS count FROM bizflow.appointments WHERE business_id=$1 AND starts_at >= now() AND status IN ('scheduled','confirmed')",[businessId]),
          db.query("SELECT COALESCE(sum(total-amount_paid),0)::numeric AS outstanding, COALESCE(sum(amount_paid),0)::numeric AS collected FROM bizflow.invoices WHERE business_id=$1 AND status <> 'void'",[businessId])
        ]);
        return { customers: customers.rows[0].count, services: services.rows[0].count, invoices: invoices.rows[0].count, appointments: appointments.rows[0].count, outstanding: revenue.rows[0].outstanding, collected: revenue.rows[0].collected };
      });
      return NextResponse.json(result);
    }
    const queries: Record<string,string> = {
      customers: "SELECT id,name,email,phone,notes,created_at FROM bizflow.customers WHERE business_id=$1 ORDER BY created_at DESC LIMIT 100",
      services: "SELECT id,name,description,duration_minutes,price,active FROM bizflow.services WHERE business_id=$1 ORDER BY created_at DESC LIMIT 100",
      appointments: "SELECT a.id,a.title,a.starts_at,a.ends_at,a.status,c.name AS customer_name,s.name AS service_name FROM bizflow.appointments a LEFT JOIN bizflow.customers c ON c.id=a.customer_id AND c.business_id=a.business_id LEFT JOIN bizflow.services s ON s.id=a.service_id AND s.business_id=a.business_id WHERE a.business_id=$1 ORDER BY a.starts_at DESC LIMIT 100",
      invoices: "SELECT i.id,i.invoice_number,i.status,i.issue_date,i.due_date,i.total,i.amount_paid,c.name AS customer_name FROM bizflow.invoices i LEFT JOIN bizflow.customers c ON c.id=i.customer_id AND c.business_id=i.business_id WHERE i.business_id=$1 ORDER BY i.created_at DESC LIMIT 100"
    };
    const rows = await withUserDb(user.id, async db => (await db.query(queries[resource], [businessId])).rows);
    return NextResponse.json({ [resource]: rows });
  } catch { return serverError(); }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { resource } = await ctx.params;
  const body = await req.json().catch(() => null);
  try {
    if (resource === "businesses") {
      const parsed = businessSchema.safeParse(body);
      if (!parsed.success) return badRequest("Enter a business name with at least 2 characters.");
      const business = await withUserDb(user.id, async db => {
        await db.query("INSERT INTO bizflow.app_users(user_id,email,full_name) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET email=EXCLUDED.email,full_name=EXCLUDED.full_name,updated_at=now()", [user.id,user.email,user.name || null]);
        const slug = parsed.data.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48) + "-" + crypto.randomUUID().slice(0,8);
        const b = (await db.query("INSERT INTO bizflow.businesses(name,slug,created_by) VALUES($1,$2,$3) RETURNING id,name,slug,currency,timezone",[parsed.data.name,slug,user.id])).rows[0];
        await db.query("INSERT INTO bizflow.business_memberships(business_id,user_id,role) VALUES($1,$2,'owner')",[b.id,user.id]);
        return b;
      });
      return NextResponse.json({ business }, { status: 201 });
    }
    const schemas: Record<string,z.ZodTypeAny> = { customers: customerSchema, services: serviceSchema, appointments: appointmentSchema, invoices: invoiceSchema };
    const schema = schemas[resource];
    if (!schema) return badRequest("Unknown resource.");
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Please check the information and try again.");
    const v = parsed.data as Record<string, any>;
    const row = await withUserDb(user.id, async db => {
      if (resource === "customers") return (await db.query("INSERT INTO bizflow.customers(business_id,name,email,phone,notes) VALUES($1,$2,$3,$4,$5) RETURNING *",[v.businessId,v.name,v.email||null,v.phone||null,v.notes||null])).rows[0];
      if (resource === "services") return (await db.query("INSERT INTO bizflow.services(business_id,name,description,duration_minutes,price) VALUES($1,$2,$3,$4,$5) RETURNING *",[v.businessId,v.name,v.description||null,v.duration,v.price])).rows[0];
      if (resource === "appointments") return (await db.query("INSERT INTO bizflow.appointments(business_id,title,customer_id,service_id,starts_at,ends_at,notes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",[v.businessId,v.title,v.customerId||null,v.serviceId||null,v.startsAt,v.endsAt,v.notes||null])).rows[0];
      return (await db.query("INSERT INTO bizflow.invoices(business_id,customer_id,invoice_number,total,subtotal,due_date,notes) VALUES($1,$2,$3,$4,$4,$5,$6) RETURNING *",[v.businessId,v.customerId||null,v.invoiceNumber,v.total,v.dueDate||null,v.notes||null])).rows[0];
    });
    return NextResponse.json({ [resource.slice(0,-1)]: row }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as {code:string}).code === "23505") return badRequest("That invoice number or business name is already in use.");
    return serverError();
  }
}