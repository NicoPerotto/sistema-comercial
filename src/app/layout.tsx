import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { getSiteConfig } from "@/lib/system-config";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: `${config.title} - Sistema de Gestión`,
    description: config.description,
    manifest: "/manifest.json",
    applicationName: "Sistema Comercial",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Comercial",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSiteConfig();
  return (
    <html lang="es" className={`dark theme-${config.theme}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <div className="flex min-h-screen bg-background text-foreground">
              <Sidebar
                brandTitle={config.sidebar.title}
                brandSubtitle={config.sidebar.subtitle}
              />
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            </div>
          </ToastProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

