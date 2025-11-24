import { useState } from 'react';
import { ridesService } from '@/services/rides';
import { toast } from 'sonner';

export const useRideNegotiation = (rideId: string) => {
  const [loading, setLoading] = useState(false);

  const proposeCounterOffer = async (driverId: string, topUpFare: number, notes: string) => {
    setLoading(true);
    try {
      await ridesService.proposeFareNegotiation(rideId, driverId, topUpFare, notes);
      toast.success('Counter-offer sent to passenger');
    } catch (error) {
      console.error('Error proposing counter-offer:', error);
      toast.error('Failed to send counter-offer');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptNegotiation = async () => {
    setLoading(true);
    try {
      await ridesService.acceptFareNegotiation(rideId);
      toast.success('Fare accepted! Driver is on the way.');
    } catch (error) {
      console.error('Error accepting negotiation:', error);
      toast.error('Failed to accept fare');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const rejectNegotiation = async () => {
    setLoading(true);
    try {
      await ridesService.rejectFareNegotiation(rideId);
      toast.info('Counter-offer rejected. Looking for other drivers...');
    } catch (error) {
      console.error('Error rejecting negotiation:', error);
      toast.error('Failed to reject fare');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    proposeCounterOffer,
    acceptNegotiation,
    rejectNegotiation
  };
};
