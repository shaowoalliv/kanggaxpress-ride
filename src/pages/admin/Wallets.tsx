import { useState, useEffect } from 'react';
import { Search, Plus, History, X } from 'lucide-react';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { walletService, WalletTransaction } from '@/services/wallet';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WalletUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  account_number: string;
  balance: number;
  transaction_capacity: number;
  total_fees_paid: number;
}

export default function AdminWallets() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'courier'>('all');
  const [wallets, setWallets] = useState<WalletUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletUser | null>(null);
  const [loadAmount, setLoadAmount] = useState('');
  const [loadReference, setLoadReference] = useState('');
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [platformFee, setPlatformFee] = useState<number>(5);

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

  const handleSearch = async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      toast({
        title: 'Search Required',
        description: 'Please enter an account number, name, or email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await walletService.searchWallets(trimmed, roleFilter);
      
      // Calculate transaction capacity and total fees paid for each user
      const enrichedResults = await Promise.all(
        results.map(async (wallet) => {
          const transactions = await walletService.getTransactions(wallet.id, 1000);
          const totalFeesPaid = Math.abs(
            transactions
              .filter(txn => txn.type === 'deduct')
              .reduce((sum, txn) => sum + txn.amount, 0)
          );
          const transactionCapacity = platformFee > 0 ? wallet.balance / platformFee : 0;
          
          return {
            ...wallet,
            transaction_capacity: transactionCapacity,
            total_fees_paid: totalFeesPaid,
          };
        })
      );
      
      setWallets(enrichedResults);
      
      if (results.length === 0) {
        toast({
          title: 'No Results',
          description: 'No drivers or couriers found matching your search',
        });
      }
    } catch (error) {
      console.error('Error searching wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to search wallets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLoadDialog = (wallet: WalletUser) => {
    setSelectedWallet(wallet);
    setLoadAmount('');
    setLoadReference('');
    setIsLoadDialogOpen(true);
  };

  const handleViewTransactions = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingTransactions(true);
    try {
      const txns = await walletService.getTransactions(userId, 20);
      setTransactions(txns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transaction history',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleLoadBalance = async () => {
    if (!selectedWallet || !user) return;

    const amount = parseFloat(loadAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      await walletService.applyTransaction({
        userId: selectedWallet.id,
        amount: amount,
        type: 'load',
        reference: loadReference || 'Manual load',
        actorUserId: user.id,
      });

      toast({
        title: 'Balance Loaded',
        description: `₱${amount.toFixed(2)} loaded to ${selectedWallet.full_name}'s wallet`,
      });

      setIsLoadDialogOpen(false);
      handleSearch(); // Refresh the list
      
      // Refresh transactions if viewing this user's history
      if (selectedUserId === selectedWallet.id) {
        handleViewTransactions(selectedWallet.id);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load balance',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
        <p className="text-muted-foreground">
          Load KanggaXpress balance for drivers and couriers
        </p>
      </div>

      {/* Search */}
      <ThemedCard>
        <h2 className="text-xl font-semibold mb-4">Search</h2>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by Account Number, Name, or Email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: 'all' | 'driver' | 'courier') => setRoleFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="driver">Drivers Only</SelectItem>
                <SelectItem value="courier">Couriers Only</SelectItem>
              </SelectContent>
            </Select>
            <PrimaryButton
              type="submit"
              disabled={isLoading}
              className="sm:w-auto"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </PrimaryButton>
          </div>
        </form>
      </ThemedCard>

      {/* Results */}
      {wallets.length > 0 && (
        <ThemedCard>
          <h2 className="text-xl font-semibold mb-4">Results ({wallets.length})</h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Transaction Capacity</TableHead>
                  <TableHead className="text-right">Total Fees Paid</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell className="font-mono text-sm">
                      {wallet.account_number || 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {wallet.full_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wallet.email}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                        {wallet.role === 'driver' ? 'Driver' : 'Courier'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-lg">
                        ₱{wallet.balance.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`font-bold ${wallet.transaction_capacity < 5 ? 'text-destructive' : 'text-foreground'}`}>
                        {Math.floor(wallet.transaction_capacity)} job(s)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @ ₱{platformFee.toFixed(2)}/job
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">
                        ₱{wallet.total_fees_paid.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row gap-2 justify-end items-end">
                        <SecondaryButton
                          onClick={() => handleViewTransactions(wallet.id)}
                          className="text-xs px-2 py-1.5 h-auto whitespace-nowrap"
                        >
                          <History className="w-3 h-3 mr-1.5" />
                          History
                        </SecondaryButton>
                        <PrimaryButton
                          onClick={() => handleOpenLoadDialog(wallet)}
                          className="text-xs px-2 py-1.5 h-auto whitespace-nowrap"
                        >
                          <Plus className="w-3 h-3 mr-1.5" />
                          Load
                        </PrimaryButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ThemedCard>
      )}

      {/* Transaction History */}
      {selectedUserId && (
        <ThemedCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <SecondaryButton
              onClick={() => setSelectedUserId(null)}
              className="text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </SecondaryButton>
          </div>

          {isLoadingTransactions ? (
            <p className="text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions found</p>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                    Total Loads
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ₱{transactions
                      .filter(txn => txn.type === 'load')
                      .reduce((sum, txn) => sum + txn.amount, 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {transactions.filter(txn => txn.type === 'load').length} transaction(s)
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                    Total Deductions
                  </div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    ₱{Math.abs(transactions
                      .filter(txn => txn.type === 'deduct')
                      .reduce((sum, txn) => sum + txn.amount, 0))
                      .toFixed(2)}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {transactions.filter(txn => txn.type === 'deduct').length} transaction(s)
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Net Change
                  </div>
                  <div className={`text-2xl font-bold ${
                    transactions.reduce((sum, txn) => sum + txn.amount, 0) >= 0 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {transactions.reduce((sum, txn) => sum + txn.amount, 0) >= 0 ? '+' : ''}
                    ₱{transactions
                      .reduce((sum, txn) => sum + txn.amount, 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {transactions.length} total transaction(s)
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Related ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-sm">
                          {new Date(txn.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              txn.type === 'load'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : txn.type === 'deduct'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {txn.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {txn.amount > 0 ? '+' : ''}₱{txn.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {txn.reference || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {txn.related_ride_id
                            ? `Ride: ${txn.related_ride_id.slice(0, 8)}...`
                            : txn.related_delivery_id
                            ? `Delivery: ${txn.related_delivery_id.slice(0, 8)}...`
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ThemedCard>
      )}

      {/* Load Balance Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Balance</DialogTitle>
            <DialogDescription>
              Load KanggaXpress balance for {selectedWallet?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={loadAmount}
                onChange={(e) => setLoadAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                placeholder="GCash Ref, OR#, etc."
                value={loadReference}
                onChange={(e) => setLoadReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <SecondaryButton onClick={() => setIsLoadDialogOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleLoadBalance}>
              Load Balance
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
