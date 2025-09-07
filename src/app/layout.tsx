import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AppAuthProvider } from '@/hooks/use-auth.tsx';

export const metadata: Metadata = {
  title: 'Manila Prime Staycation',
  description: 'Professional Property Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </head>
      <body className="antialiased">
        <AppAuthProvider>
            {children}
            <Toaster />
        </AppAuthProvider>
      </body>
    </html>
  );
}
