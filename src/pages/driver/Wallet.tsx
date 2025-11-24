import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { walletService, WalletTransaction } from '@/services/wallet';
import { toast } from 'sonner';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Clock, ArrowLeft, DollarSign, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export default function DriverWallet() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (!user || profile?.role !== 'driver') {
      navigate('/driver/dashboard');
      return;
    }

    loadWalletData();

    // Subscribe to wallet updates
    const channel = supabase
      .channel('driver-wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_accounts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadWalletData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadWalletData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, navigate]);

  const loadWalletData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [wallet, txns, userProfile] = await Promise.all([
        walletService.getWalletAccount(user.id),
        walletService.getTransactions(user.id, 50),
        supabase.from('profiles').select('account_number').eq('id', user.id).single(),
      ]);

      setBalance(wallet?.balance || 0);
      setTransactions(txns);
      setAccountNumber(userProfile.data?.account_number || '');
    } catch (error) {
      console.error('Error loading wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccountNumber = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber);
      toast.success('Account number copied to clipboard!');
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!user || !withdrawalAmount) return;

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (amount < 100) {
      toast.error('Minimum withdrawal amount is ₱100.00');
      return;
    }

    try {
      setWithdrawalLoading(true);
      
      // Call edge function to request withdrawal
      const { error } = await supabase.functions.invoke('request-withdrawal', {
        body: {
          userId: user.id,
          amount,
          accountNumber,
        },
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted! Admin will process your request.');
      setWithdrawalAmount('');
      await loadWalletData();
    } catch (error: any) {
      console.error('Withdrawal request error:', error);
      toast.error(error.message || 'Failed to submit withdrawal request');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  const getTransactionLabel = (transaction: WalletTransaction) => {
    if (transaction.reference) return transaction.reference;
    if (transaction.related_ride_id) return 'Ride earning';
    if (transaction.type === 'load') return 'Balance reload';
    if (transaction.type === 'deduct') return 'Platform fee';
    return transaction.type;
  };

  return (
    <PageLayout>
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <SecondaryButton
              onClick={() => navigate('/driver/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </SecondaryButton>
            <h1 className="text-2xl font-heading font-bold">My Wallet</h1>
          </div>

          {/* Balance Card */}
          <ThemedCard className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <WalletIcon className="w-8 h-8 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
            <p className="text-4xl font-bold text-primary mb-4">₱{balance.toFixed(2)}</p>
            
            {/* Account Number with Copy */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Your Account Number</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-bold font-mono text-foreground">
                  {accountNumber || 'Not assigned yet'}
                </p>
                {accountNumber && (
                  <button
                    onClick={handleCopyAccountNumber}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                    aria-label="Copy account number"
                  >
                    <Copy className="w-4 h-4 text-primary" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this with admin to load your wallet
              </p>
            </div>
          </ThemedCard>

          {/* Withdrawal Request */}
          <ThemedCard>
            <h3 className="text-lg font-heading font-bold mb-4">Request Withdrawal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₱)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="100.00"
                    min="100"
                    step="10"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: ₱100.00 • Available: ₱{balance.toFixed(2)}
                </p>
              </div>
              <PrimaryButton
                onClick={handleWithdrawalRequest}
                disabled={withdrawalLoading || !withdrawalAmount || balance < 100}
                className="w-full"
              >
                {withdrawalLoading ? 'Submitting...' : 'Request Withdrawal'}
              </PrimaryButton>
              <p className="text-xs text-muted-foreground text-center">
                Withdrawals are processed by admin within 1-3 business days
              </p>
            </div>
          </ThemedCard>

          {/* Transaction History */}
          <div className="space-y-3">
            <h3 className="text-lg font-heading font-bold">Transaction History</h3>
            {transactions.length === 0 ? (
              <ThemedCard>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              </ThemedCard>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn) => (
                  <ThemedCard key={txn.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getTransactionIcon(txn.type, txn.amount)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {getTransactionLabel(txn)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(txn.created_at), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold text-sm whitespace-nowrap ml-2 ${
                        txn.amount > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {txn.amount > 0 ? '+' : ''}₱{Math.abs(txn.amount).toFixed(2)}
                      </p>
                    </div>
                  </ThemedCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
