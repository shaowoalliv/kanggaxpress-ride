import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { kycService } from '@/services/kyc';
import type { KycDocument, KycStatus } from '@/types/kyc';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Search, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const STATUS_OPTIONS: KycStatus[] = ['PENDING', 'REVIEW', 'APPROVED', 'REJECTED'];

const statusLabel: Record<KycStatus, string> = {
  PENDING: 'Pending',
  REVIEW: 'In Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const statusVariant: Record<KycStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  REVIEW: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

interface DriverData {
  userId: string;
  accountNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  vehicleType: string | null;
  documents: KycDocument[];
  driverLicense?: KycDocument;
  or?: KycDocument;
  cr?: KycDocument;
}

export default function AdminKYC() {
  const [driversData, setDriversData] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | KycStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'courier'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    loadDriversData();
  }, []);

  const loadDriversData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles with driver or courier role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, account_number, phone')
        .in('role', ['driver', 'courier']);

      if (profilesError) throw profilesError;

      // Fetch all KYC documents
      const allDocs = await kycService.listAllKycDocuments();

      // Fetch driver profiles
      const { data: driverProfiles } = await supabase
        .from('driver_profiles')
        .select('user_id, vehicle_type');

      // Fetch courier profiles
      const { data: courierProfiles } = await supabase
        .from('courier_profiles')
        .select('user_id, vehicle_type');

      // Map profiles to driver data
      const driversMap = new Map<string, DriverData>();
      
      profiles?.forEach((profile) => {
        const docs = allDocs.filter((d) => d.user_id === profile.id);
        
        // Parse name
        const nameParts = profile.full_name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

        // Get vehicle type
        const driverProfile = driverProfiles?.find((dp) => dp.user_id === profile.id);
        const courierProfile = courierProfiles?.find((cp) => cp.user_id === profile.id);
        const vehicleType = driverProfile?.vehicle_type || courierProfile?.vehicle_type || null;

        driversMap.set(profile.id, {
          userId: profile.id,
          accountNumber: profile.account_number || '',
          firstName,
          middleName,
          lastName,
          fullName: profile.full_name,
          email: profile.email,
          role: profile.role,
          vehicleType,
          documents: docs,
          driverLicense: docs.find((d) => d.doc_type === 'DRIVER_LICENSE'),
          or: docs.find((d) => d.doc_type === 'OR'),
          cr: docs.find((d) => d.doc_type === 'CR'),
        });
      });

      setDriversData(Array.from(driversMap.values()));
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      await kycService.updateKycDocumentStatus(docId, 'APPROVED');
      toast.success('Document approved');
      
      // Find the document and driver info to send notification
      const doc = driversData.flatMap(d => d.documents).find(d => d.id === docId);
      const driver = driversData.find(d => d.documents.some(doc => doc.id === docId));
      
      if (doc && driver) {
        // Send approval notification email
        try {
          const { data, error } = await supabase.functions.invoke('send-kyc-approval', {
            body: {
              email: driver.email,
              driverName: driver.fullName,
              documentType: doc.doc_type.replace('_', ' '),
              userId: driver.userId,
            },
          });
          
          if (error) {
            console.error('Failed to send approval email:', error);
          } else {
            toast.success('Approval notification sent to driver');
          }
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }
      }
      
      await loadDriversData();
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message ?? 'Unknown error'}`);
    }
  };

  const handleRejectClick = (docId: string) => {
    setRejectingDocId(docId);
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectingDocId) return;
    
    try {
      await kycService.updateKycDocumentStatus(
        rejectingDocId,
        'REJECTED',
        rejectionReason || undefined
      );
      toast.success('Document rejected');
      setRejectingDocId(null);
      setRejectionReason('');
      await loadDriversData();
    } catch (error: any) {
      toast.error(`Rejection failed: ${error.message ?? 'Unknown error'}`);
    }
  };

  const loadImageUrl = async (doc: KycDocument) => {
    if (!doc.image_path || imageUrls[doc.id]) return;
    
    try {
      const url = await kycService.getDocumentImageUrl(doc.image_path);
      setImageUrls((prev) => ({ ...prev, [doc.id]: url }));
    } catch (err) {
      console.error('Failed to load image URL', err);
    }
  };

  const filteredDrivers = useMemo(() => {
    return driversData.filter((driver) => {
      // Role filter
      if (roleFilter !== 'all' && driver.role !== roleFilter) return false;

      // Status filter - check if any document matches the status
      if (statusFilter !== 'all') {
        const hasMatchingStatus = driver.documents.some((doc) => doc.status === statusFilter);
        if (!hasMatchingStatus) return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          driver.accountNumber.toLowerCase().includes(search) ||
          driver.firstName.toLowerCase().includes(search) ||
          driver.middleName.toLowerCase().includes(search) ||
          driver.lastName.toLowerCase().includes(search) ||
          driver.fullName.toLowerCase().includes(search) ||
          driver.email.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [driversData, roleFilter, statusFilter, searchTerm]);

  const getExpiryDate = (doc?: KycDocument) => {
    if (!doc) return null;
    const parsed = doc.parsed as any;
    return parsed?.expiry_date || parsed?.expire_date || null;
  };

  return (
    <>
      <Helmet>
        <title>KYC Queue - Admin - KanggaXpress</title>
        <meta
          name="description"
          content="Admin KYC queue for reviewing and approving driver and courier verification documents."
        />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="/admin/kyc" />
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">KYC Queue</h1>
          <p className="text-muted-foreground">
            Review and approve driver and courier KYC documents.
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, email, or account number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => setRoleFilter(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="courier">Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Drivers & Couriers ({filteredDrivers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading data...</span>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account #</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Middle Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver License</TableHead>
                      <TableHead>OR</TableHead>
                      <TableHead>CR</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => {
                      const dlDoc = driver.driverLicense;
                      const orDoc = driver.or;
                      const crDoc = driver.cr;

                      // Load images when row is rendered
                      if (dlDoc) loadImageUrl(dlDoc);
                      if (orDoc) loadImageUrl(orDoc);
                      if (crDoc) loadImageUrl(crDoc);

                      return (
                        <TableRow key={driver.userId}>
                          <TableCell className="font-mono text-sm">
                            {driver.accountNumber}
                          </TableCell>
                          <TableCell>{driver.firstName}</TableCell>
                          <TableCell>{driver.middleName || '—'}</TableCell>
                          <TableCell>{driver.lastName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase text-xs">
                              {driver.vehicleType || '—'}
                            </Badge>
                          </TableCell>

                          {/* Driver License */}
                          <TableCell className="align-top">
                            {dlDoc ? (
                              <div className="space-y-2">
                                <div className={`text-xs font-medium ${
                                  dlDoc.status === 'APPROVED' ? 'text-green-600' :
                                  dlDoc.status === 'REJECTED' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>
                                  {statusLabel[dlDoc.status]}
                                </div>
                                {getExpiryDate(dlDoc) && (
                                  <div className="text-xs text-muted-foreground">
                                    Exp: {getExpiryDate(dlDoc)}
                                  </div>
                                )}
                                {dlDoc.image_path && imageUrls[dlDoc.id] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-7"
                                    onClick={() => setZoomedImage(imageUrls[dlDoc.id])}
                                  >
                                    <ZoomIn className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                )}
                                <div className="flex gap-1">
                                  {dlDoc.status !== 'APPROVED' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="flex-1 h-7 text-xs"
                                      onClick={() => handleApprove(dlDoc.id)}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                  )}
                                  {dlDoc.status !== 'REJECTED' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="flex-1 h-7 text-xs"
                                      onClick={() => handleRejectClick(dlDoc.id)}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not submitted</span>
                            )}
                          </TableCell>

                          {/* OR */}
                          <TableCell className="align-top">
                            {orDoc ? (
                              <div className="space-y-2">
                                <div className={`text-xs font-medium ${
                                  orDoc.status === 'APPROVED' ? 'text-green-600' :
                                  orDoc.status === 'REJECTED' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>
                                  {statusLabel[orDoc.status]}
                                </div>
                                {getExpiryDate(orDoc) && (
                                  <div className="text-xs text-muted-foreground">
                                    Exp: {getExpiryDate(orDoc)}
                                  </div>
                                )}
                                {orDoc.image_path && imageUrls[orDoc.id] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-7"
                                    onClick={() => setZoomedImage(imageUrls[orDoc.id])}
                                  >
                                    <ZoomIn className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                )}
                                <div className="flex gap-1">
                                  {orDoc.status !== 'APPROVED' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="flex-1 h-7 text-xs"
                                      onClick={() => handleApprove(orDoc.id)}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                  )}
                                  {orDoc.status !== 'REJECTED' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="flex-1 h-7 text-xs"
                                      onClick={() => handleRejectClick(orDoc.id)}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not submitted</span>
                            )}
                          </TableCell>

                          {/* CR */}
                          <TableCell className="align-top">
                            {crDoc ? (
                              <div className="space-y-2">
                                <div className={`text-xs font-medium ${
                                  crDoc.status === 'APPROVED' ? 'text-green-600' :
                                  crDoc.status === 'REJECTED' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>
                                  {statusLabel[crDoc.status]}
                                </div>
                                {getExpiryDate(crDoc) && (
                                  <div className="text-xs text-muted-foreground">
                                    Exp: {getExpiryDate(crDoc)}
                                  </div>
                                )}
                                {crDoc.image_path && imageUrls[crDoc.id] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-7"
                                    onClick={() => setZoomedImage(imageUrls[crDoc.id])}
                                  >
                                    <ZoomIn className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                )}
                                <div className="flex gap-1">
                                  {crDoc.status !== 'APPROVED' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="flex-1 h-7 text-xs"
                                      onClick={() => handleApprove(crDoc.id)}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                  )}
                                  {crDoc.status !== 'REJECTED' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="flex-1 h-7 text-xs"
                                      onClick={() => handleRejectClick(crDoc.id)}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not submitted</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right align-top">
                            <div className="text-xs text-muted-foreground pt-1">
                              {driver.documents.length} docs total
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Zoom Dialog */}
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Document Image</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              {zoomedImage && (
                <img
                  src={zoomedImage}
                  alt="Document"
                  className="w-full h-auto"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Dialog */}
        <Dialog open={!!rejectingDocId} onOpenChange={() => setRejectingDocId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Rejection Reason (optional)</Label>
                <Input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRejectingDocId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRejectConfirm}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
