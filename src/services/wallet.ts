import { supabase } from '@/integrations/supabase/client';

export interface WalletAccount {
  user_id: string;
  role: 'driver' | 'courier';
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'load' | 'deduct' | 'adjust';
  reference?: string;
  related_ride_id?: string;
  related_delivery_id?: string;
  created_by?: string;
  created_at: string;
}

export const walletService = {
  // Get wallet account for a user
  async getWalletAccount(userId: string): Promise<WalletAccount | null> {
    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as WalletAccount | null;
  },

  // Get wallet transactions for a user
  async getTransactions(userId: string, limit: number = 10): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as WalletTransaction[];
  },

  // Apply a transaction (load, deduct, adjust)
  async applyTransaction(params: {
    userId: string;
    amount: number;
    type: 'load' | 'deduct' | 'adjust';
    reference?: string;
    rideId?: string;
    deliveryId?: string;
    actorUserId?: string;
  }): Promise<number> {
    const { data, error } = await supabase.rpc('wallet_apply_transaction', {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_type: params.type,
      p_reference: params.reference || null,
      p_ride_id: params.rideId || null,
      p_delivery_id: params.deliveryId || null,
      p_actor_user_id: params.actorUserId || null,
    });

    if (error) throw error;
    return data as number;
  },

  // Generate account number for driver or courier
  generateAccountNumber(role: 'driver' | 'courier', seed: string): string {
    const prefix = role === 'driver' ? 'KXD' : 'KXC';
    // Use a simple hash of the user ID to generate a numeric suffix
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const num = Math.abs(hash) % 100000000; // 8 digits max
    const paddedNum = num.toString().padStart(8, '0');
    return `${prefix}-${paddedNum}`;
  },

  // Update account number for a user
  async updateAccountNumber(userId: string, accountNumber: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ account_number: accountNumber })
      .eq('id', userId);

    if (error) throw error;
  },

  // Search wallets (admin)
  async searchWallets(query: string, roleFilter?: 'all' | 'driver' | 'courier'): Promise<any[]> {
    const roles: ('driver' | 'courier')[] = roleFilter && roleFilter !== 'all' ? [roleFilter] : ['driver', 'courier'];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, account_number')
      .or(`account_number.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .in('role', roles);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) return [];

    const userIds = profiles.map(p => p.id);

    const { data: wallets, error: walletsError } = await supabase
      .from('wallet_accounts')
      .select('*')
      .in('user_id', userIds);

    if (walletsError) throw walletsError;

    return profiles.map(profile => {
      const wallet = wallets?.find(w => w.user_id === profile.id);
      return {
        ...profile,
        balance: wallet?.balance || 0,
        wallet_created_at: wallet?.created_at,
      };
    });
  },
};
