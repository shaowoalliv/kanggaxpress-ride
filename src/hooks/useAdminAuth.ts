import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return;
      
      if (!user) {
        setIsAdmin(false);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user has kx_admin role
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'kx_admin')
          .maybeSingle();

        if (error) throw error;

        const hasAdminRole = !!roles;
        setIsAdmin(hasAdminRole);

        // Check allowlist
        const email = user.email?.toLowerCase() || '';
        const primaryEmail = import.meta.env.VITE_ADMIN_PRIMARY_EMAIL?.toLowerCase();
        const allowedEmails = import.meta.env.ADMIN_ALLOWED_EMAILS?.toLowerCase().split(',').map((e: string) => e.trim()) || [];
        const allowedDomains = import.meta.env.ADMIN_ALLOWED_DOMAINS?.toLowerCase().split(',').map((d: string) => d.trim()) || [];

        const isPrimaryEmail = primaryEmail && email === primaryEmail;
        const isAllowedEmail = allowedEmails.includes(email);
        const isAllowedDomain = allowedDomains.some((domain: string) => email.endsWith(`@${domain}`));

        const allowlistCheck = isPrimaryEmail || isAllowedEmail || isAllowedDomain;
        setIsAllowed(allowlistCheck);
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, isAllowed, loading: authLoading || loading };
}
