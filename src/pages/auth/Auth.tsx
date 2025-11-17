import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { KanggaLogo } from '@/components/KanggaLogo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Car, Package, Mail } from 'lucide-react';
import { UserRole } from '@/types';
import { OcrCaptureCard } from '@/components/ocr/OcrCaptureCard';
import { OcrReviewModal } from '@/components/ocr/OcrReviewModal';
import { kycService } from '@/services/kyc';
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

interface KycStaged {
  docType: DocType;
  parsed: any;
  confidence: number;
  imageBlob: Blob;
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
  const [kycStaged, setKycStaged] = useState<KycStaged[]>([]);
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    docType: DocType;
    imageUrl: string;
    parsed: any;
    avgConfidence: number;
    imageBlob: Blob;
  }>({ open: false, docType: 'GOVT_ID', imageUrl: '', parsed: {}, avgConfidence: 0, imageBlob: new Blob() });
  
  // Simple register form for driver/courier
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  // Update URL when role changes
  useEffect(() => {
    setSearchParams({ role }, { replace: true });
  }, [role, setSearchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && profile) {
      const routes: Record<UserRole, string> = {
        passenger: '/passenger/book-ride',
        driver: '/driver/dashboard',
        courier: '/courier/dashboard',
        sender: '/sender/dashboard',
      };
      navigate(routes[profile.role] || routes.passenger);
    }
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

  const handleOcrComplete = (docType: DocType) => (parsed: any, imageUrl: string, imageBlob: Blob, avgConfidence: number) => {
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
    // Autofill form fields from ID
    if (reviewModal.docType === 'GOVT_ID' || reviewModal.docType === 'PRIVATE_ID') {
      setPassengerData(prev => ({
        ...prev,
        firstName: finalParsed.name_first || prev.firstName,
        middleName: finalParsed.name_middle || prev.middleName,
        lastName: finalParsed.name_last || prev.lastName,
        birthdate: finalParsed.birthdate || prev.birthdate,
        completeAddress: [
          finalParsed.address_line1,
          finalParsed.address_line2,
          finalParsed.city,
          finalParsed.province,
          finalParsed.postal_code,
        ].filter(Boolean).join(', ') || prev.completeAddress,
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
    toast({
      title: 'Document Verified',
      description: 'Document scanned and form auto-filled',
    });
  };

  const handlePassengerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passengerSchema.parse(passengerData);

      // Check required KYC docs
      const hasId = kycStaged.some(k => k.docType === 'GOVT_ID' || k.docType === 'PRIVATE_ID');
      const hasSelfie = kycStaged.some(k => k.docType === 'SELFIE');
      if (!hasId || !hasSelfie) {
        toast({
          title: 'Documents Required',
          description: 'Please complete ID and Selfie verification',
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

      // Upload KYC documents
      for (const staged of kycStaged) {
        const imagePath = await kycService.uploadDocumentImage(authData.user.id, staged.docType, staged.imageBlob);
        await kycService.createKycDocument({
          user_id: authData.user.id,
          doc_type: staged.docType,
          parsed: staged.parsed,
          confidence: staged.confidence,
          status: 'PENDING',
          image_path: imagePath,
        });
      }

      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account, then download the KanggaXpress app to get started.',
        duration: 8000,
      });
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: registerFullName,
            phone: registerPhone,
            role: role,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Account created successfully! You can now log in.',
      });
      
      setActiveTab('login');
      setLoginEmail(registerEmail);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (roleType: UserRole) => {
    switch (roleType) {
      case 'driver': return <Car className="w-10 h-10" />;
      case 'courier': return <Package className="w-10 h-10" />;
      case 'sender': return <Mail className="w-10 h-10" />;
      default: return <User className="w-10 h-10" />;
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
      <PageLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-3 py-2 sm:py-4 md:py-6">
          <div className="w-full max-w-md space-y-2 sm:space-y-3 md:space-y-4">
            {/* Header */}
            <div className="text-center space-y-1 sm:space-y-2">
              <div className="inline-flex items-center justify-center mb-1">
                <KanggaLogo width={240} height={240} className="w-24 h-24 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72" />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-foreground px-2">
                Welcome to KanggaXpress
              </h1>
              
              {/* Role Selector */}
              <TooltipProvider>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 p-2 bg-muted rounded-lg">
                  <span className="text-xs sm:text-sm text-muted-foreground">Signing in as:</span>
                  <div className="flex gap-1">
                    {(['passenger', 'driver', 'courier'] as const).map((r) => (
                      <Tooltip key={r}>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant={role === r ? 'default' : 'ghost'}
                            onClick={() => setRole(r)}
                            className="gap-3 text-xs sm:text-sm h-12 sm:h-14 px-3 sm:px-4"
                          >
                            <div className="w-10 h-10 flex items-center justify-center">
                              {getRoleIcon(r)}
                            </div>
                            <span className="hidden sm:inline">{getRoleLabel(r)}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sign in as {getRoleLabel(r)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </TooltipProvider>
            </div>

            {/* Auth Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                <TabsTrigger value="login" className="text-xs sm:text-sm">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-xs sm:text-sm">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="login-email" className="text-xs sm:text-sm">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-white h-9 sm:h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="login-password" className="text-xs sm:text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
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

                  <button
                    type="button"
                    className="text-xs sm:text-sm text-primary hover:underline"
                    onClick={() => toast({ title: 'Coming soon', description: 'Password reset functionality will be available soon.' })}
                  >
                    Forgot password?
                  </button>

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full h-10 sm:h-11 text-base sm:text-lg font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                {role === 'passenger' ? (
                  /* Comprehensive Passenger Registration with KYC */
                  <form onSubmit={handlePassengerRegister} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="passenger-firstName" className="text-xs sm:text-sm">First Name *</Label>
                        <Input
                          id="passenger-firstName"
                          type="text"
                          placeholder="Juan"
                          value={passengerData.firstName}
                          onChange={(e) => setPassengerData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                          className="bg-white h-9 sm:h-10 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="passenger-middleName" className="text-xs sm:text-sm">Middle Name *</Label>
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
                      <Label htmlFor="passenger-lastName" className="text-xs sm:text-sm">Last Name *</Label>
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
                      <Label htmlFor="passenger-birthdate" className="text-xs sm:text-sm">Birthdate *</Label>
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
                      <Label htmlFor="passenger-personalMobile" className="text-xs sm:text-sm">Personal Mobile Number *</Label>
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
                      <Label htmlFor="passenger-emergencyContactName" className="text-xs sm:text-sm">Emergency Contact Name *</Label>
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
                      <Label htmlFor="passenger-emergencyContactRelation" className="text-xs sm:text-sm">Relation *</Label>
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
                      <Label htmlFor="passenger-emergencyContact" className="text-xs sm:text-sm">Emergency Contact Number *</Label>
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
                      <Label htmlFor="passenger-completeAddress" className="text-xs sm:text-sm">Complete Address *</Label>
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
                      <Label htmlFor="passenger-email" className="text-xs sm:text-sm">Email *</Label>
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
                      <Label htmlFor="passenger-password" className="text-xs sm:text-sm">Password *</Label>
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
                      <Label htmlFor="passenger-passwordConfirm" className="text-xs sm:text-sm">Confirm Password *</Label>
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

                    {/* KYC Verification */}
                    <div className="space-y-2 sm:space-y-3 pt-2 border-t border-border">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Identity Verification</h3>
                      
                      <OcrCaptureCard
                        docType="GOVT_ID"
                        label="Government ID or Any Valid ID"
                        onOcrComplete={handleOcrComplete('GOVT_ID')}
                      />

                      <OcrCaptureCard
                        docType="SELFIE"
                        label="Selfie Photo"
                        onOcrComplete={handleOcrComplete('SELFIE')}
                      />
                    </div>

                    <div className="text-xs text-muted-foreground space-y-3 pt-2 border-t border-border">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="privacy-consent"
                          checked={passengerData.privacyConsent}
                          onChange={(e) => setPassengerData(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          required
                        />
                        <label htmlFor="privacy-consent" className="text-justify leading-relaxed cursor-pointer">
                          <span className="font-semibold">I understand</span> and agree that my personal information will be collected, stored, and processed in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). My data will be used solely for service delivery, account verification, and communication purposes. KanggaXpress is committed to protecting my privacy and will not share my information with third parties without my consent.
                        </label>
                      </div>
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
                  /* Simple Registration for Driver/Courier */
                  <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="register-name" className="text-xs sm:text-sm">Full Name</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Juan dela Cruz"
                        value={registerFullName}
                        onChange={(e) => setRegisterFullName(e.target.value)}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="register-email" className="text-xs sm:text-sm">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="register-phone" className="text-xs sm:text-sm">Phone Number</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="+63 912 345 6789"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        className="bg-white h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="register-password" className="text-xs sm:text-sm">Password</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
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

                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full h-10 sm:h-11 text-base sm:text-lg font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* OCR Review Modal */}
        <OcrReviewModal
          open={reviewModal.open}
          onClose={() => setReviewModal({ ...reviewModal, open: false })}
          docType={reviewModal.docType}
          imageUrl={reviewModal.imageUrl}
          parsed={reviewModal.parsed}
          avgConfidence={reviewModal.avgConfidence}
          onAccept={handleOcrAccept}
        />
      </PageLayout>
    </>
  );
}
