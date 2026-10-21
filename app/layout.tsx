import type { Metadata } from "next";
import "./globals.css";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "Margin — Academic Integrity Review System",
  description:
    "Flags overlap and unsupported claims for human review. Designed for university lecturers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Topbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
