import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { Helmet } from 'react-helmet';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if we have the required hash fragment for password reset
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (!accessToken || type !== 'recovery') {
      toast.error('Invalid or expired reset link');
      navigate('/auth');
    }
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      resetSchema.parse({ password, confirmPassword });
      
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password updated successfully!');
      navigate('/auth?reset=success');
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
    <>
      <Helmet>
        <title>Reset Password - KanggaXpress</title>
        <meta name="description" content="Reset your KanggaXpress password" />
      </Helmet>
      <PageLayout>
        <div className="flex-1 flex items-center justify-center px-4 py-8 min-h-screen">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                Reset Your Password
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:underline"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
