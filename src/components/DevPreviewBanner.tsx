import { AlertCircle } from 'lucide-react';
import { useDevPreviewSession } from '@/hooks/useDevPreviewSession';
import { devPreview } from '@/lib/devPreview';

export function DevPreviewBanner() {
  const previewSession = useDevPreviewSession();

  if (!previewSession) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium shadow-md">
      <div className="flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>
          {devPreview.badge} — viewing as <strong>{previewSession.role}</strong>. Data writes may be limited.
        </span>
      </div>
    </div>
  );
}
