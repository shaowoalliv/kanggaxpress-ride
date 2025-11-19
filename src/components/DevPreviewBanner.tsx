import { AlertCircle } from 'lucide-react';
import { useDevPreviewSession, setPreviewRole } from '@/hooks/useDevPreviewSession';
import { devPreview, isDevPreviewActive } from '@/lib/devPreview';
import { useEffect, useState } from 'react';

export function DevPreviewBanner() {
  const previewSession = useDevPreviewSession();
  const [showActivator, setShowActivator] = useState(false);

  useEffect(() => {
    // Show activator button if dev preview is enabled but no session
    const isActive = isDevPreviewActive();
    const hasSession = !!previewSession;
    
    console.log('[DevPreview] Status:', { 
      isActive, 
      hasSession,
      enabled: devPreview.enabled,
      hostAllowed: devPreview.hostAllowed,
      allowRoles: devPreview.allowRoles 
    });
    
    setShowActivator(isActive && !hasSession);
  }, [previewSession]);

  // Show activator button when dev preview is enabled but no role selected
  if (showActivator) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span>🔧 Dev Preview Available - Select a role:</span>
          <div className="flex gap-2">
            {devPreview.allowRoles.map((role) => (
              <button
                key={role}
                onClick={() => setPreviewRole(role as any)}
                className="px-3 py-1 rounded text-xs font-semibold bg-white text-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show role switcher when a preview session is active
  if (previewSession) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium shadow-md">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>
              {devPreview.badge} — viewing as <strong>{previewSession.role}</strong>
            </span>
          </div>
          
          <div className="flex gap-2">
            {devPreview.allowRoles.map((role) => (
              <button
                key={role}
                onClick={() => setPreviewRole(role as any)}
                disabled={role === previewSession.role}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  role === previewSession.role
                    ? 'bg-amber-950 text-amber-500 cursor-default'
                    : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setPreviewRole(null)}
              className="px-3 py-1 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-95"
            >
              Exit Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
