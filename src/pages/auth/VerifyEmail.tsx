import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    checkEmailVerification();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const checkEmailVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setEmail(user.email || '');

      // If email is already confirmed, redirect to choose role
      if (user.email_confirmed_at) {
        toast.success('Email already verified!');
        navigate('/choose-role');
        return;
      }
    } catch (error) {
      console.error('Error checking email verification:', error);
      toast.error('Failed to check verification status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('No email address found');
      return;
    }

    if (cooldownSeconds > 0) {
      toast.error(`Please wait ${cooldownSeconds} seconds before resending`);
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/choose-role`
        }
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox.');
      setCooldownSeconds(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isChecking) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Verify Your Email - KanggaXpress</title>
        <meta name="description" content="Please verify your email address to continue using KanggaXpress" />
      </Helmet>
      
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Verify Your Email
                </h1>
                <p className="text-muted-foreground">
                  We've sent a verification link to:
                </p>
                <p className="text-foreground font-medium mt-2">
                  {email}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3 text-left">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">
                      Click the verification link in your email to activate your account.
                    </p>
                    <p>
                      If you don't see the email, check your spam folder.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <PrimaryButton
                  onClick={handleResendVerification}
                  disabled={isResending || cooldownSeconds > 0}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Wait {cooldownSeconds}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </PrimaryButton>

                <SecondaryButton
                  onClick={handleSignOut}
                  className="w-full"
                >
                  Sign Out
                </SecondaryButton>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                Having trouble? Contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
