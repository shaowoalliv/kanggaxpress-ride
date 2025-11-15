import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { canBypassAuth, devPreview } from '@/lib/devPreview';

const PREVIEW_STORAGE_KEY = 'kx_dev_preview';

export interface PreviewSession {
  isPreview: true;
  role: 'passenger' | 'driver' | 'courier';
  id: string; // Fake ID for UI consistency
  email: string;
  full_name: string;
}

export function useDevPreviewSession() {
  const location = useLocation();
  const [previewSession, setPreviewSession] = useState<PreviewSession | null>(null);

  useEffect(() => {
    // Only check if preview can be active on current route
    if (!canBypassAuth(location.pathname)) {
      setPreviewSession(null);
      return;
    }

    // Check localStorage for preview role
    const stored = localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!stored) {
      setPreviewSession(null);
      return;
    }

    try {
      const data = JSON.parse(stored);
      if (data.role && devPreview.allowRoles.includes(data.role)) {
        setPreviewSession({
          isPreview: true,
          role: data.role,
          id: `preview-${data.role}-${Date.now()}`,
          email: `preview-${data.role}@dev.local`,
          full_name: `Preview ${data.role.charAt(0).toUpperCase() + data.role.slice(1)}`,
        });
      } else {
        setPreviewSession(null);
      }
    } catch {
      setPreviewSession(null);
    }
  }, [location.pathname]);

  return previewSession;
}

export function setPreviewRole(role: 'passenger' | 'driver' | 'courier' | null) {
  if (!role) {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
    window.location.reload();
    return;
  }

  if (!devPreview.allowRoles.includes(role)) {
    console.warn(`Preview role ${role} not allowed`);
    return;
  }

  localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify({ role }));
  window.location.reload();
}

export function getPreviewRole(): string | null {
  const stored = localStorage.getItem(PREVIEW_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    return data.role || null;
  } catch {
    return null;
  }
}
