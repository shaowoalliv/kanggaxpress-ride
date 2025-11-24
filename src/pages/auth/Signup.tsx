import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { z } from 'zod';
import { UserRole } from '@/types';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

export default function Signup() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(roleParam === 'driver' ? 'driver' : 'passenger');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Update role if URL parameter changes
  useEffect(() => {
    if (roleParam === 'driver') {
      setRole('driver');
    }
  }, [roleParam]);

  // Redirect if already logged in
  if (user && profile) {
    switch (profile.role) {
      case 'driver':
        navigate('/driver/dashboard');
        break;
      case 'courier':
        navigate('/courier/dashboard');
        break;
      case 'sender':
        navigate('/sender/dashboard');
        break;
      case 'passenger':
      default:
        navigate('/passenger/book-ride');
        break;
    }
    return null;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate input
      signupSchema.parse({ email, password, full_name: fullName, phone });
      
      setLoading(true);
      
      // Sign up with metadata
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Account created! Please verify your email to continue.');
      // Redirect to verify email page
      navigate('/verify-email');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout showHeader={false}>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Join KanggaXpress
            </h1>
            <p className="text-muted-foreground mt-2">
              Create your account to get started
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label>I want to</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-border hover:bg-muted/50">
                    <p className="font-semibold text-sm mb-2">🚗 Ride Services</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pl-2">
                        <RadioGroupItem value="passenger" id="passenger" />
                        <Label htmlFor="passenger" className="cursor-pointer flex-1">
                          <span className="font-medium">Book Rides</span>
                          <p className="text-xs text-muted-foreground">Request transport</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 pl-2">
                        <RadioGroupItem value="driver" id="driver" />
                        <Label htmlFor="driver" className="cursor-pointer flex-1">
                          <span className="font-medium">Drive & Earn</span>
                          <p className="text-xs text-muted-foreground">Provide rides</p>
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg border border-border hover:bg-muted/50">
                    <p className="font-semibold text-sm mb-2">📦 Delivery Services</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pl-2">
                        <RadioGroupItem value="sender" id="sender" />
                        <Label htmlFor="sender" className="cursor-pointer flex-1">
                          <span className="font-medium">Send Packages</span>
                          <p className="text-xs text-muted-foreground">Request delivery</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 pl-2">
                        <RadioGroupItem value="courier" id="courier" />
                        <Label htmlFor="courier" className="cursor-pointer flex-1">
                          <span className="font-medium">Deliver & Earn</span>
                          <p className="text-xs text-muted-foreground">Provide delivery</p>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+63 912 345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <PrimaryButton type="submit" isLoading={loading}>
              Create Account
            </PrimaryButton>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-medium hover:underline">
                Sign in
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:underline block">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
