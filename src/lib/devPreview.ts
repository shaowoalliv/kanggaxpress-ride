// Dev Preview Mode - Development-only auth bypass
// CRITICAL: Only works on allowed hosts with explicit env flag

interface DevPreviewConfig {
  enabled: boolean;
  allowRoles: string[];
  blockAdmin: boolean;
  hostAllowed: boolean;
  badge: string;
}

function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  return val.toLowerCase() === 'true' || val === '1';
}

function parseCsv(val: string | undefined): string[] {
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

function matchesHost(domainsStr: string | undefined): boolean {
  if (!domainsStr) return false;
  
  const currentHost = window.location.host; // e.g., localhost:5173
  const domains = parseCsv(domainsStr);
  
  return domains.some(pattern => {
    // Exact match
    if (pattern === currentHost) return true;
    
    // Wildcard port match: localhost:* matches localhost:5173
    if (pattern.includes(':*')) {
      const [domain] = pattern.split(':');
      const [currentDomain] = currentHost.split(':');
      if (domain === currentDomain) return true;
    }
    
    // Wildcard subdomain match: *.lovable.dev matches xyz.lovable.dev
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // .lovable.dev
      if (currentHost.endsWith(suffix)) return true;
    }
    
    return false;
  });
}

export const devPreview: DevPreviewConfig = {
  enabled: parseBool(import.meta.env.VITE_DEV_PREVIEW_ON),
  allowRoles: parseCsv(import.meta.env.VITE_DEV_PREVIEW_ALLOW_ROLES),
  blockAdmin: parseBool(import.meta.env.VITE_DEV_PREVIEW_BLOCK_ADMIN),
  hostAllowed: matchesHost(import.meta.env.VITE_DEV_PREVIEW_DOMAINS),
  badge: import.meta.env.VITE_DEV_PREVIEW_BADGE || 'Dev Preview',
};

export function isDevPreviewActive(): boolean {
  return devPreview.enabled && devPreview.hostAllowed;
}

export function canBypassAuth(pathname: string): boolean {
  if (!isDevPreviewActive()) return false;
  
  // Admin routes never bypass
  if (devPreview.blockAdmin && pathname.startsWith('/admin')) {
    return false;
  }
  
  return true;
}
