// src/app/layout.tsx
import { ReactNode} from 'react';
import './globals.css';


export const metadata = {
  title: 'Generador de Rótulos',
  description: 'App Next.js + Supabase para crear rótulos PDF 3x3',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
        {children}
      </body>
    </html>
  );
}
