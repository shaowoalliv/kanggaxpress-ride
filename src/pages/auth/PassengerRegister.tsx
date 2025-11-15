import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { OcrCaptureCard } from '@/components/ocr/OcrCaptureCard';
import { OcrReviewModal } from '@/components/ocr/OcrReviewModal';
import { kycService } from '@/services/kyc';
import { DocType } from '@/types/kyc';
import { toast } from 'sonner';
import { z } from 'zod';

const passengerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name required'),
  completeAddress: z.string().min(5, 'Complete address required'),
  contactNumber: z.string().min(10, 'Valid contact number required'),
});

interface KycStaged {
  docType: DocType;
  parsed: any;
  confidence: number;
  imageBlob: Blob;
}

export function PassengerRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    completeAddress: '',
    contactNumber: '',
  });
  const [kycStaged, setKycStaged] = useState<KycStaged[]>([]);
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    docType: DocType;
    imageUrl: string;
    parsed: any;
    avgConfidence: number;
    imageBlob: Blob;
  }>({ open: false, docType: 'GOVT_ID', imageUrl: '', parsed: {}, avgConfidence: 0, imageBlob: new Blob() });

  const handleOcrComplete = (parsed: any, imageUrl: string, imageBlob: Blob, avgConfidence: number, docType: DocType) => {
    setReviewModal({
      open: true,
      docType,
      imageUrl,
      parsed,
      avgConfidence,
      imageBlob,
    });
  };

  const handleOcrAccept = (finalParsed: any) => {
    // Autofill form fields
    if (reviewModal.docType === 'GOVT_ID' || reviewModal.docType === 'PRIVATE_ID') {
      const fullname = finalParsed.fullname ||
        [finalParsed.name_first, finalParsed.name_middle, finalParsed.name_last]
          .filter(Boolean).join(' ');
      
      const address = [
        finalParsed.address_line1,
        finalParsed.address_line2,
        finalParsed.city,
        finalParsed.province,
        finalParsed.postal_code,
      ].filter(Boolean).join(', ');

      setFormData(prev => ({
        ...prev,
        fullName: fullname || prev.fullName,
        completeAddress: address || prev.completeAddress,
      }));
    }

    // Stage for later submission
    setKycStaged(prev => [...prev.filter(k => k.docType !== reviewModal.docType), {
      docType: reviewModal.docType,
      parsed: finalParsed,
      confidence: reviewModal.avgConfidence,
      imageBlob: reviewModal.imageBlob,
    }]);

    setReviewModal({ ...reviewModal, open: false });
    toast.success('Document scanned and form auto-filled');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passengerSchema.parse(formData);

      // Check required KYC docs
      const hasId = kycStaged.some(k => k.docType === 'GOVT_ID' || k.docType === 'PRIVATE_ID');
      const hasSelfie = kycStaged.some(k => k.docType === 'SELFIE');
      if (!hasId || !hasSelfie) {
        toast.error('Please complete ID and Selfie verification');
        return;
      }

      setLoading(true);

      // Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: 'passenger',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;

      // Upload KYC documents
      const OCR_MIN = Number(import.meta.env.VITE_OCR_CONFIDENCE_MIN ?? 0.65);
      for (const kyc of kycStaged) {
        const imagePath = await kycService.uploadDocumentImage(userId, kyc.docType, kyc.imageBlob);
        const status = kyc.docType !== 'SELFIE' && kyc.confidence < OCR_MIN ? 'REVIEW' : 'PENDING';
        
        await kycService.createKycDocument({
          user_id: userId,
          doc_type: kyc.docType,
          parsed: kyc.parsed,
          confidence: kyc.confidence,
          status,
          image_path: imagePath,
        });
      }

      const hasReview = kycStaged.some(k => k.docType !== 'SELFIE' && k.confidence < OCR_MIN);
      if (hasReview) {
        toast.success('Account created! Your documents will be reviewed shortly.');
      } else {
        toast.success('Account created successfully!');
      }

      setTimeout(() => navigate('/passenger/book-ride'), 1500);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Registration failed. Please try again.');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="address">Complete Address</Label>
          <Input
            id="address"
            value={formData.completeAddress}
            onChange={(e) => setFormData({ ...formData, completeAddress: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="contact">Contact Number</Label>
          <Input
            id="contact"
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Document Verification</h3>
        
        <div>
          <Label>Government or Private ID</Label>
          <OcrCaptureCard
            docType="GOVT_ID"
            onOcrComplete={(parsed, imageUrl, imageBlob, avgConfidence) =>
              handleOcrComplete(parsed, imageUrl, imageBlob, avgConfidence, 'GOVT_ID')
            }
          />
        </div>

        <div>
          <Label>Selfie Verification</Label>
          <OcrCaptureCard
            docType="SELFIE"
            onOcrComplete={(parsed, imageUrl, imageBlob, avgConfidence) =>
              handleOcrComplete(parsed, imageUrl, imageBlob, avgConfidence, 'SELFIE')
            }
          />
        </div>
      </div>

      <PrimaryButton type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : 'Register as Passenger'}
      </PrimaryButton>

      <OcrReviewModal
        open={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        docType={reviewModal.docType}
        imageUrl={reviewModal.imageUrl}
        parsed={reviewModal.parsed}
        avgConfidence={reviewModal.avgConfidence}
        onAccept={handleOcrAccept}
      />
    </form>
  );
}
