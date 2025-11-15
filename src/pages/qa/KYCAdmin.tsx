import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { kycService } from '@/services/kyc';
import { KycDocument } from '@/types/kyc';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function QAKYCAdmin() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadDocuments();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadDocuments = async () => {
    try {
      const data = await kycService.listAllKycDocuments();
      setDocuments(data.slice(0, 25));
    } catch (error: any) {
      toast.error(`Failed to load: ${error.message}`);
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
    const reason = prompt('Rejection reason (optional):');
    try {
      await kycService.updateKycDocumentStatus(docId, 'REJECTED', reason || undefined);
      toast.success('Document rejected');
      loadDocuments();
    } catch (error: any) {
      toast.error(`Rejection failed: ${error.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Only</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page requires admin privileges (kx_admin role).
            </p>
            <Link to="/admin-sign-in">
              <Button className="gap-2">
                Go to Admin Sign In <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>KYC Admin QA - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">KYC Admin QA</h1>
          <p className="text-muted-foreground">
            Test Approve/Reject workflows (first 25 documents)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>KYC Documents Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No KYC documents found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create test data via /qa/ocr Panel C
                </p>
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
                    {documents.map((doc) => (
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
                            {doc.status === 'PENDING' || doc.status === 'REVIEW' ? (
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
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {doc.status}
                              </span>
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
      </div>
    </>
  );
}
