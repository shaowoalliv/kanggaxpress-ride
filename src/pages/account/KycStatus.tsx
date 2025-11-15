import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kycService } from '@/services/kyc';
import { KycDocument, DocType } from '@/types/kyc';
import { OcrCaptureCard } from '@/components/ocr/OcrCaptureCard';
import { OcrReviewModal } from '@/components/ocr/OcrReviewModal';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileText, CheckCircle, AlertCircle, Clock, Camera } from 'lucide-react';

const DOC_TYPE_LABELS: Record<DocType, string> = {
  GOVT_ID: 'Government ID',
  PRIVATE_ID: 'Private ID',
  DRIVER_LICENSE: 'Driver License',
  OR: 'Official Receipt (OR)',
  CR: 'Certificate of Registration (CR)',
  SELFIE: 'Selfie Verification',
};

export default function KycStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [reuploadDoc, setReuploadDoc] = useState<DocType | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    docType: DocType;
    imageUrl: string;
    parsed: any;
    avgConfidence: number;
  }>({ open: false, docType: 'GOVT_ID', imageUrl: '', parsed: {}, avgConfidence: 0 });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadDocuments();
  }, [user, navigate]);

  const loadDocuments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const docs = await kycService.getUserKycDocuments(user.id);
      setDocuments(docs);

      // Load signed URLs for images
      const urls: Record<string, string> = {};
      for (const doc of docs) {
        if (doc.image_path) {
          try {
            urls[doc.id] = await kycService.getDocumentImageUrl(doc.image_path);
          } catch (e) {
            console.warn('Failed to load image for', doc.id, e);
          }
        }
      }
      setPreviewUrls(urls);
    } catch (error) {
      toast.error('Failed to load KYC documents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOcrAccept = async (finalParsed: any, docType: DocType, imageBlob: Blob, avgConfidence: number) => {
    if (!user) return;
    try {
      const OCR_MIN = Number(import.meta.env.VITE_OCR_CONFIDENCE_MIN ?? 0.65);
      const status = docType !== 'SELFIE' && avgConfidence < OCR_MIN ? 'REVIEW' : 'PENDING';

      // Upload image
      const imagePath = await kycService.uploadDocumentImage(user.id, docType, imageBlob);

      // Create document
      await kycService.createKycDocument({
        user_id: user.id,
        doc_type: docType,
        parsed: finalParsed,
        confidence: avgConfidence,
        status,
        image_path: imagePath,
      });

      toast.success('Document re-uploaded successfully');
      setReuploadDoc(null);
      loadDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REVIEW': return 'outline';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'REVIEW': return <AlertCircle className="w-4 h-4" />;
      case 'REJECTED': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container max-w-4xl py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">KYC Status</h1>
          <p className="text-muted-foreground mt-2">View and manage your verification documents</p>
        </div>

        {documents.length === 0 ? (
          <ThemedCard className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
          </ThemedCard>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <ThemedCard key={doc.id} className="p-6">
                <div className="flex items-start gap-4">
                  {previewUrls[doc.id] && (
                    <img
                      src={previewUrls[doc.id]}
                      alt={doc.doc_type}
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {DOC_TYPE_LABELS[doc.doc_type as DocType] || doc.doc_type}
                      </h3>
                      <Badge variant={getStatusColor(doc.status)} className="flex items-center gap-1">
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Confidence: {(doc.confidence * 100).toFixed(1)}%</p>
                      <p>Submitted: {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>

                    {doc.status === 'REJECTED' && (
                      <div className="mt-3">
                        <p className="text-sm text-destructive mb-2">
                          {(doc.parsed as any)?.reject_reason || 'Document was rejected. Please re-upload.'}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReuploadDoc(doc.doc_type as DocType)}
                          className="flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Fix & Re-upload
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </ThemedCard>
            ))}
          </div>
        )}

        {reuploadDoc && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <ThemedCard className="w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Re-upload {DOC_TYPE_LABELS[reuploadDoc]}</h3>
              <OcrCaptureCard
                docType={reuploadDoc}
                onOcrComplete={(parsed, imageUrl, imageBlob, avgConfidence) => {
                  setReviewModal({
                    open: true,
                    docType: reuploadDoc,
                    imageUrl,
                    parsed,
                    avgConfidence,
                  });
                }}
              />
              <Button
                variant="ghost"
                onClick={() => setReuploadDoc(null)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </ThemedCard>
          </div>
        )}

        <OcrReviewModal
          open={reviewModal.open}
          onClose={() => setReviewModal({ ...reviewModal, open: false })}
          docType={reviewModal.docType}
          imageUrl={reviewModal.imageUrl}
          parsed={reviewModal.parsed}
          avgConfidence={reviewModal.avgConfidence}
          onAccept={(finalParsed) => {
            // Get imageBlob from the capture card (we need to pass it through)
            // For now, convert imageUrl back to blob
            fetch(reviewModal.imageUrl)
              .then(r => r.blob())
              .then(blob => handleOcrAccept(finalParsed, reviewModal.docType, blob, reviewModal.avgConfidence));
          }}
        />
      </div>
    </PageLayout>
  );
}
