import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EventSummary } from "@/components/ui/event-summary";
import { Toaster } from "sonner";
import { CalendarProvider } from "@/components/CalendarProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventriX",
  description: "Calendar app , that schledules events and much more!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CalendarProvider>
          {children}
          <EventSummary />
          <Toaster />
        </CalendarProvider>
      </body>
    </html>
  );
}
