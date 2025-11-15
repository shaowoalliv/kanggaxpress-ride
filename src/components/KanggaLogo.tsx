import { cn } from '@/lib/utils';

interface KanggaLogoProps {
  className?: string;
  width?: number;
  height?: number;
  animated?: boolean;
}

export function KanggaLogo({ 
  className, 
  width, 
  height,
  animated = true 
}: KanggaLogoProps) {
  return (
    <img
      src="/logo-kanggaxpress.png"
      alt="KanggaXpress carabao and cart logo"
      width={width}
      height={height}
      className={cn(
        "object-contain transition-transform duration-300",
        animated && "animate-float",
        "hover:scale-105",
        className
      )}
    />
  );
}
