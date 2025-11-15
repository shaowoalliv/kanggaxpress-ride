import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { KanggaLogo } from '@/components/KanggaLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminSignIn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Signed in successfully',
      });

      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Sign In Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Sign In - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <PageLayout showHeader={false}>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center mb-4">
                <KanggaLogo width={80} height={80} className="w-20 h-20" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                  Admin Sign In
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Password-only authentication for administrators
              </p>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@kanggaxpress.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* No Google Button - Password Only */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Admin access is password-only for security.
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
