import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './AuthContext';

export const metadata: Metadata = {
  title: 'Contacts App',
  description: 'Nest + Next contact manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
