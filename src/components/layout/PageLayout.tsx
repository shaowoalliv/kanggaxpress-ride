import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
  headerTitle?: string;
}

export function PageLayout({ children, showHeader = true, className, headerTitle }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <AppHeader title={headerTitle} />}
      <main className={cn("flex-1 flex flex-col", className)}>
        {children}
      </main>
    </div>
  );
}
