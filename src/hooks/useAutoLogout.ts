import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { clearLocalSessionToken } from '@/lib/sessionToken';

/**
 * Auto-logout hook - signs out user when they close the app/tab/window
 * Respects dev preview mode (doesn't auto-logout in dev preview)
 */
export function useAutoLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Skip auto-logout in dev preview mode
    const isDevPreview = import.meta.env.VITE_DEV_PREVIEW_ON === 'true';
    if (isDevPreview) {
      return;
    }

    const handleAppExit = async () => {
      try {
        // Clear session token
        clearLocalSessionToken();
        
        // Sign out from Supabase
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error during auto-logout:', error);
      }
    };

    // Listen for beforeunload (tab/window close)
    window.addEventListener('beforeunload', handleAppExit);

    // Listen for pagehide (mobile browsers, PWA)
    window.addEventListener('pagehide', handleAppExit);

    return () => {
      window.removeEventListener('beforeunload', handleAppExit);
      window.removeEventListener('pagehide', handleAppExit);
    };
  }, [navigate]);
}
