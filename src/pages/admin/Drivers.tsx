import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, History, User, X, Car, Package, ChevronDown, ChevronUp, TrendingUp, Award, CheckCircle2, XCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { walletService, WalletTransaction } from '@/services/wallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DriverProfile {
  vehicle_type: string;
  vehicle_model: string | null;
  vehicle_plate: string;
  vehicle_color: string | null;
  license_number: string | null;
  is_available: boolean | null;
  current_lat: number | null;
  current_lng: number | null;
  rating: number | null;
  total_rides: number | null;
}

interface CourierProfile {
  vehicle_type: string;
  vehicle_model: string | null;
  vehicle_plate: string;
  vehicle_color: string | null;
  license_number: string | null;
  is_available: boolean | null;
  rating: number | null;
  total_deliveries: number | null;
}

interface PerformanceMetrics {
  completed_rides: number;
  cancelled_rides: number;
  completion_rate: number;
  cancellation_rate: number;
  total_earnings: number;
  avg_rating: number;
  recent_ratings: number[];
}

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
  kyc_submitted_at: string | null;
  kyc_updated_at: string | null;
  driver_profile?: DriverProfile | null;
  courier_profile?: CourierProfile | null;
  performance?: PerformanceMetrics | null;
}

export default function AdminDrivers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'courier' | 'passenger'>('all');
  const [kycFilter, setKycFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{
    total: number;
    passenger: number;
    driver: number;
    courier: number;
  }>({
    total: 0,
    passenger: 0,
    driver: 0,
    courier: 0,
  });

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
      // Calculate date range based on period filter
      let dateFilter = null;
      const now = new Date();
      
      if (periodFilter === "today") {
        dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (periodFilter === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter = weekAgo.toISOString();
      } else if (periodFilter === "month") {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = monthAgo.toISOString();
      }

      // Build role filter
      const roles: ('driver' | 'courier' | 'passenger')[] = roleFilter === 'all' 
        ? ['driver', 'courier', 'passenger'] 
        : [roleFilter];

      // Search profiles with date filter
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, role, account_number, phone, created_at')
        .or(`account_number.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .in('role', roles);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setStats({ total: 0, passenger: 0, driver: 0, courier: 0 });
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
        .select('user_id, status, created_at, updated_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (kycError) throw kycError;

      // Get driver profiles
      const { data: driverProfiles, error: driverError } = await supabase
        .from('driver_profiles')
        .select('*')
        .in('user_id', userIds);

      if (driverError) throw driverError;

      // Get courier profiles
      const { data: courierProfiles, error: courierError } = await supabase
        .from('courier_profiles')
        .select('*')
        .in('user_id', userIds);

      if (courierError) throw courierError;

      // Get performance metrics for drivers
      const driverUserIds = profiles.filter(p => p.role === 'driver').map(p => p.id);
      const { data: driverRides } = await supabase
        .from('rides')
        .select('passenger_id, status, fare_final, driver_id')
        .in('passenger_id', driverUserIds);

      // Get performance metrics for couriers
      const courierUserIds = profiles.filter(p => p.role === 'courier').map(p => p.id);
      const { data: courierDeliveries } = await supabase
        .from('delivery_orders')
        .select('sender_id, status, total_fare, courier_id')
        .in('sender_id', courierUserIds);

      // Calculate performance metrics
      const calculatePerformance = (userId: string, role: string): PerformanceMetrics => {
        if (role === 'driver') {
          const userRides = driverRides?.filter(r => r.passenger_id === userId) || [];
          const completed = userRides.filter(r => r.status === 'completed').length;
          const cancelled = userRides.filter(r => r.status === 'cancelled').length;
          const total = userRides.length;
          const totalEarnings = userRides
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + (r.fare_final || 0), 0);

          const driverProfile = driverProfiles?.find(dp => dp.user_id === userId);
          
          return {
            completed_rides: completed,
            cancelled_rides: cancelled,
            completion_rate: total > 0 ? (completed / total) * 100 : 0,
            cancellation_rate: total > 0 ? (cancelled / total) * 100 : 0,
            total_earnings: totalEarnings,
            avg_rating: driverProfile?.rating || 0,
            recent_ratings: [], // Could be populated with actual rating history
          };
        } else if (role === 'courier') {
          const userDeliveries = courierDeliveries?.filter(d => d.sender_id === userId) || [];
          const completed = userDeliveries.filter(d => d.status === 'delivered').length;
          const cancelled = userDeliveries.filter(d => d.status === 'cancelled').length;
          const total = userDeliveries.length;
          const totalEarnings = userDeliveries
            .filter(d => d.status === 'delivered')
            .reduce((sum, d) => sum + (d.total_fare || 0), 0);

          const courierProfile = courierProfiles?.find(cp => cp.user_id === userId);
          
          return {
            completed_rides: completed,
            cancelled_rides: cancelled,
            completion_rate: total > 0 ? (completed / total) * 100 : 0,
            cancellation_rate: total > 0 ? (cancelled / total) * 100 : 0,
            total_earnings: totalEarnings,
            avg_rating: courierProfile?.rating || 0,
            recent_ratings: [],
          };
        }
        
        return {
          completed_rides: 0,
          cancelled_rides: 0,
          completion_rate: 0,
          cancellation_rate: 0,
          total_earnings: 0,
          avg_rating: 0,
          recent_ratings: [],
        };
      };

      // Combine profile, wallet, and KYC data
      let usersWithBalance = profiles.map(profile => {
        const wallet = wallets?.find(w => w.user_id === profile.id);
        const kycDoc = kycDocs?.find(doc => doc.user_id === profile.id);
        const driverProfile = driverProfiles?.find(dp => dp.user_id === profile.id);
        const courierProfile = courierProfiles?.find(cp => cp.user_id === profile.id);
        const performance = (profile.role === 'driver' || profile.role === 'courier') 
          ? calculatePerformance(profile.id, profile.role)
          : null;
        
        return {
          ...profile,
          balance: wallet?.balance || 0,
          kyc_status: kycDoc?.status || null,
          kyc_submitted_at: kycDoc?.created_at || null,
          kyc_updated_at: kycDoc?.updated_at || null,
          driver_profile: driverProfile || null,
          courier_profile: courierProfile || null,
          performance,
        };
      });

      // Filter by KYC status if specified
      if (kycFilter !== 'all') {
        usersWithBalance = usersWithBalance.filter(user => user.kyc_status === kycFilter);
      }

      setUsers(usersWithBalance);

      // Calculate statistics
      const roleCounts = {
        total: usersWithBalance.length,
        passenger: usersWithBalance.filter(u => u.role === 'passenger').length,
        driver: usersWithBalance.filter(u => u.role === 'driver').length,
        courier: usersWithBalance.filter(u => u.role === 'courier').length,
      };
      setStats(roleCounts);
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

  const toggleRowExpansion = (userId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ThemedCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Users</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </ThemedCard>
          <ThemedCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Passengers</div>
            <div className="text-3xl font-bold">{stats.passenger}</div>
          </ThemedCard>
          <ThemedCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Drivers</div>
            <div className="text-3xl font-bold">{stats.driver}</div>
          </ThemedCard>
          <ThemedCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Couriers</div>
            <div className="text-3xl font-bold">{stats.courier}</div>
          </ThemedCard>
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
              <Select value={periodFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month') => setPeriodFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
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
                    <TableHead>Registered</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>KYC Submitted</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <React.Fragment key={user.id}>
                    <TableRow>
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
                      <TableCell className="text-sm">
                        {user.created_at ? (
                          <div>
                            <div>{new Date(user.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(user.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
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
                      <TableCell className="text-sm">
                        {user.kyc_submitted_at ? (
                          <div>
                            <div>{new Date(user.kyc_submitted_at).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(user.kyc_submitted_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.kyc_updated_at ? (
                          <div>
                            <div>{new Date(user.kyc_updated_at).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(user.kyc_updated_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-lg">
                          {user.role === 'passenger' ? 'N/A' : `₱${user.balance.toFixed(2)}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row gap-2 justify-end items-end">
                          {(user.role === 'driver' || user.role === 'courier') && (
                            <SecondaryButton
                              onClick={() => toggleRowExpansion(user.id)}
                              className="text-xs px-2 py-1.5 h-auto whitespace-nowrap"
                            >
                              {expandedRows.has(user.id) ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  Details
                                </>
                              )}
                            </SecondaryButton>
                          )}
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

                    {/* Expanded Performance Metrics Row */}
                    {expandedRows.has(user.id) && (user.driver_profile || user.courier_profile) && user.performance && (
                      <TableRow key={`${user.id}-details`} className="bg-muted/30">
                        <TableCell colSpan={11} className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Performance Overview */}
                            <ThemedCard className="p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">Performance Metrics</h3>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                                  </div>
                                  <span className="font-bold text-lg text-green-600">
                                    {user.performance.completion_rate.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-muted-foreground">Cancellation Rate</span>
                                  </div>
                                  <span className="font-bold text-lg text-red-600">
                                    {user.performance.cancellation_rate.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-muted-foreground">Average Rating</span>
                                  </div>
                                  <span className="font-bold text-lg">
                                    ⭐ {user.performance.avg_rating.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </ThemedCard>

                            {/* Activity Stats */}
                            <ThemedCard className="p-4">
                              <h3 className="font-semibold text-lg mb-4">Activity Statistics</h3>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Completed {user.role === 'driver' ? 'Rides' : 'Deliveries'}</p>
                                  <p className="text-2xl font-bold text-green-600">{user.performance.completed_rides}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Cancelled</p>
                                  <p className="text-2xl font-bold text-red-600">{user.performance.cancelled_rides}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                                  <p className="text-2xl font-bold text-primary">₱{user.performance.total_earnings.toFixed(2)}</p>
                                </div>
                              </div>
                            </ThemedCard>

                            {/* Vehicle/Service Info */}
                            <ThemedCard className="p-4">
                              <div className="flex items-center gap-2 mb-4">
                                {user.role === 'driver' ? (
                                  <Car className="w-5 h-5 text-primary" />
                                ) : (
                                  <Package className="w-5 h-5 text-primary" />
                                )}
                                <h3 className="font-semibold text-lg">Service Details</h3>
                              </div>
                              {user.driver_profile && (
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Vehicle</p>
                                    <p className="font-medium capitalize">{user.driver_profile.vehicle_type} - {user.driver_profile.vehicle_model || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Plate Number</p>
                                    <p className="font-medium font-mono">{user.driver_profile.vehicle_plate}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Color</p>
                                    <p className="font-medium capitalize">{user.driver_profile.vehicle_color || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">License</p>
                                    <p className="font-medium">{user.driver_profile.license_number || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <Badge variant={user.driver_profile.is_available ? "default" : "secondary"}>
                                      {user.driver_profile.is_available ? 'Available' : 'Offline'}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              {user.courier_profile && (
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Vehicle</p>
                                    <p className="font-medium capitalize">{user.courier_profile.vehicle_type} - {user.courier_profile.vehicle_model || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Plate Number</p>
                                    <p className="font-medium font-mono">{user.courier_profile.vehicle_plate}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Color</p>
                                    <p className="font-medium capitalize">{user.courier_profile.vehicle_color || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">License</p>
                                    <p className="font-medium">{user.courier_profile.license_number || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <Badge variant={user.courier_profile.is_available ? "default" : "secondary"}>
                                      {user.courier_profile.is_available ? 'Available' : 'Offline'}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </ThemedCard>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
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
