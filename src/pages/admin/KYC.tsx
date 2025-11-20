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
import type { KycDocument, KycStatus, DocType } from '@/types/kyc';
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

function formatConfidence(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(normalized)}%`;
}

function shortUserId(id: string): string {
  if (!id) return '';
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
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

  const handleSearch = () => {
    // Search is handled by filteredDrivers memo
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
            Review and approve driver and courier KYC documents with sidembyde photo comparison.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter[0] ?? 'all'}
                  onValueChange={(value) =>
                    setStatusFilter(value === 'all' ? [] : [value as KycStatus])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={docTypeFilter[0] ?? 'all'}
                  onValueChange={(value) =>
                    setDocTypeFilter(value === 'all' ? [] : [value as DocType])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {DOC_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="User ID, doc type, or content"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents table */}
        <Card>
          <CardHeader>
            <CardTitle>Documents ({filteredDocs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading documents</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No documents match your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Doc Type</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">
                        {shortUserId(doc.user_id)}
                      </TableCell>
                      <TableCell className="uppercase text-xs font-medium">
                        <Badge variant="outline">{doc.doc_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatConfidence(doc.confidence)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[doc.status]}>{statusLabel[doc.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleApprove(doc.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(doc.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Details dialog with sidebyde photos */}
        <Dialog
          open={showDetailsDialog && !!selectedDoc}
          onOpenChange={(open) => {
            setShowDetailsDialog(open);
            if (!open) setSelectedDoc(null);
          }}
        >
          <DialogContent className="max-w-5xl">
            {selectedDoc && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    KYC Review  b7 {selectedDoc.doc_type}  b7{' '}
                    <span className="font-mono text-sm text-muted-foreground">
                      {shortUserId(selectedDoc.user_id)}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-4 grid gap-6 md:grid-cols-[2fr,1.4fr]">
                  {/* Primary document */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Primary document</p>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="uppercase">
                            {selectedDoc.doc_type}
                          </Badge>
                          <Badge variant={statusVariant[selectedDoc.status]}>
                            {statusLabel[selectedDoc.status]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleApprove(selectedDoc.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(selectedDoc.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center min-h-[260px]">
                      {selectedDoc.image_path ? (
                        imageUrls[selectedDoc.id] ? (
                          <img
                            src={imageUrls[selectedDoc.id]}
                            alt={`${selectedDoc.doc_type} document image`}
                            className="w-full max-h-[420px] object-contain"
                          />
                        ) : imagesLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Loading photo</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <ImageIcon className="h-6 w-6" />
                            <span className="text-sm">Photo not available</span>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-sm">No image uploaded for this document</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Extracted data (JSON)</Label>
                      <ScrollArea className="h-56 rounded-md border border-border bg-muted/40 p-3 text-xs font-mono">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedDoc.parsed ?? {}, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Other documents for this user */}
                  <div className="space-y-3 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
                    <div>
                      <p className="text-sm font-semibold">All documents for this user</p>
                      <p className="text-xs text-muted-foreground">
                        Compare photos and quickly approve or reject each required document.
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {selectedUserDocs.map((doc) => (
                        <Card
                          key={doc.id}
                          className={`border transition-colors ${
                            doc.id === selectedDoc.id ? 'border-primary shadow-sm' : 'border-border'
                          }`}
                        >
                          <CardContent className="py-3 flex gap-3 items-start">
                            <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                              {doc.image_path && imageUrls[doc.id] ? (
                                <img
                                  src={imageUrls[doc.id]}
                                  alt={`${doc.doc_type} thumbnail`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    {doc.doc_type}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(doc.created_at).toLocaleString()}
                                  </div>
                                </div>
                                <Badge variant={statusVariant[doc.status]}>{statusLabel[doc.status]}</Badge>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedDoc(doc)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Focus
                                </Button>
                                {doc.status !== 'APPROVED' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleApprove(doc.id)}
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                {doc.status !== 'REJECTED' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(doc.id)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
