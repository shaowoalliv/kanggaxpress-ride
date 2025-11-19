import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getLocalSessionToken, clearLocalSessionToken } from '@/lib/sessionToken';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

const CHECK_INTERVAL = 10000; // Check every 10 seconds

export function useSessionValidator() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Skip validation if:
    // - Not logged in
    // - In dev preview mode
    // - On QA routes
    if (!user || !profile) return;
    
    const isDevPreview = import.meta.env.VITE_DEV_PREVIEW_ON === 'true';
    const isQARoute = location.pathname.startsWith('/qa');
    
    if (isDevPreview || isQARoute) return;

    const validateSession = async () => {
      if (isValidating) return;
      
      setIsValidating(true);
      try {
        const localToken = getLocalSessionToken();
        
        if (!localToken) {
          // No local token means we need to logout
          await handleInvalidSession();
          return;
        }

        // Fetch current session token from profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('current_session_token')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Session validation error:', error);
          return;
        }

        // Check if tokens match
        if (data.current_session_token !== localToken) {
          await handleInvalidSession();
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    const handleInvalidSession = async () => {
      clearLocalSessionToken();
      await signOut();
      toast.error('Your account has been logged in on another device. Only one active device is allowed.');
      navigate('/auth');
    };

    // Initial check
    validateSession();

    // Set up interval for periodic checks
    const interval = setInterval(validateSession, CHECK_INTERVAL);

    // Set up realtime subscription for immediate detection
    const channel = supabase
      .channel(`session_validation:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newToken = (payload.new as any).current_session_token;
          const localToken = getLocalSessionToken();
          
          if (newToken && newToken !== localToken) {
            handleInvalidSession();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, profile, location.pathname, navigate, signOut, isValidating]);
}
