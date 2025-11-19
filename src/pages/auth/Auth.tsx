/* 🔒 PHOTO CAPTURE - LOCKED CONFIGURATION (NO OCR)
 * 
 * CRITICAL: Identity Verification uses simple photo capture ONLY
 * DO NOT add OCR processing, text recognition, or document parsing
 * 
 * Why NO OCR:
 * - Prevents "OCR failed" errors
 * - Simpler user experience
 * - Faster processing
 * - Manual admin review is more reliable
 * 
 * Key Rules:
 * - Use PhotoCaptureCard component ONLY (not OcrCaptureCard)
 * - Store photos with empty parsed: {} object
 * - Always set confidence: 1.0 (no OCR confidence)
 * - Simple success messages: "Photo Captured"
 * - NO OCR error messages
 * 
 * See: PHOTO_CAPTURE_LOCKED.md for complete guidelines
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { KanggaLogo } from '@/components/KanggaLogo';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Car, Package, Mail } from 'lucide-react';
import { UserRole } from '@/types';
/* 🔒 LOCKED: Use PhotoCaptureCard for simple photo capture
 * DO NOT replace with OcrCaptureCard - causes OCR errors */
import { PhotoCaptureCard } from '@/components/PhotoCaptureCard';
import { AuthHelpModal } from '@/components/auth/AuthHelpModal';
import { kycService } from '@/services/kyc';
import { driversService } from '@/services/drivers';
import { DocType } from '@/types/kyc';
import { z } from 'zod';

const passengerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passwordConfirm: z.string().min(6, 'Password confirmation required'),
  firstName: z.string().min(1, 'First name required'),
  middleName: z.string().min(1, 'Middle name required'),
  lastName: z.string().min(1, 'Last name required'),
  birthdate: z.string().min(1, 'Birthdate required'),
  personalMobile: z.string().min(10, 'Valid mobile number required'),
  emergencyContactName: z.string().min(2, 'Emergency contact name required'),
  emergencyContactRelation: z.string().min(2, 'Relationship required'),
  emergencyContact: z.string().min(10, 'Valid emergency contact required'),
  completeAddress: z.string().min(5, 'Complete address required'),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the data privacy policy',
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ['passwordConfirm'],
});

/* 🔒 LOCKED: Driver/Courier Registration Schema
 * All fields required for vehicle operator registration
 * DO NOT modify validation rules without updating PHOTO_CAPTURE_LOCKED.md
 */
const driverSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passwordConfirm: z.string().min(6, 'Password confirmation required'),
  firstName: z.string().min(1, 'First name required'),
  middleName: z.string().min(1, 'Middle name required'),
  lastName: z.string().min(1, 'Last name required'),
  birthdate: z.string().min(1, 'Birthdate required'),
  personalMobile: z.string().min(10, 'Valid mobile number required'),
  emergencyContactName: z.string().min(2, 'Emergency contact name required'),
  emergencyContactRelation: z.string().min(2, 'Relationship required'),
  emergencyContact: z.string().min(10, 'Valid emergency contact required'),
  completeAddress: z.string().min(5, 'Complete address required'),
  vehicleType: z.enum(['motor', 'tricycle', 'car'], { required_error: 'Vehicle type required' }),
  vehicleColor: z.string().min(2, 'Vehicle color required'),
  vehiclePlate: z.string().min(2, 'Plate number required'),
  licenseExpiry: z.string().min(1, 'License expiry date required'),
  crExpiry: z.string().min(1, 'CR expiry date required'),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the data privacy policy',
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ['passwordConfirm'],
});

/* 🔒 LOCKED: Simple photo staging - NO OCR data
 * DO NOT add: parsed, confidence, or any OCR-related fields */
