import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './AuthContext';

export const metadata: Metadata = {
  title: 'Contact Management App',
  description: 'Full-stack contact manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
