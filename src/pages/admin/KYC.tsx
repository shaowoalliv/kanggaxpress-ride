import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { kycService } from '@/services/kyc';
import type { KycDocument, KycStatus, DocType } from '@/types/kyc';
import { toast } from 'sonner';
import { CheckCircle2, Eye, ImageIcon, Loader2, XCircle } from 'lucide-react';

const STATUS_OPTIONS: KycStatus[] = ['PENDING', 'REVIEW', 'APPROVED', 'REJECTED'];
const DOC_TYPE_OPTIONS: DocType[] = ['GOVT_ID', 'PRIVATE_ID', 'DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'];

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
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<KycStatus[]>([]);
  const [docTypeFilter, setDocTypeFilter] = useState<DocType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imagesLoading, setImagesLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, docTypeFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await kycService.listAllKycDocuments({
        status: statusFilter.length > 0 ? statusFilter : undefined,
        docType: docTypeFilter.length > 0 ? docTypeFilter : undefined,
      });
      setDocuments(data);
    } catch (error: any) {
      toast.error(`Failed to load documents: ${error.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      await kycService.updateKycDocumentStatus(docId, 'APPROVED');
      toast.success('Document approved');
      await loadDocuments();
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message ?? 'Unknown error'}`);
    }
  };

  const handleReject = async (docId: string) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      await kycService.updateKycDocumentStatus(docId, 'REJECTED', reason || undefined);
      toast.success('Document rejected');
      await loadDocuments();
    } catch (error: any) {
      toast.error(`Rejection failed: ${error.message ?? 'Unknown error'}`);
    }
  };

  const openDetails = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setShowDetailsDialog(true);
  };

  // All documents for the currently selected user (driver/courier)
  const selectedUserDocs = useMemo(
    () =>
      selectedDoc
        ? documents
            .filter((d) => d.user_id === selectedDoc.user_id)
            .sort((a, b) => a.doc_type.localeCompare(b.doc_type))
        : [],
    [selectedDoc, documents]
  );

  // Load signed URLs for all documents of the selected user
  useEffect(() => {
    if (!selectedDoc || selectedUserDocs.length === 0) return;

    const docsNeedingUrl = selectedUserDocs.filter(
      (doc) => doc.image_path && !imageUrls[doc.id]
    );
    if (docsNeedingUrl.length === 0) return;

    let cancelled = false;
    setImagesLoading(true);

    (async () => {
      try {
        const results = await Promise.all(
          docsNeedingUrl.map(async (doc) => {
            if (!doc.image_path) return null;
            try {
              const url = await kycService.getDocumentImageUrl(doc.image_path);
              return { id: doc.id, url } as const;
            } catch (err) {
              console.error('Failed to load image URL', err);
              return null;
            }
          })
        );

        if (cancelled) return;

        setImageUrls((prev) => {
          const next = { ...prev };
          for (const item of results) {
            if (item) next[item.id] = item.url;
          }
          return next;
        });
      } finally {
        if (!cancelled) setImagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDoc, selectedUserDocs, imageUrls]);

  const filteredDocs = useMemo(
    () =>
      documents.filter((doc) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          doc.user_id.toLowerCase().includes(search) ||
          doc.doc_type.toLowerCase().includes(search) ||
          JSON.stringify(doc.parsed).toLowerCase().includes(search)
        );
      }),
    [documents, searchTerm]
  );

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
