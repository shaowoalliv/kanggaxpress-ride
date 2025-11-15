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
      alt="KanggaXpress"
      width={width}
      height={height}
      className={cn(
        "object-contain",
        animated && "carabao-anim",
        className
      )}
      data-testid="carabao-logo"
    />
  );
}
