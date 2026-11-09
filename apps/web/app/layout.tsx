import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CloudIDE — Modern Browser-Based Development Environment',
  description: 'Fully featured browser-based IDE with Monaco Editor, Docker containers, xterm.js terminal, and real-time synchronization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-ide-bg text-ide-text antialiased">
        {children}
      </body>
    </html>
  );
}
