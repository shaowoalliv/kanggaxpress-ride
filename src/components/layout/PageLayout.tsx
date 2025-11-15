import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
}

export function PageLayout({ children, showHeader = true, className }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <AppHeader />}
      <main className={cn("flex-1 flex flex-col", className)}>
        {children}
      </main>
    </div>
  );
}
