import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "sonner";
import { PresenceTracker } from "@/components/presence-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HueMeet",
  description: "A platform for making friends and learning together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-primary-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            {/* Mobile/tablet top bar - fixed at viewport top */}
            <div className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold">Hue<span className="font-extrabold">Meet</span></h1>
            </div>

            <AppSidebar />
            <main className="w-full min-h-screen mx-4 my-12 mt-18 sm:mt-8 sm:mx-8 sm:my-8">
              <PresenceTracker />
              {children}
            </main>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
