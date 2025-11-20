import { useState, useEffect } from 'react';
import { Search, Plus, History } from 'lucide-react';
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

interface WalletUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  account_number: string;
  balance: number;
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
      setWallets(results);
      
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
                      <div className="flex gap-2 justify-end">
                        <SecondaryButton
                          onClick={() => handleViewTransactions(wallet.id)}
                          className="text-sm px-3 py-1 h-8"
                        >
                          <History className="w-4 h-4 mr-1" />
                          History
                        </SecondaryButton>
                        <PrimaryButton
                          onClick={() => handleOpenLoadDialog(wallet)}
                          className="text-sm px-3 py-1 h-8"
                        >
                          <Plus className="w-4 h-4 mr-1" />
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
              Close
            </SecondaryButton>
          </div>
          {isLoadingTransactions ? (
            <p className="text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions found</p>
          ) : (
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
