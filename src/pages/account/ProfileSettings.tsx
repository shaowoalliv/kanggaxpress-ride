import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, AlertCircle, RefreshCw, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsVerified(!!user.email_confirmed_at);
  }, [user, navigate]);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleResendVerification = async () => {
    if (!user?.email || cooldownSeconds > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/account/profile-settings`
        }
      });

      if (error) throw error;

      toast.success('Verification email sent! Please check your inbox.');
      setCooldownSeconds(60);
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  if (!user || !profile) {
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
        <title>Profile Settings - KanggaXpress</title>
        <meta name="description" content="Manage your KanggaXpress profile and account settings" />
      </Helmet>

      <PageLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold font-heading mb-6">Profile Settings</h1>

          {/* Email Verification Status */}
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Email Verification</h2>
                </div>
                
                <div className="ml-8 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    {isVerified ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>

                  {!isVerified && (
                    <div className="bg-muted/50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Please verify your email address to unlock all features and ensure account security.
                      </p>
                      <PrimaryButton
                        onClick={handleResendVerification}
                        disabled={isResending || cooldownSeconds > 0}
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Profile Information</h2>
            </div>

            <div className="ml-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{profile.full_name}</span>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{profile.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant="outline" className="capitalize">
                  {profile.role}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <SecondaryButton onClick={() => navigate(-1)}>
              Back
            </SecondaryButton>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
