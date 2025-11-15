import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OcrReviewModal } from '@/components/ocr/OcrReviewModal';
import { mapFieldsToSchema } from '@/lib/ocr/fieldMaps';
import { ParsedData } from '@/types/kyc';
import { kycService } from '@/services/kyc';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

const OCR_MIN = Number(import.meta.env.VITE_OCR_CONFIDENCE_MIN ?? 0.65);

export default function QAOOCR() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSample, setCurrentSample] = useState<{
    docType: 'GOVT_ID' | 'DRIVER_LICENSE';
    parsed: ParsedData;
    confidence: number;
  } | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const sampleGovtId055: ParsedData = mapFieldsToSchema('GOVT_ID', {
    id_type: 'National ID',
    id_no: '1234-5678-9012',
    fullname: 'Juan Dela Cruz',
    name_first: 'Juan',
    name_last: 'Dela Cruz',
    birthdate: '1990-05-15',
    sex: 'M',
    address_line1: '123 Main St',
    city: 'Calapan',
    province: 'Oriental Mindoro',
  });

  const sampleGovtId078: ParsedData = mapFieldsToSchema('GOVT_ID', {
    id_type: 'National ID',
    id_no: '9876-5432-1098',
    fullname: 'Maria Santos',
    name_first: 'Maria',
    name_last: 'Santos',
    birthdate: '1985-08-22',
    sex: 'F',
    address_line1: '456 Oak Ave',
    city: 'Calapan',
    province: 'Oriental Mindoro',
  });

  const handleOpenSample = (confidence: number, docType: 'GOVT_ID' | 'DRIVER_LICENSE') => {
    const parsed = confidence < OCR_MIN ? sampleGovtId055 : sampleGovtId078;
    setCurrentSample({ docType, parsed, confidence });
    setModalOpen(true);
  };

  const handleAccept = (finalParsed: ParsedData) => {
    toast.success('Sample accepted and data captured');
    setTestResults(prev => ({
      ...prev,
      [`sample_${currentSample?.confidence}`]: true,
    }));
  };

  const testWriteToDb = async () => {
    if (!user) {
      toast.error('Sign in required for this test');
      return;
    }

    try {
      await kycService.createKycDocument({
        user_id: user.id,
        doc_type: 'GOVT_ID',
        parsed: sampleGovtId078,
        confidence: 0.78,
        status: 'PENDING',
      });
      toast.success('Test document written to kyc_documents');
      setTestResults(prev => ({ ...prev, db_write: true }));
    } catch (error: any) {
      toast.error(`DB write failed: ${error.message}`);
      setTestResults(prev => ({ ...prev, db_write: false }));
    }
  };

  return (
    <>
      <Helmet>
        <title>OCR QA - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">OCR Quality Assurance</h1>
          <p className="text-muted-foreground">
            Test OCR confidence gating and field autofill
          </p>
        </div>

        {/* Panel A: Confidence Gating */}
        <Card>
          <CardHeader>
            <CardTitle>Panel A: Confidence Threshold Gating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">Low Confidence (0.55)</p>
                <p className="text-sm text-muted-foreground">
                  Should block Accept button
                </p>
              </div>
              <div className="flex items-center gap-3">
                {testResults['sample_0.55'] && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> PASS
                  </Badge>
                )}
                <Button onClick={() => handleOpenSample(0.55, 'GOVT_ID')}>
                  Test @ 55%
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">High Confidence (0.78)</p>
                <p className="text-sm text-muted-foreground">
                  Should allow Accept button
                </p>
              </div>
              <div className="flex items-center gap-3">
                {testResults['sample_0.78'] && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> PASS
                  </Badge>
                )}
                <Button onClick={() => handleOpenSample(0.78, 'GOVT_ID')}>
                  Test @ 78%
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Threshold:</strong> {(OCR_MIN * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Set via VITE_OCR_CONFIDENCE_MIN environment variable
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Panel B: Field Mapping */}
        <Card>
          <CardHeader>
            <CardTitle>Panel B: Field Mapping Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mapped fields from high-confidence sample:
            </p>
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg font-mono text-xs">
              {Object.entries(sampleGovtId078)
                .filter(([k]) => k !== 'field_confidences')
                .map(([key, value]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">{key}:</span>{' '}
                    <span className="font-semibold">{String(value)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel C: Database Write */}
        <Card>
          <CardHeader>
            <CardTitle>Panel C: Database Write Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Write a sample KYC document to the database
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={testWriteToDb} disabled={!user}>
                {user ? 'Write Test Document' : 'Sign in required'}
              </Button>
              {testResults.db_write === true && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" /> PASS
                </Badge>
              )}
              {testResults.db_write === false && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" /> FAIL
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review Modal */}
        {currentSample && (
          <OcrReviewModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            docType={currentSample.docType}
            imageUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250'%3E%3Crect fill='%23f0f0f0' width='400' height='250'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'%3ESample Document%3C/text%3E%3C/svg%3E"
            parsed={currentSample.parsed}
            avgConfidence={currentSample.confidence}
            onAccept={handleAccept}
          />
        )}
      </div>
    </>
  );
}
