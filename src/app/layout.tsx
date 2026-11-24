import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizFlow — Run your business with clarity",
  description: "Customers, services, appointments and invoices in one calm workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}