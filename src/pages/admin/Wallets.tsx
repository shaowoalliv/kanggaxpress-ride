import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { walletService } from '@/services/wallet';
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
  const [wallets, setWallets] = useState<WalletUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletUser | null>(null);
  const [loadAmount, setLoadAmount] = useState('');
  const [loadReference, setLoadReference] = useState('');
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);

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
      const results = await walletService.searchWallets(trimmed);
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
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by Account Number, Name, or Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <PrimaryButton onClick={handleSearch} disabled={isLoading}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </PrimaryButton>
        </div>
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
                  <TableHead className="text-right">Action</TableHead>
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
                      <PrimaryButton
                        onClick={() => handleOpenLoadDialog(wallet)}
                        className="text-sm px-3 py-1 h-8"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Load
                      </PrimaryButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
