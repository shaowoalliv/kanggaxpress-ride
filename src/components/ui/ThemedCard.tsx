import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ThemedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ThemedCard({ children, className, onClick }: ThemedCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl p-5 shadow-md",
        "border border-border/50",
        onClick && "cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
