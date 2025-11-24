import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { OcrCaptureCard } from '@/components/ocr/OcrCaptureCard';
import { OcrReviewModal } from '@/components/ocr/OcrReviewModal';
import { couriersService } from '@/services/couriers';
import { kycService } from '@/services/kyc';
import { supabase } from '@/integrations/supabase/client';
import { RideType } from '@/types';
import { DocType, ParsedData } from '@/types/kyc';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';

interface StagedKyc {
  doc_type: DocType;
  parsed: ParsedData;
  confidence: number;
  status: 'PENDING' | 'REVIEW';
  image_path: string;
}

export default function CourierSetup() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState<RideType>('motor');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OCR state
  const [stagedKyc, setStagedKyc] = useState<Record<DocType, StagedKyc | null>>({
    DRIVER_LICENSE: null,
    OR: null,
    CR: null,
    SELFIE: null,
    GOVT_ID: null,
    PRIVATE_ID: null,
  });
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    docType: DocType;
    imageUrl: string;
    imageBlob: Blob | null;
    parsed: any;
    avgConfidence: number;
  }>({
    open: false,
    docType: 'DRIVER_LICENSE',
    imageUrl: '',
    imageBlob: null,
    parsed: {},
    avgConfidence: 0,
  });
  const [confirmLowConfidence, setConfirmLowConfidence] = useState(false);

  const OCR_MIN = Number(import.meta.env.VITE_OCR_CONFIDENCE_MIN ?? 0.65);

  useEffect(() => {
    if (!user || profile?.role !== 'courier') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  const handleOcrComplete = (docType: DocType) => (
    parsed: ParsedData,
    imageUrl: string,
    imageBlob: Blob,
    avgConfidence: number
  ) => {
    setReviewModal({
      open: true,
      docType,
      imageUrl,
      imageBlob,
      parsed,
      avgConfidence,
    });
  };

  const handleOcrAccept = async (finalParsed: any) => {
    if (!user || !reviewModal.imageBlob) return;

    try {
      const docType = reviewModal.docType;
      const avgConfidence = reviewModal.avgConfidence;
      
      // Upload image
      const imagePath = await kycService.uploadDocumentImage(
        user.id,
        docType,
        reviewModal.imageBlob
      );

      const status = docType !== 'SELFIE' && avgConfidence < OCR_MIN ? 'REVIEW' : 'PENDING';

      setStagedKyc(prev => ({
        ...prev,
        [docType]: {
          doc_type: docType,
          parsed: finalParsed,
          confidence: avgConfidence,
          status,
          image_path: imagePath,
        },
      }));

      // Autofill form fields
      if (docType === 'DRIVER_LICENSE' && finalParsed.license_no) {
        setLicenseNumber(finalParsed.license_no);
      }
      if (docType === 'CR') {
        if (finalParsed.plate_no) setVehiclePlate(finalParsed.plate_no);
        if (finalParsed.vehicle_brand || finalParsed.series_model) {
          setVehicleModel(`${finalParsed.vehicle_brand || ''} ${finalParsed.series_model || ''}`.trim());
        }
        if (finalParsed.color) setVehicleColor(finalParsed.color);
      }

      toast.success(`${docType} captured and autofilled`);
      setReviewModal(prev => ({ ...prev, open: false }));
    } catch (error) {
      console.error('OCR accept error:', error);
      toast.error('Failed to save document');
    }
  };

  const allRequiredCaptured = () => {
    return !!(
      stagedKyc.DRIVER_LICENSE &&
      stagedKyc.OR &&
      stagedKyc.CR &&
      stagedKyc.SELFIE
    );
  };

  const anyLowConfidence = () => {
    const docs = [stagedKyc.DRIVER_LICENSE, stagedKyc.OR, stagedKyc.CR];
    return docs.some(doc => doc && doc.confidence < OCR_MIN);
  };

  const canSubmit = () => {
    if (!allRequiredCaptured()) return false;
    if (anyLowConfidence() && !confirmLowConfidence) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !canSubmit()) return;

    try {
      setLoading(true);

      // Insert KYC documents
      for (const docType of ['DRIVER_LICENSE', 'OR', 'CR', 'SELFIE'] as DocType[]) {
        const doc = stagedKyc[docType];
        if (doc) {
          await kycService.createKycDocument({
            user_id: user!.id,
            doc_type: doc.doc_type,
            parsed: doc.parsed,
            confidence: doc.confidence,
            status: doc.status,
            image_path: doc.image_path,
          });
        }
      }

      // Create courier profile
      await couriersService.createCourierProfile(profile.id, {
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate.trim(),
        vehicle_model: vehicleModel.trim() || undefined,
        vehicle_color: vehicleColor.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
      });

      // Initialize wallet and account number
      const { walletService } = await import('@/services/wallet');
      const accountNumber = walletService.generateAccountNumber('courier', user!.id);
      
      // Update profile with account number
      await walletService.updateAccountNumber(user!.id, accountNumber);
      
      // Create wallet account with 0 initial balance
      await supabase
        .from('wallet_accounts')
        .insert({
          user_id: user!.id,
          role: 'courier',
          balance: 0,
        });

      // Show welcome toast with account number and copy button
      const copyAccountNumber = () => {
        navigator.clipboard.writeText(accountNumber);
        toast.success('Account number copied!');
      };

      toast.success(
        `Welcome! Your account number is ${accountNumber}. Save this for wallet loading.`,
        {
          duration: 10000,
          action: {
            label: 'Copy',
            onClick: copyAccountNumber,
          },
        }
      );

      navigate('/courier/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create courier profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold">Complete Your Courier Profile</h1>
            <p className="text-muted-foreground mt-2">Scan your documents and add vehicle details</p>
          </div>

          {/* OCR Capture Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading font-semibold">Required Documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OcrCaptureCard
                docType="DRIVER_LICENSE"
                onOcrComplete={handleOcrComplete('DRIVER_LICENSE')}
              />
              <OcrCaptureCard
                docType="OR"
                onOcrComplete={handleOcrComplete('OR')}
              />
              <OcrCaptureCard
                docType="CR"
                onOcrComplete={handleOcrComplete('CR')}
              />
              <OcrCaptureCard
                docType="SELFIE"
                onOcrComplete={handleOcrComplete('SELFIE')}
              />
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <ThemedCard>
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-semibold">Vehicle Details</h3>
                
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <RadioGroup value={vehicleType} onValueChange={(v) => setVehicleType(v as RideType)}>
                    {(['motor', 'tricycle', 'car'] as RideType[]).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type} className="capitalize cursor-pointer">{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plate">Plate Number *</Label>
                  <Input
                    id="plate"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    required
                    placeholder="ABC-1234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Vehicle Model</Label>
                  <Input
                    id="model"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Honda Wave 110"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Vehicle Color</Label>
                  <Input
                    id="color"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="Red"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="N00-00-000000"
                  />
                </div>
              </div>
            </ThemedCard>

            {/* Low confidence warning */}
            {anyLowConfidence() && (
              <ThemedCard className="border-amber-500">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="confirm-low"
                    checked={confirmLowConfidence}
                    onCheckedChange={(checked) => setConfirmLowConfidence(!!checked)}
                  />
                  <Label htmlFor="confirm-low" className="text-sm cursor-pointer">
                    Some scans need manual review — I confirm details are correct.
                  </Label>
                </div>
              </ThemedCard>
            )}

            <PrimaryButton
              type="submit"
              isLoading={loading}
              disabled={!canSubmit()}
            >
              {allRequiredCaptured() ? 'Submit for Review' : 'Complete All Document Scans First'}
            </PrimaryButton>
          </form>
        </div>
      </div>

      <OcrReviewModal
        open={reviewModal.open}
        onClose={() => setReviewModal(prev => ({ ...prev, open: false }))}
        imageUrl={reviewModal.imageUrl}
        parsed={reviewModal.parsed}
        docType={reviewModal.docType}
        avgConfidence={reviewModal.avgConfidence}
        onAccept={handleOcrAccept}
      />
    </PageLayout>
  );
}
