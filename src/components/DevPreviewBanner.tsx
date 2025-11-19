import { AlertCircle } from 'lucide-react';
import { useDevPreviewSession } from '@/hooks/useDevPreviewSession';
import { devPreview } from '@/lib/devPreview';

export function DevPreviewBanner() {
  const previewSession = useDevPreviewSession();

  if (!previewSession) return null;

  const switchRole = (newRole: string) => {
    localStorage.setItem('dev_preview_role', newRole);
    window.location.reload();
  };

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
              onClick={() => switchRole(role)}
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
        </div>
      </div>
    </div>
  );
}
