import { supabase } from '@/integrations/supabase/client';
import { DeliveryOrder, PackageSize, DeliveryStatus } from '@/types';

export interface CreateDeliveryData {
  pickup_address: string;
  dropoff_address: string;
  package_description: string;
  package_size: PackageSize;
  cod_amount?: number;
  receiver_name: string;
  receiver_phone: string;
}

export const deliveriesService = {
  // Create a new delivery request
  async createDelivery(senderId: string, data: CreateDeliveryData) {
    const { data: delivery, error } = await supabase
      .from('delivery_orders')
      .insert({
        sender_id: senderId,
        ...data,
        status: 'requested' as DeliveryStatus,
      })
      .select()
      .single();

    if (error) throw error;
    return delivery as DeliveryOrder;
  },

  // Get deliveries for a sender
  async getSenderDeliveries(senderId: string) {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DeliveryOrder[];
  },

  // Get available deliveries (for couriers)
  async getAvailableDeliveries() {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*, sender:profiles(*)')
      .eq('status', 'requested')
      .is('courier_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get deliveries assigned to a courier
  async getCourierDeliveries(courierId: string) {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*, sender:profiles(*)')
      .eq('courier_id', courierId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Accept a delivery (courier)
  async acceptDelivery(deliveryId: string, courierId: string) {
    const { data, error } = await supabase
      .from('delivery_orders')
      .update({
        courier_id: courierId,
        status: 'assigned' as DeliveryStatus,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
      .eq('status', 'requested')
      .is('courier_id', null)
      .select()
      .single();

    if (error) throw error;
    return data as DeliveryOrder;
  },

  // Update delivery status (now with centralized fee logic)
  async updateDeliveryStatus(
    deliveryId: string, 
    status: DeliveryStatus,
    cancellationReason?: string | null,
    actorUserId?: string | null
  ) {
    const updates: any = { status };
    
    if (status === 'picked_up') {
      updates.picked_up_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }

    if (cancellationReason !== undefined) {
      updates.cancellation_reason = cancellationReason;
    }

    const { data, error } = await supabase
      .from('delivery_orders')
      .update(updates)
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;

    // Charge platform fee if applicable (centralized logic)
    if (status === 'delivered' || status === 'cancelled') {
      const { platformFeeService } = await import('./platformFee');
      try {
        await platformFeeService.chargePlatformFeeForDelivery(deliveryId, actorUserId || null);
      } catch (feeError) {
        console.error('Platform fee error (non-blocking):', feeError);
        // Don't block status update if fee charge fails
      }
    }

    return data as DeliveryOrder;
  },

  // Cancel a delivery with reason tracking
  async cancelDelivery(deliveryId: string, reason?: string, actorUserId?: string) {
    return this.updateDeliveryStatus(deliveryId, 'cancelled', reason || null, actorUserId || null);
  },
};
