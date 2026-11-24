import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function currentUser() {
  const { data, error } = await auth.getSession();
  if (error || !data?.user) return null;
  return data.user;
}
export const unauthorized = () => NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
export const serverError = () => NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
export function validId(value: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}