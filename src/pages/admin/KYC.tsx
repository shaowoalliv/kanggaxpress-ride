import { useState, useEffect } from 'react';
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
import { kycService } from '@/services/kyc';
import { KycDocument, KycStatus, DocType } from '@/types/kyc';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

export default function AdminKYC() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<KycStatus[]>([]);
  const [docTypeFilter, setDocTypeFilter] = useState<DocType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
  const [showJsonDialog, setShowJsonDialog] = useState(false);

  useEffect(() => {
    loadDocuments();
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
      toast.error(`Failed to load documents: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      await kycService.updateKycDocumentStatus(docId, 'APPROVED');
      toast.success('Document approved');
      loadDocuments();
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleReject = async (docId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    try {
      await kycService.updateKycDocumentStatus(docId, 'REJECTED', reason || undefined);
      toast.success('Document rejected');
      loadDocuments();
    } catch (error: any) {
      toast.error(`Rejection failed: ${error.message}`);
    }
  };

  const viewJson = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setShowJsonDialog(true);
  };

  const filteredDocs = documents.filter(doc => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      doc.user_id.toLowerCase().includes(search) ||
      JSON.stringify(doc.parsed).toLowerCase().includes(search)
    );
  });

  return (
    <>
      <Helmet>
        <title>KYC - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-heading mb-2">KYC Queue</h2>
          <p className="text-muted-foreground">Review and approve KYC documents</p>
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
                  value={statusFilter.join(',') || 'all'}
                  onValueChange={(v) => setStatusFilter(v === 'all' ? [] : v.split(',') as KycStatus[])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={docTypeFilter.join(',') || 'all'}
                  onValueChange={(v) => setDocTypeFilter(v === 'all' ? [] : v.split(',') as DocType[])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="GOVT_ID">Government ID</SelectItem>
                    <SelectItem value="PRIVATE_ID">Private ID</SelectItem>
                    <SelectItem value="DRIVER_LICENSE">Driver License</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                    <SelectItem value="CR">CR</SelectItem>
                    <SelectItem value="SELFIE">Selfie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="User ID or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Documents ({filteredDocs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No documents found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Doc Type</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono text-xs">
                          {doc.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.doc_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={doc.confidence >= 0.65 ? 'default' : 'destructive'}
                          >
                            {(doc.confidence * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doc.status === 'APPROVED'
                                ? 'default'
                                : doc.status === 'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => viewJson(doc)}
                              className="gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </Button>
                            {(doc.status === 'PENDING' || doc.status === 'REVIEW') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(doc.id)}
                                  className="gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(doc.id)}
                                  className="gap-1"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* JSON Viewer Dialog */}
        <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Document Data</DialogTitle>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Doc Type:</span>{' '}
                    <Badge>{selectedDoc.doc_type}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <Badge>{selectedDoc.status}</Badge>
                  </div>
                </div>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
                  {JSON.stringify(selectedDoc.parsed, null, 2)}
                </pre>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
