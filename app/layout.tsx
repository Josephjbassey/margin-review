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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <Topbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
