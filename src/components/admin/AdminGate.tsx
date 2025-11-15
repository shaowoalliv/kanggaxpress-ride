import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AlertCircle } from 'lucide-react';

interface AdminGateProps {
  children: ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { isAdmin, isAllowed, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            {!isAdmin 
              ? 'You do not have administrator privileges.'
              : 'Your email is not authorized to access the admin panel.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="text-primary hover:underline text-sm"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
