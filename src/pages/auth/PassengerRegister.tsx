import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PhotoCaptureCard } from '@/components/PhotoCaptureCard';
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
  privacyConsent: z.boolean().refine(val => val === true, {
    message: 'You must accept the Data Privacy Act terms',
  }),
});

interface PhotoStaged {
  docType: DocType;
  imageBlob: Blob;
  imageUrl: string;
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
    privacyConsent: false,
  });
  const [photosStaged, setPhotosStaged] = useState<PhotoStaged[]>([]);

  const handlePhotoCapture = (docType: DocType) => (imageBlob: Blob, imageUrl: string) => {
    setPhotosStaged(prev => [...prev.filter(p => p.docType !== docType), {
      docType,
      imageBlob,
      imageUrl,
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passengerSchema.parse(formData);

      // Check required photos
      const hasId = photosStaged.some(p => p.docType === 'GOVT_ID' || p.docType === 'PRIVATE_ID');
      const hasSelfie = photosStaged.some(p => p.docType === 'SELFIE');
      if (!hasId || !hasSelfie) {
        toast.error('Please upload ID and Selfie photos');
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

      // Upload photos as KYC documents
      for (const photo of photosStaged) {
        const imagePath = await kycService.uploadDocumentImage(userId, photo.docType, photo.imageBlob);
        await kycService.createKycDocument({
          user_id: userId,
          doc_type: photo.docType,
          parsed: {},
          confidence: 1.0,
          status: 'PENDING',
          image_path: imagePath,
        });
      }

      toast.success('Account created successfully!');

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

      {/* Photo Capture - ID and Selfie */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Document Verification</h3>
        
        <PhotoCaptureCard
          title="ID Verification"
          description="Take or upload a photo of your Government ID or Company ID"
          onCapture={handlePhotoCapture('GOVT_ID')}
          captured={photosStaged.some(p => p.docType === 'GOVT_ID' || p.docType === 'PRIVATE_ID')}
        />
        
        <PhotoCaptureCard
          title="Selfie Verification"
          description="Take a selfie holding your ID"
          onCapture={handlePhotoCapture('SELFIE')}
          captured={photosStaged.some(p => p.docType === 'SELFIE')}
        />
      </div>

      {/* Data Privacy Act Consent */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="privacy-consent"
          checked={formData.privacyConsent}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, privacyConsent: checked === true })
          }
          required
          className="mt-0.5 flex-shrink-0"
        />
        <label htmlFor="privacy-consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          I understand and agree that my personal information will be collected, stored, and processed in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). I consent to the use of my data for registration, verification, and service provision purposes.
        </label>
      </div>

      <PrimaryButton type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : 'Register as Passenger'}
      </PrimaryButton>
    </form>
  );
}
