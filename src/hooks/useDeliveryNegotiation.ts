import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeliveryNegotiation = (deliveryId: string) => {
  const [loading, setLoading] = useState(false);

  const proposeCounterOffer = async (courierId: string, topUpFare: number, notes: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          courier_id: courierId,
          negotiation_status: 'pending',
          proposed_top_up_fare: topUpFare,
          negotiation_notes: notes
        })
        .eq('id', deliveryId);

      if (error) throw error;
      toast.success('Counter-offer sent to sender');
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
      const { data: delivery, error: fetchError } = await supabase
        .from('delivery_orders')
        .select('base_fare, proposed_top_up_fare')
        .eq('id', deliveryId)
        .single();

      if (fetchError) throw fetchError;

      const totalFare = (delivery.base_fare || 0) + (delivery.proposed_top_up_fare || 0);

      const { error } = await supabase
        .from('delivery_orders')
        .update({
          negotiation_status: 'accepted',
          status: 'assigned',
          total_fare: totalFare,
          top_up_fare: delivery.proposed_top_up_fare,
          assigned_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;
      toast.success('Fare accepted! Courier is on the way.');
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
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          negotiation_status: 'rejected',
          courier_id: null,
          proposed_top_up_fare: 0,
          negotiation_notes: null
        })
        .eq('id', deliveryId);

      if (error) throw error;
      toast.info('Counter-offer rejected. Looking for other couriers...');
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
