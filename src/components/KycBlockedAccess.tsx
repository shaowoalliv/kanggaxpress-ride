import { ThemedCard } from './ui/ThemedCard';
import { AlertCircle, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { KycDocument } from '@/types/kyc';

interface KycBlockedAccessProps {
  documents: KycDocument[];
  userName: string;
}

export function KycBlockedAccess({ documents, userName }: KycBlockedAccessProps) {
  const requiredDocs = [
    { type: 'DRIVER_LICENSE', name: "Driver's License" },
    { type: 'OR', name: 'Official Receipt (OR)' },
    { type: 'CR', name: 'Certificate of Registration (CR)' },
    { type: 'SELFIE', name: 'Selfie Photo' },
  ];

  const getDocStatus = (docType: string) => {
    const doc = documents.find(d => d.doc_type === docType);
    if (!doc) return { status: 'missing', label: 'Not Submitted', icon: XCircle, color: 'text-gray-500' };
    
    switch (doc.status) {
      case 'APPROVED':
        return { status: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' };
      case 'REJECTED':
        return { status: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-600' };
      case 'REVIEW':
        return { status: 'review', label: 'Under Review', icon: Clock, color: 'text-blue-600' };
      case 'PENDING':
      default:
        return { status: 'pending', label: 'Pending Review', icon: Clock, color: 'text-yellow-600' };
    }
  };

  const allApproved = requiredDocs.every(doc => {
    const status = getDocStatus(doc.type);
    return status.status === 'approved';
  });

  const hasRejected = documents.some(d => d.status === 'REJECTED');

  return (
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
                {hasRejected && ' Some documents were rejected - please check the status below.'}
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
                    <span className="font-medium text-sm">{doc.name}</span>
                    <div className={`flex items-center gap-2 ${status.color}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{status.label}</span>
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
                Some of your documents were rejected. Please contact support or check your email for details on what needs to be corrected.
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
  );
}
