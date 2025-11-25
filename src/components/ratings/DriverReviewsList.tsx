import { useEffect, useState } from 'react';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { DriverRatingDisplay } from './DriverRatingDisplay';
import { ratingsService, RideRating } from '@/services/ratings';
import { format } from 'date-fns';
import { User } from 'lucide-react';
import { toast } from 'sonner';

interface DriverReviewsListProps {
  driverId: string;
  className?: string;
}

export const DriverReviewsList = ({ driverId, className = '' }: DriverReviewsListProps) => {
  const [reviews, setReviews] = useState<RideRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [driverId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await ratingsService.getDriverRatings(driverId);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <ThemedCard className={className}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      </ThemedCard>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reviews.map((review) => (
        <ThemedCard key={review.id}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {(review as any).passenger?.full_name || 'Passenger'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <DriverRatingDisplay 
                rating={review.rating} 
                totalRatings={0}
                showCount={false}
                size="sm"
              />
            </div>

            {/* Review Text */}
            {review.review_text && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.review_text}
              </p>
            )}
          </div>
        </ThemedCard>
      ))}
    </div>
  );
};
