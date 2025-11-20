import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, History, User, X } from 'lucide-react';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { walletService, WalletTransaction } from '@/services/wallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  account_number: string;
  phone: string | null;
  created_at: string;
  balance: number;
  kyc_status: string | null;
}

export default function AdminDrivers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'courier' | 'passenger'>('all');
  const [kycFilter, setKycFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW'>('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const handleSearch = async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      toast({
        title: 'Search Required',
        description: 'Please enter a name, email, or account number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Build role filter
      const roles: ('driver' | 'courier' | 'passenger')[] = roleFilter === 'all' 
        ? ['driver', 'courier', 'passenger'] 
        : [roleFilter];

      // Search profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, account_number, phone, created_at')
        .or(`account_number.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .in('role', roles);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        toast({
          title: 'No Results',
          description: 'No users found matching your search',
        });
        return;
      }

      // Get wallet balances for drivers and couriers
      const userIds = profiles.map(p => p.id);
      const { data: wallets, error: walletsError } = await supabase
        .from('wallet_accounts')
        .select('*')
        .in('user_id', userIds);

      if (walletsError) throw walletsError;

      // Get KYC status for all users
      const { data: kycDocs, error: kycError } = await supabase
        .from('kyc_documents')
        .select('user_id, status')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (kycError) throw kycError;

      // Combine profile, wallet, and KYC data
      let usersWithBalance = profiles.map(profile => {
        const wallet = wallets?.find(w => w.user_id === profile.id);
        // Get the most recent KYC document status for this user
        const kycDoc = kycDocs?.find(doc => doc.user_id === profile.id);
        return {
          ...profile,
          balance: wallet?.balance || 0,
          kyc_status: kycDoc?.status || null,
        };
      });

      // Filter by KYC status if specified
      if (kycFilter !== 'all') {
        usersWithBalance = usersWithBalance.filter(user => user.kyc_status === kycFilter);
      }

      setUsers(usersWithBalance);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTransactions = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingTransactions(true);
    try {
      const txns = await walletService.getTransactions(userId, 50);
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

  return (
    <>
      <Helmet>
        <title>Users - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-2">
            User Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Search and view user information, wallet balance, and transaction history
          </p>
        </div>

        {/* Search */}
        <ThemedCard>
          <h2 className="text-xl font-semibold mb-4">Search Users</h2>
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
                  placeholder="Search by Name, Email, or Account Number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: 'all' | 'driver' | 'courier' | 'passenger') => setRoleFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="driver">Drivers</SelectItem>
                  <SelectItem value="courier">Couriers</SelectItem>
                  <SelectItem value="passenger">Passengers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kycFilter} onValueChange={(value: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW') => setKycFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">All KYC Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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
        {users.length > 0 && (
          <ThemedCard>
            <h2 className="text-xl font-semibold mb-4">Results ({users.length})</h2>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">
                        {user.account_number || 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {user.full_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.phone || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          user.role === 'driver' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : user.role === 'courier'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.kyc_status ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            user.kyc_status === 'APPROVED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : user.kyc_status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : user.kyc_status === 'REVIEW'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {user.kyc_status}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No KYC</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-lg">
                          {user.role === 'passenger' ? 'N/A' : `₱${user.balance.toFixed(2)}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row gap-2 justify-end items-end">
                          {user.role !== 'passenger' && (
                            <SecondaryButton
                              onClick={() => handleViewTransactions(user.id)}
                              className="text-xs px-2 py-1.5 h-auto whitespace-nowrap"
                            >
                              <History className="w-3 h-3 mr-1.5" />
                              History
                            </SecondaryButton>
                          )}
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
                <div className="border rounded-lg overflow-x-auto">
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
      </div>
    </>
  );
}
