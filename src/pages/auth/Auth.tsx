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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Car, Package, Mail } from 'lucide-react';
import { UserRole } from '@/types';

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
  
  // Register form
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
      case 'driver': return <Car className="w-5 h-5" />;
      case 'courier': return <Package className="w-5 h-5" />;
      case 'sender': return <Mail className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
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
        <div className="flex-1 flex flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-12">
          <div className="w-full max-w-md space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                Welcome to KanggaXpress
              </h1>
              
              {/* Role Selector */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 p-2 bg-muted rounded-lg">
                <span className="text-xs sm:text-sm text-muted-foreground">Signing in as:</span>
                <div className="flex gap-1">
                  {(['passenger', 'driver', 'courier'] as const).map((r) => (
                    <Button
                      key={r}
                      type="button"
                      size="sm"
                      variant={role === r ? 'default' : 'ghost'}
                      onClick={() => setRole(r)}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      {getRoleIcon(r)}
                      <span className="hidden sm:inline">{getRoleLabel(r)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auth Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                <TabsTrigger value="login" className="text-xs sm:text-sm">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-xs sm:text-sm">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-3 sm:space-y-4">
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
                    className="w-full bg-white text-primary hover:bg-white/90 border border-primary h-9 sm:h-10 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-3 sm:space-y-4">
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
                    className="w-full bg-white text-primary hover:bg-white/90 border border-primary h-9 sm:h-10 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
