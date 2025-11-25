import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Your global styles

// This sets up the default font.
const inter = Inter({ subsets: ['latin'] });

// This sets the metadata for your site (e.g., the title in the browser tab).
export const metadata: Metadata = {
  title: 'AI Autopilot for Clover',
  description: 'Your 24/7 AI-powered business assistant.',
};

// This is the Root Layout component.
export default function RootLayout({
  children, // `children` will be whatever page or layout is currently active.
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The `children` prop is where Next.js will render your pages. */}
        {/* For example, on the home page, `children` will be `app/page.tsx`. */}
        {/* On the dashboard, `children` will be your `app/(dashboard)/layout.tsx`. */}
        {children}
      </body>
    </html>
  );
}