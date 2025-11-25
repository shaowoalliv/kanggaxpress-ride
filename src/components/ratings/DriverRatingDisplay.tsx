import { Star } from 'lucide-react';

interface DriverRatingDisplayProps {
  rating: number;
  totalRatings?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DriverRatingDisplay = ({ 
  rating, 
  totalRatings = 0, 
  showCount = true,
  size = 'md',
  className = ''
}: DriverRatingDisplayProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Don't show rating if no ratings yet
  if (totalRatings === 0) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${textSizeClasses[size]} ${className}`}>
        <Star className={`${sizeClasses[size]} text-muted-foreground`} />
        <span>New Driver</span>
      </div>
    );
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= fullStars;
          const isHalf = starNumber === fullStars + 1 && hasHalfStar;

          return (
            <div key={index} className="relative">
              {isHalf ? (
                <>
                  <Star className={`${sizeClasses[size]} text-yellow-400`} />
                  <Star 
                    className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400 absolute top-0 left-0`}
                    style={{ clipPath: 'inset(0 50% 0 0)' }}
                  />
                </>
              ) : (
                <Star
                  className={`${sizeClasses[size]} ${
                    isFilled
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      
      <span className={`font-semibold text-foreground ${textSizeClasses[size]}`}>
        {rating.toFixed(1)}
      </span>
      
      {showCount && (
        <span className={`text-muted-foreground ${textSizeClasses[size]}`}>
          ({totalRatings})
        </span>
      )}
    </div>
  );
};