interface PhotoStaged {
  docType: DocType;
  imageBlob: Blob;
  imageUrl: string;
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  
  const [role, setRole] = useState<UserRole>(() => {
    const urlRole = searchParams.get('role');
    return (urlRole === 'passenger' || urlRole === 'driver' || urlRole === 'courier')
      ? urlRole as UserRole
      : 'passenger';
  });
  
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Passenger Register form
  const [passengerData, setPassengerData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    middleName: '',
    lastName: '',
    birthdate: '',
    personalMobile: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContact: '',
    completeAddress: '',
    privacyConsent: false,
  });
  /* 🔒 LOCKED: Photo state - NO OCR processing data */
  const [photosStaged, setPhotosStaged] = useState<PhotoStaged[]>([]);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  /* 🔒 LOCKED: Driver/Courier State - includes vehicle documents
   * DO NOT remove expiry dates or photo capture fields
   */
  const [driverData, setDriverData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    middleName: '',
    lastName: '',
    birthdate: '',
    personalMobile: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContact: '',
    completeAddress: '',
    vehicleType: '' as 'motor' | 'tricycle' | 'car' | '',
    vehicleColor: '',
    vehiclePlate: '',
    licenseExpiry: '',
    crExpiry: '',
    privacyConsent: false,
  });
  const [driverPhotosStaged, setDriverPhotosStaged] = useState<PhotoStaged[]>([]);

  // Update URL when role changes
  useEffect(() => {
    setSearchParams({ role }, { replace: true });
  }, [role, setSearchParams]);

  // Show success message if coming from password reset
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      toast({
        title: 'Password Updated',
        description: 'Please sign in with your new password.',
      });
      setSearchParams({ role }, { replace: true });
    }
  }, [searchParams, setSearchParams, role, toast]);

  // Redirect if already logged in
  useEffect(() => {
    const redirect = async () => {
      if (!loading && user && profile) {
        // For driver/courier, check if profile exists
        if (profile.role === 'driver') {
          const { data: driverProfile } = await supabase
            .from('driver_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (driverProfile) {
            navigate('/driver/dashboard');
          } else {
            navigate('/driver/setup');
          }
        } else if (profile.role === 'courier') {
          const { data: courierProfile } = await supabase
            .from('courier_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (courierProfile) {
            navigate('/courier/dashboard');
          } else {
            navigate('/courier/setup');
          }
        } else {
          const routes: Record<UserRole, string> = {
            passenger: '/passenger/book-ride',
            driver: '/driver/dashboard',
            courier: '/courier/dashboard',
            sender: '/sender/dashboard',
          };
          navigate(routes[profile.role] || routes.passenger);
        }
      }
    };
    redirect();
  }, [user, profile, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Logged in successfully!',
      });

      // Navigation will happen via useEffect
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to send password reset email',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email Sent',
          description: 'Password reset email sent. Please check your inbox.',
        });
      }
    } catch (error: any) {
      console.error('Unexpected password reset error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Passenger photo capture handler - no OCR
  const handlePhotoCapture = (docType: DocType) => (imageBlob: Blob, imageUrl: string) => {
    setPhotosStaged(prev => [...prev.filter(p => p.docType !== docType), {
      docType,
      imageBlob,
      imageUrl,
    }]);
    
    toast({
      title: 'Photo Captured',
      description: `${docType === 'GOVT_ID' ? 'ID' : 'Selfie'} photo saved successfully`,
    });
  };

  /* 🔒 LOCKED: Driver/Courier photo capture - NO OCR processing
   * Handles: DRIVER_LICENSE, OR, CR, SELFIE
   * DO NOT add OCR processing or text recognition
   */
  const handleDriverPhotoCapture = (docType: DocType) => (imageBlob: Blob, imageUrl: string) => {
    setDriverPhotosStaged(prev => [...prev.filter(p => p.docType !== docType), {
      docType,
      imageBlob,
      imageUrl,
    }]);
    
    const docNames: Record<DocType, string> = {
      'DRIVER_LICENSE': 'Driver\'s License',
      'OR': 'Official Receipt (OR)',
      'CR': 'Certificate of Registration (CR)',
      'SELFIE': 'Selfie',
      'GOVT_ID': 'Government ID',
      'PRIVATE_ID': 'Private ID',
    };
    
    toast({
      title: 'Photo Captured',
      description: `${docNames[docType] || docType} photo saved successfully`,
    });
  };

  const handlePassengerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passengerSchema.parse(passengerData);

      // Check required photos
      const hasId = photosStaged.some(p => p.docType === 'GOVT_ID' || p.docType === 'PRIVATE_ID');
      const hasSelfie = photosStaged.some(p => p.docType === 'SELFIE');
      if (!hasId || !hasSelfie) {
        toast({
          title: 'Photos Required',
          description: 'Please upload both ID and Selfie photos',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);

      // Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: passengerData.email.trim(),
        password: passengerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${passengerData.firstName} ${passengerData.middleName || ''} ${passengerData.lastName}`.trim(),
            phone: passengerData.personalMobile,
            role: 'passenger',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      /* 🔒 LOCKED: Upload photos WITHOUT OCR data
       * 
       * Always upload with:
       * - parsed: {} (empty - no OCR)
       * - confidence: 1.0 (no OCR confidence)
       * - status: 'PENDING' (for admin review)
       * 
       * DO NOT add OCR processing here
       */
      for (const photo of photosStaged) {
        const imagePath = await kycService.uploadDocumentImage(authData.user.id, photo.docType, photo.imageBlob);
        await kycService.createKycDocument({
          user_id: authData.user.id,
          doc_type: photo.docType,
          parsed: {}, // 🔒 ALWAYS empty - no OCR data
          confidence: 1.0, // 🔒 ALWAYS 1.0 - no OCR confidence
          status: 'PENDING',
          image_path: imagePath,
        });
      }

      toast({
        title: 'Registration Complete!',
        description: 'Your account has been created. You can now log in.',
        duration: 5000,
      });

      // Sign out the user to force them to login
      await supabase.auth.signOut();
      
      // Redirect to login page
      setActiveTab('login');
      
      // Reset form
      setPassengerData({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        middleName: '',
        lastName: '',
        birthdate: '',
        personalMobile: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContact: '',
        completeAddress: '',
        privacyConsent: false,
      });
      setPhotosStaged([]);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0]?.message || 'Please check your inputs',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Failed',
          description: error.message || 'Could not create account',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDriverRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      driverSchema.parse(driverData);

      /* 🔒 LOCKED: Required photos validation
       * Driver/Courier must upload: DRIVER_LICENSE, OR, CR, SELFIE
       */
      const hasLicense = driverPhotosStaged.some(p => p.docType === 'DRIVER_LICENSE');
      const hasOR = driverPhotosStaged.some(p => p.docType === 'OR');
      const hasCR = driverPhotosStaged.some(p => p.docType === 'CR');
      const hasSelfie = driverPhotosStaged.some(p => p.docType === 'SELFIE');
      
      if (!hasLicense || !hasOR || !hasCR || !hasSelfie) {
        toast({
          title: 'Photos Required',
          description: 'Please upload Driver\'s License, OR, CR, and Selfie photos',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);

      // Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: driverData.email.trim(),
        password: driverData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${driverData.firstName} ${driverData.middleName || ''} ${driverData.lastName}`.trim(),
            phone: driverData.personalMobile,
            role: role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;

      /* 🔒 LOCKED: Upload photos WITHOUT OCR processing
       * Store vehicle/document info in parsed field
       * Always: confidence: 1.0, status: 'PENDING'
       * DO NOT add OCR processing
       */
      for (const photo of driverPhotosStaged) {
        const imagePath = await kycService.uploadDocumentImage(userId, photo.docType, photo.imageBlob);
        
        let parsedData = {};
        if (photo.docType === 'DRIVER_LICENSE') {
          parsedData = {
            vehicle_color: driverData.vehicleColor,
            vehicle_brand: '',
            vehicle_model: '',
            plate_no: driverData.vehiclePlate,
            expiry_date: driverData.licenseExpiry,
          };
        } else if (photo.docType === 'CR') {
          parsedData = {
            expiry_date: driverData.crExpiry,
          };
        }
        
        await kycService.createKycDocument({
          user_id: userId,
          doc_type: photo.docType,
          parsed: parsedData,
          confidence: 1.0, // 🔒 ALWAYS 1.0 - no OCR
          status: 'PENDING',
          image_path: imagePath,
        });
      }

      // Create driver profile using service
      if (driverData.vehicleType) {
        await driversService.createDriverProfile(userId, {
          vehicle_type: driverData.vehicleType,
          vehicle_plate: driverData.vehiclePlate,
          vehicle_color: driverData.vehicleColor,
          vehicle_model: '',
          license_number: '',
        });
      }

      toast({
        title: 'Registration Complete!',
        description: 'Your account has been created. You can now log in.',
        duration: 5000,
      });

      // Sign out the user to force them to login
      await supabase.auth.signOut();
      
      // Redirect to login page
      setActiveTab('login');
      
      // Reset form
      setDriverData({
        email: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        middleName: '',
        lastName: '',
        birthdate: '',
        personalMobile: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContact: '',
        completeAddress: '',
        vehicleType: '',
        vehicleColor: '',
        vehiclePlate: '',
        licenseExpiry: '',
        crExpiry: '',
        privacyConsent: false,
      });
      setDriverPhotosStaged([]);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0]?.message || 'Please check your inputs',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Failed',
          description: error.message || 'Could not create account',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (roleType: UserRole) => {
    switch (roleType) {
      case 'driver': return <Car className="w-12 h-12" />;
      case 'courier': return <Package className="w-12 h-12" />;
      case 'sender': return <Mail className="w-12 h-12" />;
      default: return <User className="w-12 h-12" />;
    }
  };

  const getRoleLabel = (roleType: UserRole) => {
    return roleType.charAt(0).toUpperCase() + roleType.slice(1);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign In - KanggaXpress</title>
        <meta name="description" content="Sign in to your KanggaXpress account" />
      </Helmet>
      <div className="min-h-screen min-h-[100dvh] flex flex-col overflow-hidden">
        {/* Yellow Header Bar with Shadow and Hamburger Menu - LOCKED CONFIGURATION
            DO NOT add logo or branding here - this is intentional */}
        <header className="sticky top-0 z-50 bg-primary shadow-md">
          <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
            {/* LOCKED: Only hamburger menu - DO NOT ADD LOGO OR BRANDING */}
            <HamburgerMenu />
            
            {/* Empty spacer for layout */}
            <div className="flex-1" />
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-4 py-4 sm:py-4 overflow-y-auto">
          <div className="w-full max-w-[420px] space-y-4 sm:space-y-4 pb-safe">
            {/* Header */}
            <div className="text-center space-y-3 sm:space-y-2.5">
              <div className="inline-flex items-center justify-center">
                <KanggaLogo width={200} height={200} className="w-20 h-20 sm:w-20 sm:h-20" />
              </div>
              <h1 className="text-2xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground leading-tight px-2">
                Welcome to KanggaXpress
              </h1>
              
              {/* Role Selector */}
              <TooltipProvider>
                <div className="flex flex-col items-center justify-center gap-3 sm:gap-2 p-5 sm:p-3 bg-gradient-to-br from-muted/50 to-muted rounded-xl">
                  <span className="text-lg sm:text-base md:text-sm font-bold text-foreground">Signing in as:</span>
                  <div className="flex gap-3 sm:gap-2">
                    {(['passenger', 'driver', 'courier'] as const).map((r) => (
                      <Tooltip key={r}>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant={role === r ? 'default' : 'outline'}
                            onClick={() => setRole(r)}
                            className={`flex flex-col gap-2.5 sm:gap-1.5 h-auto py-4 px-4 sm:py-2 sm:px-3 transition-all min-h-[72px] sm:min-h-[60px] ${
                              role === r 
                                ? 'shadow-lg scale-105 border-2 border-primary' 
                                : 'hover:scale-105 hover:shadow-md border-2 border-border'
                            }`}
                          >
                            <div className={`w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg ${
                              role === r 
                                ? 'bg-primary/10' 
                                : 'bg-muted'
                            }`}>
                              {getRoleIcon(r)}
                            </div>
                            <span className="text-base sm:text-sm md:text-xs font-semibold">{getRoleLabel(r)}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">Sign in as {getRoleLabel(r)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </TooltipProvider>
            </div>

            {/* Auth Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 sm:h-12 md:h-10">
                <TabsTrigger value="login" className="text-lg sm:text-base md:text-sm font-semibold">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-lg sm:text-base md:text-sm font-semibold">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 sm:space-y-3 mt-5 sm:mt-4">
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-3">
                  <div className="space-y-2 sm:space-y-1">
                    <Label htmlFor="login-email" className="text-lg sm:text-base md:text-sm font-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-white h-14 sm:h-12 md:h-10 text-mobile-base sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-1">
                    <Label htmlFor="login-password" className="text-base sm:text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="bg-white h-12 sm:h-10 text-mobile-base sm:text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-2"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 sm:w-4 sm:h-4" /> : <Eye className="w-5 h-5 sm:w-4 sm:h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        className="text-sm sm:text-xs font-medium text-foreground hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                        onClick={handleForgotPassword}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full text-base sm:text-base font-semibold mt-1"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                  
                  {/* Help Link */}
                  <div className="text-center pt-2 sm:pt-1.5">
                    <button
                      type="button"
                      onClick={() => setHelpModalOpen(true)}
                      className="text-sm sm:text-xs text-foreground/80 hover:text-foreground hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1.5"
                    >
                      Need help signing in?
                    </button>
                  </div>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-3 mt-3">
                {role === 'passenger' ? (
                  /* Comprehensive Passenger Registration with KYC */
                  <form onSubmit={handlePassengerRegister} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="passenger-firstName" className="text-sm font-bold">First Name *</Label>
                        <Input
                          id="passenger-firstName"
                          type="text"
                          placeholder="Juan"
                          value={passengerData.firstName}
                          onChange={(e) => setPassengerData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                          className="bg-white h-10 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="passenger-middleName" className="text-xs sm:text-sm font-bold">Middle Name *</Label>
                        <Input
                          id="passenger-middleName"
                          type="text"
                          placeholder="Santos"
                          value={passengerData.middleName}
                          onChange={(e) => setPassengerData(prev => ({ ...prev, middleName: e.target.value }))}
                          required
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-lastName" className="text-xs sm:text-sm font-bold">Last Name *</Label>
                      <Input
                        id="passenger-lastName"
                        type="text"
                        placeholder="dela Cruz"
                        value={passengerData.lastName}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-birthdate" className="text-xs sm:text-sm font-bold">Birthdate *</Label>
                      <Input
                        id="passenger-birthdate"
                        type="date"
                        value={passengerData.birthdate}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, birthdate: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-personalMobile" className="text-xs sm:text-sm font-bold">Personal Mobile Number *</Label>
                      <Input
                        id="passenger-personalMobile"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        value={passengerData.personalMobile}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, personalMobile: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-emergencyContactName" className="text-xs sm:text-sm font-bold">Emergency Contact Name *</Label>
                      <Input
                        id="passenger-emergencyContactName"
                        type="text"
                        placeholder="Maria dela Cruz"
                        value={passengerData.emergencyContactName}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-emergencyContactRelation" className="text-xs sm:text-sm font-bold">Relation *</Label>
                      <Input
                        id="passenger-emergencyContactRelation"
                        type="text"
                        placeholder="Mother / Father / Spouse / Sibling"
                        value={passengerData.emergencyContactRelation}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-emergencyContact" className="text-xs sm:text-sm font-bold">Emergency Contact Number *</Label>
                      <Input
                        id="passenger-emergencyContact"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        value={passengerData.emergencyContact}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-completeAddress" className="text-xs sm:text-sm font-bold">Complete Address *</Label>
                      <Input
                        id="passenger-completeAddress"
                        type="text"
                        placeholder="123 Main St, Barangay, City, Province"
                        value={passengerData.completeAddress}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, completeAddress: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-email" className="text-xs sm:text-sm font-bold">Email *</Label>
                      <Input
                        id="passenger-email"
                        type="email"
                        placeholder="your@email.com"
                        value={passengerData.email}
                        onChange={(e) => setPassengerData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-password" className="text-xs sm:text-sm font-bold">Password *</Label>
                      <div className="relative">
                        <Input
                          id="passenger-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={passengerData.password}
                          onChange={(e) => setPassengerData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          minLength={6}
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="passenger-passwordConfirm" className="text-xs sm:text-sm font-bold">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="passenger-passwordConfirm"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={passengerData.passwordConfirm}
                          onChange={(e) => setPassengerData(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                          required
                          minLength={6}
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 🔒 LOCKED: Identity Verification - Photo Capture ONLY (NO OCR)
                     * 
                     * Uses PhotoCaptureCard for simple camera/file upload
                     * DO NOT replace with OcrCaptureCard
                     * DO NOT add OCR processing
                     * 
                     * See: PHOTO_CAPTURE_LOCKED.md
                     */}
                    <div className="space-y-2 sm:space-y-3 pt-2 border-t border-border">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Identity Verification</h3>
                      
                      {/* ✅ CORRECT: PhotoCaptureCard - simple photo only */}
                      <PhotoCaptureCard
                        title="Government ID or Any Valid ID"
                        description="Take or upload a photo of your Government ID or Company ID"
                        onCapture={handlePhotoCapture('GOVT_ID')}
                        captured={photosStaged.some(p => p.docType === 'GOVT_ID' || p.docType === 'PRIVATE_ID')}
                      />
                      
                      <PhotoCaptureCard
                        title="Selfie Photo"
                        description="Take a selfie holding your ID"
                        onCapture={handlePhotoCapture('SELFIE')}
                        captured={photosStaged.some(p => p.docType === 'SELFIE')}
                      />
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      <p className="text-justify mb-3 leading-relaxed">
                        <span className="font-semibold">Data Privacy Act of 2012 (Republic Act No. 10173):</span> Your personal information will be collected, stored, and processed in accordance with the Data Privacy Act. Your data will be used solely for service delivery, account verification, and communication purposes. KanggaXpress is committed to protecting your privacy and will not share your information with third parties without your consent.
                      </p>
                      
                      <label htmlFor="privacy-consent" className="flex items-center justify-center gap-2 leading-relaxed cursor-pointer">
                        <input
                          type="checkbox"
                          id="privacy-consent"
                          checked={passengerData.privacyConsent}
                          onChange={(e) => setPassengerData(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                          className="h-4 w-4 flex-shrink-0 rounded border-border text-primary focus:ring-primary"
                          required
                        />
                        <span>
                          Yes, I understand and agree.
                        </span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full h-10 sm:h-11 text-base sm:text-lg font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Passenger Account'}
                    </Button>
                  </form>
                ) : (
                  /* Detailed Registration for Driver/Courier */
                  <form onSubmit={handleDriverRegister} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="driver-firstName" className="text-sm font-bold">First Name *</Label>
                        <Input
                          id="driver-firstName"
                          type="text"
                          placeholder="Juan"
                          value={driverData.firstName}
                          onChange={(e) => setDriverData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                          className="bg-white h-10 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="driver-middleName" className="text-xs sm:text-sm font-bold">Middle Name *</Label>
                        <Input
                          id="driver-middleName"
                          type="text"
                          placeholder="Santos"
                          value={driverData.middleName}
                          onChange={(e) => setDriverData(prev => ({ ...prev, middleName: e.target.value }))}
                          required
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-lastName" className="text-xs sm:text-sm font-bold">Last Name *</Label>
                      <Input
                        id="driver-lastName"
                        type="text"
                        placeholder="dela Cruz"
                        value={driverData.lastName}
                        onChange={(e) => setDriverData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-birthdate" className="text-xs sm:text-sm font-bold">Birthdate *</Label>
                      <Input
                        id="driver-birthdate"
                        type="date"
                        value={driverData.birthdate}
                        onChange={(e) => setDriverData(prev => ({ ...prev, birthdate: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-personalMobile" className="text-xs sm:text-sm font-bold">Personal Mobile Number *</Label>
                      <Input
                        id="driver-personalMobile"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        value={driverData.personalMobile}
                        onChange={(e) => setDriverData(prev => ({ ...prev, personalMobile: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-emergencyContactName" className="text-xs sm:text-sm font-bold">Emergency Contact Name *</Label>
                      <Input
                        id="driver-emergencyContactName"
                        type="text"
                        placeholder="Maria dela Cruz"
                        value={driverData.emergencyContactName}
                        onChange={(e) => setDriverData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-emergencyContactRelation" className="text-xs sm:text-sm font-bold">Relation *</Label>
                      <Input
                        id="driver-emergencyContactRelation"
                        type="text"
                        placeholder="Mother, Father, Spouse, etc."
                        value={driverData.emergencyContactRelation}
                        onChange={(e) => setDriverData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-emergencyContact" className="text-xs sm:text-sm font-bold">Emergency Contact Number *</Label>
                      <Input
                        id="driver-emergencyContact"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        value={driverData.emergencyContact}
                        onChange={(e) => setDriverData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-completeAddress" className="text-xs sm:text-sm font-bold">Complete Address *</Label>
                      <Input
                        id="driver-completeAddress"
                        type="text"
                        placeholder="123 Main St, Barangay, City, Province"
                        value={driverData.completeAddress}
                        onChange={(e) => setDriverData(prev => ({ ...prev, completeAddress: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    {/* 🔒 LOCKED: Vehicle Information Section
                      * Includes: color and plate number
                      * DO NOT remove any fields
                      */}
                    <div className="space-y-2 sm:space-y-3 pt-3 border-t border-border">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Vehicle Information</h3>
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="driver-vehicleType" className="text-xs sm:text-sm font-bold">Vehicle Type *</Label>
                        <select
                          id="driver-vehicleType"
                          value={driverData.vehicleType}
                          onChange={(e) => setDriverData(prev => ({ ...prev, vehicleType: e.target.value as 'motor' | 'tricycle' | 'car' }))}
                          required
                          className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select vehicle type</option>
                          <option value="motor">Motorcycle</option>
                          <option value="tricycle">Tricycle</option>
                          <option value="car">Car</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="driver-vehicleColor" className="text-xs sm:text-sm font-bold">Vehicle Color *</Label>
                        <Input
                          id="driver-vehicleColor"
                          type="text"
                          placeholder="e.g. Red, Blue, White"
                          value={driverData.vehicleColor}
                          onChange={(e) => setDriverData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                          required
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="driver-vehiclePlate" className="text-xs sm:text-sm font-bold">Plate Number *</Label>
                        <Input
                          id="driver-vehiclePlate"
                          type="text"
                          placeholder="ABC 1234"
                          value={driverData.vehiclePlate}
                          onChange={(e) => setDriverData(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                          required
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-email" className="text-xs sm:text-sm font-bold">Email *</Label>
                      <Input
                        id="driver-email"
                        type="email"
                        placeholder="your@email.com"
                        value={driverData.email}
                        onChange={(e) => setDriverData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-password" className="text-xs sm:text-sm font-bold">Password *</Label>
                      <div className="relative">
                        <Input
                          id="driver-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={driverData.password}
                          onChange={(e) => setDriverData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          minLength={6}
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="driver-passwordConfirm" className="text-xs sm:text-sm font-bold">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="driver-passwordConfirm"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={driverData.passwordConfirm}
                          onChange={(e) => setDriverData(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                          required
                          minLength={6}
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 🔒 LOCKED: Document Verification - Photo Capture with Expiry Fields
                      * Required photos: DRIVER_LICENSE, OR, CR, SELFIE
                      * Expiry date fields placed directly after corresponding photos
                      * NO OCR processing - simple photo upload
                      * DO NOT replace with OcrCaptureCard
                      */}
                    <div className="space-y-2 sm:space-y-3 pt-2 border-t border-border">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Document Verification</h3>
                      
                      <PhotoCaptureCard
                        title="Driver's License"
                        description="Take or upload a photo of your Driver's License"
                        onCapture={handleDriverPhotoCapture('DRIVER_LICENSE')}
                        captured={driverPhotosStaged.some(p => p.docType === 'DRIVER_LICENSE')}
                      />
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="driver-licenseExpiry" className="text-xs sm:text-sm font-bold">Driver's License Expiry Date *</Label>
                        <Input
                          id="driver-licenseExpiry"
                          type="date"
                          value={driverData.licenseExpiry}
                          onChange={(e) => setDriverData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                          required
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                      </div>
                      
                      <PhotoCaptureCard
                        title="Official Receipt (OR)"
                        description="Take or upload a photo of your vehicle's OR"
                        onCapture={handleDriverPhotoCapture('OR')}
                        captured={driverPhotosStaged.some(p => p.docType === 'OR')}
                      />
                      
                      <PhotoCaptureCard
                        title="Certificate of Registration (CR)"
                        description="Take or upload a photo of your vehicle's CR"
                        onCapture={handleDriverPhotoCapture('CR')}
                        captured={driverPhotosStaged.some(p => p.docType === 'CR')}
                      />
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="driver-crExpiry" className="text-xs sm:text-sm font-bold">CR Expiry Date *</Label>
                        <Input
                          id="driver-crExpiry"
                          type="date"
                          value={driverData.crExpiry}
                          onChange={(e) => setDriverData(prev => ({ ...prev, crExpiry: e.target.value }))}
                          required
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                      </div>
                      
                      <PhotoCaptureCard
                        title="Selfie Photo"
                        description="Take a selfie holding your Driver's License"
                        onCapture={handleDriverPhotoCapture('SELFIE')}
                        captured={driverPhotosStaged.some(p => p.docType === 'SELFIE')}
                      />
                    </div>

                    <div className="text-xs text-muted-foreground space-y-3 pt-2 border-t border-border">
                      <p className="text-justify leading-relaxed">
                        <span className="font-semibold">Data Privacy Act of 2012 (Republic Act No. 10173):</span> Your personal information will be collected, stored, and processed in accordance with the Data Privacy Act. Your data will be used solely for service delivery, account verification, and communication purposes. KanggaXpress is committed to protecting your privacy and will not share your information with third parties without your consent.
                      </p>
                      
                      <label htmlFor="driver-privacy-consent" className="flex items-center justify-center gap-2 leading-relaxed cursor-pointer">
                        <input
                          type="checkbox"
                          id="driver-privacy-consent"
                          checked={driverData.privacyConsent}
                          onChange={(e) => setDriverData(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                          className="h-4 w-4 flex-shrink-0 rounded border-border text-primary focus:ring-primary"
                          required
                        />
                        <span>
                          Yes, I understand and agree.
                        </span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full h-10 sm:h-11 text-base sm:text-lg font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : `Create ${role === 'driver' ? 'Driver' : 'Courier'} Account`}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Auth Help Modal */}
        {/* Help Modal */}
        <AuthHelpModal open={helpModalOpen} onOpenChange={setHelpModalOpen} />
      </div>
    </>
  );
}
