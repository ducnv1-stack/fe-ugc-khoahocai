import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/provider/auth-provider';
import { ThemeProvider } from '@/provider/theme-provider';
import { SettingsProvider } from '@/provider/settings-provider';
import { ConfirmProvider } from '@/provider/confirm-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "CSMS CRM - Hệ thống quản lý khách hàng",
  description: "Hệ thống quản lý khách hàng và khóa học AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <AuthProvider>
              <ConfirmProvider>
                <TooltipProvider>
                  {children}
                  <Toaster position="top-right" richColors />
                </TooltipProvider>
              </ConfirmProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
