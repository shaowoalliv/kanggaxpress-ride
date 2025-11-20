import { useState } from 'react';
import { ThemedCard } from './ui/ThemedCard';
import { PrimaryButton } from './ui/PrimaryButton';
import { SecondaryButton } from './ui/SecondaryButton';
import { AlertCircle, FileText, CheckCircle, XCircle, Clock, Upload, Camera } from 'lucide-react';
import { KycDocument } from '@/types/kyc';
import { PhotoCaptureCard } from './PhotoCaptureCard';
import { kycService } from '@/services/kyc';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface PhotoStaged {
  docType: string;
  imageBlob: Blob;
  imageUrl: string;
}

interface KycBlockedAccessProps {
  documents: KycDocument[];
  userName: string;
  userId: string;
  onDocumentUploaded?: () => void;
}

export function KycBlockedAccess({ documents, userName, userId, onDocumentUploaded }: KycBlockedAccessProps) {
  const [reuploadingDoc, setReuploadingDoc] = useState<string | null>(null);
  const [stagedPhoto, setStagedPhoto] = useState<PhotoStaged | null>(null);
  const [uploading, setUploading] = useState(false);

  const requiredDocs = [
    { type: 'DRIVER_LICENSE', name: "Driver's License" },
    { type: 'OR', name: 'Official Receipt (OR)' },
    { type: 'CR', name: 'Certificate of Registration (CR)' },
    { type: 'SELFIE', name: 'Selfie Photo' },
  ];

  const getDocStatus = (docType: string) => {
    const doc = documents.find(d => d.doc_type === docType);
    if (!doc) return { status: 'missing', label: 'Not Submitted', icon: XCircle, color: 'text-gray-500', doc: null };
    
    switch (doc.status) {
      case 'APPROVED':
        return { status: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600', doc };
      case 'REJECTED':
        return { status: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-600', doc };
      case 'REVIEW':
        return { status: 'review', label: 'Under Review', icon: Clock, color: 'text-blue-600', doc };
      case 'PENDING':
      default:
        return { status: 'pending', label: 'Pending Review', icon: Clock, color: 'text-yellow-600', doc };
    }
  };

  const allApproved = requiredDocs.every(doc => {
    const status = getDocStatus(doc.type);
    return status.status === 'approved';
  });

  const hasRejected = documents.some(d => d.status === 'REJECTED');

  const handlePhotoCapture = (docType: string, blob: Blob, url: string) => {
    setStagedPhoto({ docType, imageBlob: blob, imageUrl: url });
  };

  const handleRemovePhoto = () => {
    if (stagedPhoto?.imageUrl) {
      URL.revokeObjectURL(stagedPhoto.imageUrl);
    }
    setStagedPhoto(null);
  };

  const handleUploadReplacement = async () => {
    if (!stagedPhoto || !reuploadingDoc) return;

    try {
      setUploading(true);

      // Upload image to storage
      const imagePath = await kycService.uploadDocumentImage(
        userId,
        reuploadingDoc as any,
        stagedPhoto.imageBlob
      );

      // Create new document entry (this replaces the rejected one)
      await kycService.createKycDocument({
        user_id: userId,
        doc_type: reuploadingDoc as any,
        parsed: {}, // No OCR - manual review
        confidence: 1.0,
        status: 'PENDING',
        image_path: imagePath,
      });

      toast({
        title: "Document Uploaded",
        description: "Your replacement document has been submitted for review.",
      });

      // Clean up
      handleRemovePhoto();
      setReuploadingDoc(null);

      // Notify parent to reload
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const openReuploadDialog = (docType: string) => {
    setReuploadingDoc(docType);
    setStagedPhoto(null);
  };

  const closeReuploadDialog = () => {
    setReuploadingDoc(null);
    handleRemovePhoto();
  };

  const getDocumentName = (docType: string) => {
    return requiredDocs.find(d => d.type === docType)?.name || docType;
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <ThemedCard className="max-w-2xl w-full p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Account Access Restricted</h1>
            <p className="text-muted-foreground">
              Hello {userName}, your account access is currently restricted pending KYC document approval.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">KYC Document Verification Required</p>
                <p className="text-blue-700">
                  All documents must be approved by our admin team before you can access the system and accept jobs.
                  {hasRejected && ' Some documents were rejected - you can re-upload them below.'}
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Document Status
              </h3>
              <div className="space-y-2">
                {requiredDocs.map((doc) => {
                  const status = getDocStatus(doc.type);
                  const Icon = status.icon;
                  
                  return (
                    <div key={doc.type} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{doc.name}</span>
                        {status.status === 'rejected' && status.doc && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {(status.doc as any).rejection_reason || 'No reason provided'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 ${status.color}`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{status.label}</span>
                        </div>
                        {status.status === 'rejected' && (
                          <SecondaryButton
                            onClick={() => openReuploadDialog(doc.type)}
                            className="text-xs px-3 py-1.5 h-auto"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Re-upload
                          </SecondaryButton>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {hasRejected && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Action Required
                </h4>
                <p className="text-sm text-red-700">
                  Some of your documents were rejected. Please review the rejection reasons above and re-upload corrected documents.
                </p>
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-semibold">What happens next?</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Our admin team is reviewing your submitted documents</li>
              <li>You will receive a notification once all documents are approved</li>
              <li>Approval typically takes 1-3 business days</li>
              <li>Once approved, you can immediately start accepting jobs</li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>Need help? Contact support at <span className="font-medium">support@kanggaxpress.com</span></p>
          </div>
        </ThemedCard>
      </div>

      {/* Re-upload Dialog */}
      <Dialog open={!!reuploadingDoc} onOpenChange={(open) => !open && closeReuploadDialog()}>
        <DialogContent className="bg-background max-w-md">
          <DialogHeader>
            <DialogTitle>Re-upload Document</DialogTitle>
            <DialogDescription>
              Upload a new photo for: {reuploadingDoc && getDocumentName(reuploadingDoc)}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {reuploadingDoc && (
              <PhotoCaptureCard
                title={getDocumentName(reuploadingDoc)}
                description="Take a clear photo of your document"
                onCapture={(blob, url) => handlePhotoCapture(reuploadingDoc, blob, url)}
                captured={!!stagedPhoto && stagedPhoto.docType === reuploadingDoc}
              />
            )}

            {stagedPhoto && (
              <div className="mt-4 flex gap-2">
                <PrimaryButton
                  onClick={handleUploadReplacement}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : 'Submit for Review'}
                </PrimaryButton>
                <SecondaryButton
                  onClick={closeReuploadDialog}
                  disabled={uploading}
                >
                  Cancel
                </SecondaryButton>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

