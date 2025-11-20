import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, History, User, X, Car, Package, ChevronDown, ChevronUp, TrendingUp, Award, CheckCircle2, XCircle, FileText, Calendar, Phone, MapPin, CreditCard, Download } from 'lucide-react';
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
import { kycService } from '@/services/kyc';
import { KycDocument } from '@/types/kyc';
import jsPDF from 'jspdf';

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
  kyc_documents?: KycDocument[];
  document_images?: { [key: string]: string };
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
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());
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

  const toggleRowExpansion = async (userId: string) => {
    const newSet = new Set(expandedRows);
    
    if (newSet.has(userId)) {
      newSet.delete(userId);
      setExpandedRows(newSet);
    } else {
      newSet.add(userId);
      setExpandedRows(newSet);
      
      // Load KYC documents if not already loaded
      const user = users.find(u => u.id === userId);
      if (user && !user.kyc_documents) {
        setLoadingDocs(prev => new Set(prev).add(userId));
        
        try {
          const docs = await kycService.getUserKycDocuments(userId);
          const imageUrls: { [key: string]: string } = {};
          
          for (const doc of docs) {
            if (doc.image_path) {
              const url = await kycService.getDocumentImageUrl(doc.image_path);
              imageUrls[doc.doc_type] = url;
            }
          }
          
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === userId 
                ? { ...u, kyc_documents: docs, document_images: imageUrls }
                : u
            )
          );
        } catch (error) {
          console.error('Error loading KYC documents:', error);
        } finally {
          setLoadingDocs(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    }
  };

  const exportDriverPDF = async (user: UserProfile) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare the report...",
      });

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add text with line break management
      const addText = (text: string, x: number, size: number = 10, bold: boolean = false) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(size);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.text(text, x, yPosition);
        yPosition += size / 2 + 2;
      };

      // Header
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KanggaXpress Driver Report', pageWidth / 2, 18, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      yPosition = 40;

      // Personal Information
      addText('PERSONAL INFORMATION', 14, 14, true);
      yPosition += 5;
      addText(`Name: ${user.full_name}`, 14);
      addText(`Email: ${user.email}`, 14);
      addText(`Phone: ${user.phone || 'N/A'}`, 14);
      addText(`Account Number: ${user.account_number || 'N/A'}`, 14);
      addText(`Role: ${user.role.toUpperCase()}`, 14);
      addText(`Registered: ${new Date(user.created_at).toLocaleDateString()}`, 14);
      
      const birthdate = user.kyc_documents?.find(d => d.doc_type === 'DRIVER_LICENSE');
      if (birthdate) {
        addText(`Birth Date: ${(birthdate.parsed as any)?.birthdate || 'N/A'}`, 14);
      }
      
      const address = user.kyc_documents?.find(d => d.doc_type === 'DRIVER_LICENSE');
      if (address) {
        addText(`Address: ${(address.parsed as any)?.address || 'N/A'}`, 14);
      }

      yPosition += 10;

      // Vehicle Information
      const profile = user.driver_profile || user.courier_profile;
      if (profile) {
        addText('VEHICLE INFORMATION', 14, 14, true);
        yPosition += 5;
        addText(`Type: ${profile.vehicle_type.toUpperCase()}`, 14);
        addText(`Model: ${profile.vehicle_model || 'N/A'}`, 14);
        addText(`Plate Number: ${profile.vehicle_plate}`, 14);
        addText(`Color: ${profile.vehicle_color || 'N/A'}`, 14);
        addText(`License Number: ${profile.license_number || 'N/A'}`, 14);
        
        const licensExpiry = user.kyc_documents?.find(d => d.doc_type === 'DRIVER_LICENSE');
        if (licensExpiry) {
          addText(`License Expiry: ${(licensExpiry.parsed as any)?.expiry_date || 'N/A'}`, 14);
        }
        
        const crExpiry = user.kyc_documents?.find(d => d.doc_type === 'CR');
        if (crExpiry) {
          addText(`CR Expiry: ${(crExpiry.parsed as any)?.expiry_date || 'N/A'}`, 14);
        }

        yPosition += 10;
      }

      // Performance Metrics
      if (user.performance) {
        addText('PERFORMANCE METRICS', 14, 14, true);
        yPosition += 5;
        addText(`Average Rating: ${user.performance.avg_rating.toFixed(1)} / 5.0`, 14);
        addText(`Completion Rate: ${user.performance.completion_rate.toFixed(1)}%`, 14);
        addText(`Completed Rides: ${user.performance.completed_rides}`, 14);
        addText(`Cancelled Rides: ${user.performance.cancelled_rides}`, 14);
        addText(`Cancellation Rate: ${user.performance.cancellation_rate.toFixed(1)}%`, 14);
        addText(`Total Earnings: ₱${user.performance.total_earnings.toFixed(2)}`, 14);
        
        yPosition += 10;
      }

      // KYC Status
      addText('KYC INFORMATION', 14, 14, true);
      yPosition += 5;
      addText(`Status: ${user.kyc_status || 'N/A'}`, 14);
      if (user.kyc_submitted_at) {
        addText(`Submitted: ${new Date(user.kyc_submitted_at).toLocaleString()}`, 14);
      }
      if (user.kyc_updated_at) {
        addText(`Last Updated: ${new Date(user.kyc_updated_at).toLocaleString()}`, 14);
      }

      yPosition += 10;

      // KYC Documents
      if (user.kyc_documents && user.kyc_documents.length > 0) {
        addText('KYC DOCUMENTS', 14, 14, true);
        yPosition += 5;

        for (const doc of user.kyc_documents) {
          const docName = doc.doc_type === 'DRIVER_LICENSE' ? "Driver's License" :
                         doc.doc_type === 'SELFIE' ? 'Selfie Photo' :
                         doc.doc_type === 'OR' ? 'Official Receipt' :
                         doc.doc_type === 'CR' ? 'Certificate of Registration' :
                         doc.doc_type;
          
          addText(`${docName}: ${doc.status}`, 14);

          // Add document image if available
          if (user.document_images?.[doc.doc_type]) {
            try {
              if (yPosition > pageHeight - 80) {
                pdf.addPage();
                yPosition = 20;
              }

              const img = new Image();
              img.crossOrigin = 'anonymous';
              
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  try {
                    const canvas = document.createElement('canvas');
                    const maxWidth = pageWidth - 28;
                    const maxHeight = 60;
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                      height = (maxWidth / width) * height;
                      width = maxWidth;
                    }
                    
                    if (height > maxHeight) {
                      width = (maxHeight / height) * width;
                      height = maxHeight;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.7);
                    pdf.addImage(imgData, 'JPEG', 14, yPosition, width, height);
                    yPosition += height + 10;
                    resolve(null);
                  } catch (error) {
                    console.error('Error processing image:', error);
                    resolve(null);
                  }
                };
                img.onerror = () => resolve(null);
                img.src = user.document_images![doc.doc_type];
              });
            } catch (error) {
              console.error('Error loading image:', error);
            }
          }
        }
      }

      // Footer
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${totalPages} - Generated on ${new Date().toLocaleString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `driver-report-${user.account_number || user.id}-${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Success",
        description: "Driver report downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
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
                            <>
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
                              <SecondaryButton
                                onClick={() => exportDriverPDF(user)}
                                className="text-xs px-2 py-1.5 h-auto whitespace-nowrap"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Export
                              </SecondaryButton>
                            </>
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

                    {/* Expanded Details Row */}
                    {expandedRows.has(user.id) && (user.driver_profile || user.courier_profile) && (
                      <TableRow key={`${user.id}-details`} className="bg-muted/30">
                        <TableCell colSpan={11} className="p-6">
                          {loadingDocs.has(user.id) ? (
                            <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
                          ) : (
                            <div className="space-y-6">
                              {/* Personal Information */}
                              <ThemedCard className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <User className="w-5 h-5 text-primary" />
                                  <h4 className="font-semibold">Personal Information</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                      <User className="w-3 h-3" /> Full Name
                                    </p>
                                    <p className="font-medium">{user.full_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> Contact Number
                                    </p>
                                    <p className="font-medium">{user.phone || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> Birth Date
                                    </p>
                                    <p className="font-medium">
                                      {(() => {
                                        const doc = user.kyc_documents?.find(d => d.doc_type === 'DRIVER_LICENSE');
                                        return (doc?.parsed as any)?.birthdate || 'N/A';
                                      })()}
                                    </p>
                                  </div>
                                  <div className="md:col-span-3">
                                    <p className="text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> Address
                                    </p>
                                    <p className="font-medium">
                                      {(() => {
                                        const doc = user.kyc_documents?.find(d => d.doc_type === 'DRIVER_LICENSE');
                                        return (doc?.parsed as any)?.address || 'N/A';
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              </ThemedCard>

                              {/* Vehicle Information */}
                              <ThemedCard className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <Car className="w-5 h-5 text-primary" />
                                  <h4 className="font-semibold">Vehicle Information</h4>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Type</p>
                                    <p className="font-medium capitalize">
                                      {user.driver_profile?.vehicle_type || user.courier_profile?.vehicle_type}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Model</p>
                                    <p className="font-medium">
                                      {user.driver_profile?.vehicle_model || user.courier_profile?.vehicle_model || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Plate Number</p>
                                    <p className="font-medium">
                                      {user.driver_profile?.vehicle_plate || user.courier_profile?.vehicle_plate}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Color</p>
                                    <p className="font-medium">
                                      {user.driver_profile?.vehicle_color || user.courier_profile?.vehicle_color || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> License Expiry
                                    </p>
                                    <p className="font-medium">
                                      {(() => {
                                        const doc = user.kyc_documents?.find(d => d.doc_type === 'DRIVER_LICENSE');
                                        return (doc?.parsed as any)?.expiry_date || 'N/A';
                                      })()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> CR Expiry
                                    </p>
                                    <p className="font-medium">
                                      {(() => {
                                        const doc = user.kyc_documents?.find(d => d.doc_type === 'CR');
                                        return (doc?.parsed as any)?.expiry_date || 'N/A';
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              </ThemedCard>

                              {/* Performance Metrics */}
                              {user.performance && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <ThemedCard className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <TrendingUp className="w-4 h-4 text-primary" />
                                      <h4 className="font-semibold text-sm">Rating</h4>
                                    </div>
                                    <p className="text-2xl font-bold">{user.performance.avg_rating.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground">Average Rating</p>
                                  </ThemedCard>

                                  <ThemedCard className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      <h4 className="font-semibold text-sm">Completion</h4>
                                    </div>
                                    <p className="text-2xl font-bold">{user.performance.completion_rate.toFixed(1)}%</p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.performance.completed_rides} completed
                                    </p>
                                  </ThemedCard>

                                  <ThemedCard className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <XCircle className="w-4 h-4 text-red-500" />
                                      <h4 className="font-semibold text-sm">Cancellations</h4>
                                    </div>
                                    <p className="text-2xl font-bold">{user.performance.cancellation_rate.toFixed(1)}%</p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.performance.cancelled_rides} cancelled
                                    </p>
                                  </ThemedCard>

                                  <ThemedCard className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CreditCard className="w-4 h-4 text-primary" />
                                      <h4 className="font-semibold text-sm">Earnings</h4>
                                    </div>
                                    <p className="text-2xl font-bold">₱{user.performance.total_earnings.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                  </ThemedCard>
                                </div>
                              )}

                              {/* KYC Documents */}
                              {user.kyc_documents && user.kyc_documents.length > 0 && (
                                <ThemedCard className="p-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <h4 className="font-semibold">KYC Documents</h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {user.kyc_documents.map((doc) => (
                                      <div key={doc.id} className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                          {doc.doc_type === 'DRIVER_LICENSE' ? "Driver's License" :
                                           doc.doc_type === 'SELFIE' ? 'Selfie Photo' :
                                           doc.doc_type === 'OR' ? 'Official Receipt' :
                                           doc.doc_type === 'CR' ? 'Certificate of Registration' :
                                           doc.doc_type}
                                        </p>
                                        {user.document_images?.[doc.doc_type] ? (
                                          <a 
                                            href={user.document_images[doc.doc_type]} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="block"
                                          >
                                            <img 
                                              src={user.document_images[doc.doc_type]} 
                                              alt={doc.doc_type}
                                              className="w-full h-32 object-cover rounded border border-border hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                          </a>
                                        ) : (
                                          <div className="w-full h-32 bg-muted rounded border border-border flex items-center justify-center">
                                            <p className="text-xs text-muted-foreground">No image</p>
                                          </div>
                                        )}
                                        <div className="text-xs">
                                          <span className={`inline-block px-2 py-1 rounded ${
                                            doc.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                            doc.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {doc.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ThemedCard>
                              )}
                            </div>
                          )}
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
