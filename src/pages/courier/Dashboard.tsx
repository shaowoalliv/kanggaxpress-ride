import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { deliveriesService } from '@/services/deliveries';
import { couriersService } from '@/services/couriers';
import { CourierProfile } from '@/types';
import { toast } from 'sonner';
import { MapPin, Package, User, Phone, Clock, Power, PowerOff, DollarSign, Wallet as WalletIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { kycService } from '@/services/kyc';
import { KycDocument } from '@/types/kyc';
import { KycBlockedAccess } from '@/components/KycBlockedAccess';
import { LowBalanceWarning } from '@/components/LowBalanceWarning';
import { ZeroBalanceModal } from '@/components/ZeroBalanceModal';
import { useDeliveryNegotiation } from '@/hooks/useDeliveryNegotiation';
import { CounterOfferModal } from '@/components/negotiation/CounterOfferModal';

const statusColors = {
  requested: 'text-primary',
  assigned: 'text-success',
  picked_up: 'text-secondary',
  in_transit: 'text-secondary',
  delivered: 'text-muted-foreground',
  cancelled: 'text-destructive',
};

const statusLabels = {
  requested: 'Available',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function CourierDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [kycCheckLoading, setKycCheckLoading] = useState(true);
  const [platformFee, setPlatformFee] = useState<number>(5);
  const [showZeroBalanceModal, setShowZeroBalanceModal] = useState(false);
  const [counterOfferModal, setCounterOfferModal] = useState<{ delivery: any } | null>(null);
  const [greeting, setGreeting] = useState('');

  // Check if zero balance modal was dismissed this session
  const [zeroBalanceDismissed, setZeroBalanceDismissed] = useState(false);

  // Get greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    // Fetch platform fee from fare_configs
    const fetchPlatformFee = async () => {
      const { data } = await supabase
        .from('fare_configs')
        .select('platform_fee_value')
        .eq('region_code', 'CALAPAN')
        .limit(1)
        .single();
      
      if (data?.platform_fee_value) {
        setPlatformFee(data.platform_fee_value);
      }
    };
    fetchPlatformFee();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile?.role !== 'courier') {
      navigate('/');
    } else {
      loadCourierData();

      // Subscribe to wallet balance changes (Realtime)
      const channel = supabase
        .channel('courier-wallet-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallet_accounts',
            filter: `user_id=eq.${user!.id}`,
          },
          (payload) => {
            const previousBalance = walletBalance;
            const newBalance = payload.new.balance as number;
            setWalletBalance(newBalance);
            
            // Notify if balance was reloaded and reset zero balance modal
            if (previousBalance === 0 && newBalance > 0) {
              setZeroBalanceDismissed(false);
              setShowZeroBalanceModal(false);
              toast.success(`Balance reloaded to ₱${newBalance.toFixed(2)}. You can now accept jobs!`);
            } else if (previousBalance < 5 && newBalance >= 5) {
              toast.success(`Balance reloaded to ₱${newBalance.toFixed(2)}. You can now accept jobs!`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile, navigate]);

  // Show zero balance modal on page load if balance is 0 and not dismissed
  useEffect(() => {
    if (walletBalance === 0 && !zeroBalanceDismissed) {
      setShowZeroBalanceModal(true);
    }
  }, [walletBalance, zeroBalanceDismissed]);

  const loadCourierData = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setKycCheckLoading(true);
      
      // Check KYC status first
      const docs = await kycService.getUserKycDocuments(profile.id);
      setKycDocuments(docs);
      setKycCheckLoading(false);

      // Check if all required documents are approved
      const requiredDocs = ['DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'];
      const allApproved = requiredDocs.every(docType => 
        docs.some(d => d.doc_type === docType && d.status === 'APPROVED')
      );

      if (!allApproved) {
        // Block access - KYC not complete
        setLoading(false);
        return;
      }

      const [courierData, available, my, userProfile, wallet] = await Promise.all([
        couriersService.getCourierProfile(profile.id),
        deliveriesService.getAvailableDeliveries(),
        profile.id ? deliveriesService.getCourierDeliveries(profile.id) : Promise.resolve([]),
        supabase.from('profiles').select('account_number').eq('id', profile.id).single(),
        import('@/services/wallet').then(({ walletService }) => walletService.getWalletAccount(profile.id)),
      ]);

      setCourierProfile(courierData);
      setAccountNumber(userProfile.data?.account_number || '');
      setWalletBalance(wallet?.balance || 0);
      
      if (!courierData) {
        navigate('/courier/setup');
        return;
      }

      setAvailableDeliveries(available);
      setMyDeliveries(my);
    } catch (error) {
      console.error('Error loading courier data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile || !courierProfile) return;

    // Check balance before going online
    if (!courierProfile.is_available && walletBalance < 5) {
      toast.error('Insufficient balance. You need at least ₱5.00 to accept jobs. Please reload to continue.');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await couriersService.updateAvailability(
        profile.id,
        !courierProfile.is_available
      );
      setCourierProfile(updated);
      toast.success(
        updated.is_available ? 'You are now available for deliveries' : 'You are now offline'
      );
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    if (!profile || !courierProfile) return;

    // Check balance before accepting delivery
    if (walletBalance < platformFee) {
      toast.error(`Insufficient balance. You need at least ₱${platformFee.toFixed(2)} to accept jobs. Please reload to continue.`);
      return;
    }

    try {
      setActionLoading(true);
      
      // Accept the delivery
      await deliveriesService.acceptDelivery(deliveryId, courierProfile.id);
      
      // Deduct platform fee upfront
      const { walletService } = await import('@/services/wallet');
      const newBalance = await walletService.applyTransaction({
        userId: user!.id,
        amount: -platformFee,
        type: 'deduct',
        reference: 'Platform fee - delivery acceptance',
        deliveryId: deliveryId,
      });
      
      setWalletBalance(newBalance);
      toast.success(`Delivery accepted! ₱${platformFee.toFixed(2)} platform fee deducted.`);
      await loadCourierData();
    } catch (error: any) {
      console.error('Error accepting delivery:', error);
      toast.error(error.message || 'Failed to accept delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: any) => {
    try {
      setActionLoading(true);
      await deliveriesService.updateDeliveryStatus(deliveryId, newStatus);
      toast.success(`Delivery status updated to ${statusLabels[newStatus]}`);
      await loadCourierData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || !profile || profile.role !== 'courier' || kycCheckLoading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  // Check if KYC is complete
  const requiredDocs = ['DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'];
  const allKycApproved = requiredDocs.every(docType => 
    kycDocuments.some(d => d.doc_type === docType && d.status === 'APPROVED')
  );

  if (!allKycApproved) {
    return (
      <PageLayout>
        <KycBlockedAccess 
          documents={kycDocuments} 
          userName={profile.full_name}
          userId={profile.id}
          onDocumentUploaded={loadCourierData}
        />
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  if (!courierProfile) {
    return null;
  }

  const activeDelivery = myDeliveries.find(d => 
    d.status === 'assigned' || d.status === 'picked_up' || d.status === 'in_transit'
  );
  const transactionCapacity = platformFee > 0 ? walletBalance / platformFee : 0;
  const firstName = profile?.full_name?.split(' ')[0] || 'Courier';

  return (
    <PageLayout headerTitle={`${greeting}, ${firstName}!`}>
      {/* Low Balance Warning Banner */}
      <LowBalanceWarning 
        transactionCapacity={transactionCapacity} 
        platformFee={platformFee}
      />

      {/* Zero Balance Modal */}
      {showZeroBalanceModal && walletBalance === 0 && (
        <ZeroBalanceModal
          platformFee={platformFee}
          onDismiss={() => {
            setShowZeroBalanceModal(false);
            setZeroBalanceDismissed(true);
          }}
        />
      )}

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* Courier Status */}
          <ThemedCard>
             <div className="flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-xl font-heading font-bold">
                  {courierProfile.is_available ? 'You\'re Online' : 'You\'re Offline'}
                </h2>
                <p className="text-sm text-muted-foreground capitalize mb-2">
                  {courierProfile.vehicle_type} • {courierProfile.vehicle_plate}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm mb-3">
                  <span className="text-muted-foreground">
                    <strong>Account No:</strong> {accountNumber || 'Pending'}
                  </span>
                  <span className={`font-semibold ${walletBalance < 5 ? 'text-destructive' : 'text-foreground'}`}>
                    <strong>Balance:</strong> ₱{walletBalance.toFixed(2)}
                  </span>
                </div>
                <SecondaryButton
                  onClick={() => navigate('/courier/wallet')}
                  className="text-xs"
                >
                  <WalletIcon className="w-4 h-4 mr-2" />
                  View Wallet
                </SecondaryButton>
              </div>
              <button
                onClick={toggleAvailability}
                disabled={actionLoading}
                className={`p-4 rounded-full transition-all ${
                  courierProfile.is_available
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {courierProfile.is_available ? (
                  <Power className="w-6 h-6" />
                ) : (
                  <PowerOff className="w-6 h-6" />
                )}
              </button>
            </div>
          </ThemedCard>

          {/* Active Delivery */}
          {activeDelivery && (
            <div className="space-y-3">
              <h2 className="text-xl font-heading font-bold">Current Delivery</h2>
              <ThemedCard className="ring-2 ring-primary">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">
                        {activeDelivery.sender?.full_name || 'Sender'}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {activeDelivery.package_size} package
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${statusColors[activeDelivery.status]}`}>
                      {statusLabels[activeDelivery.status]}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Pickup</p>
                        <p className="text-muted-foreground">{activeDelivery.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-destructive mt-1" />
                      <div>
                        <p className="font-medium">Drop-off</p>
                        <p className="text-muted-foreground">{activeDelivery.dropoff_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 mt-1" />
                      <div>
                        <p className="font-medium">Receiver</p>
                        <p className="text-muted-foreground">
                          {activeDelivery.receiver_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 mt-1" />
                      <p className="text-muted-foreground">{activeDelivery.receiver_phone}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Package: {activeDelivery.package_description}</p>
                    {activeDelivery.cod_amount && (
                      <p className="text-sm font-semibold text-primary mt-1 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Collect: ₱{activeDelivery.cod_amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {activeDelivery.status === 'assigned' && (
                      <PrimaryButton
                        onClick={() => handleUpdateStatus(activeDelivery.id, 'picked_up')}
                        disabled={actionLoading}
                      >
                        Mark as Picked Up
                      </PrimaryButton>
                    )}
                    {activeDelivery.status === 'picked_up' && (
                      <PrimaryButton
                        onClick={() => handleUpdateStatus(activeDelivery.id, 'in_transit')}
                        disabled={actionLoading}
                      >
                        Start Delivery
                      </PrimaryButton>
                    )}
                    {activeDelivery.status === 'in_transit' && (
                      <PrimaryButton
                        onClick={() => handleUpdateStatus(activeDelivery.id, 'delivered')}
                        disabled={actionLoading}
                      >
                        Mark as Delivered
                      </PrimaryButton>
                    )}
                    <SecondaryButton
                      onClick={() => deliveriesService.cancelDelivery(activeDelivery.id).then(loadCourierData)}
                      disabled={actionLoading}
                    >
                      Cancel Delivery
                    </SecondaryButton>
                  </div>
                </div>
              </ThemedCard>
            </div>
          )}

          {/* Available Deliveries */}
          {!activeDelivery && courierProfile.is_available && (
            <div className="space-y-3">
              <h2 className="text-xl font-heading font-bold">Available Deliveries</h2>
              {availableDeliveries.length === 0 ? (
                <ThemedCard>
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No deliveries available. Waiting for requests...
                    </p>
                  </div>
                </ThemedCard>
              ) : (
                <div className="space-y-3">
                  {availableDeliveries.map((delivery) => (
                    <ThemedCard key={delivery.id}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {delivery.sender?.full_name || 'Sender'}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {delivery.package_size} package
                            </p>
                          </div>
                          {delivery.cod_amount && (
                            <p className="text-sm font-semibold text-primary flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              COD: ₱{delivery.cod_amount}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-primary mt-0.5" />
                            <span className="text-muted-foreground">{delivery.pickup_address}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                            <span className="text-muted-foreground">{delivery.dropoff_address}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Package className="w-4 h-4 mt-0.5" />
                            <span className="text-muted-foreground">{delivery.package_description}</span>
                          </div>
                        </div>

                        <PrimaryButton
                          onClick={() => handleAcceptDelivery(delivery.id)}
                          disabled={actionLoading}
                        >
                          Accept Delivery
                        </PrimaryButton>
                      </div>
                    </ThemedCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Deliveries */}
          {myDeliveries.filter(d => d.status === 'delivered' || d.status === 'cancelled').length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-heading font-bold">Recent Deliveries</h2>
              <div className="space-y-2">
                {myDeliveries
                  .filter(d => d.status === 'delivered' || d.status === 'cancelled')
                  .slice(0, 5)
                  .map((delivery) => (
                    <ThemedCard key={delivery.id}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{delivery.sender?.full_name || 'Sender'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(delivery.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${statusColors[delivery.status]}`}>
                            {statusLabels[delivery.status]}
                          </p>
                          {delivery.cod_amount && (
                            <p className="text-xs text-muted-foreground">COD: ₱{delivery.cod_amount}</p>
                          )}
                        </div>
                      </div>
                    </ThemedCard>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Counter Offer Modal */}
      {counterOfferModal && (
        <CounterOfferModal
          open={true}
          onClose={() => setCounterOfferModal(null)}
          baseFare={counterOfferModal.delivery.base_fare || 0}
          onSubmit={async (topUpFare, reason, notes) => {
            if (!courierProfile) return;
            
            const { proposeCounterOffer } = useDeliveryNegotiation(counterOfferModal.delivery.id);
            await proposeCounterOffer(courierProfile.id, topUpFare, `${reason}: ${notes}`);
            setCounterOfferModal(null);
            toast.success('Counter-offer sent to sender');
            loadCourierData();
          }}
        />
      )}
    </PageLayout>
  );
}
