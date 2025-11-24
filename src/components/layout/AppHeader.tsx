import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HamburgerMenu } from './HamburgerMenu';
import { NotificationBell } from '@/components/NotificationBell';

/**
 * AppHeader Component - LOCKED CONFIGURATION
 * 
 * IMPORTANT: This header is configured to show ONLY the hamburger menu.
 * DO NOT add logo, branding, or other elements to this header.
 * The landing page uses its own separate header component.
 * 
 * This configuration is intentional and should not be modified.
 */

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* LOCKED: Only hamburger menu - DO NOT ADD LOGO OR BRANDING */}
        <HamburgerMenu />
        
        {/* Spacer */}
        <div className="flex-1" />

        {/* Right section: Notification Bell + Greeting + User name */}
        {user && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationBell userId={profile?.id} />
            {title && (
              <h1 className="text-primary-foreground font-semibold text-sm sm:text-base truncate max-w-[200px]">
                {title}
              </h1>
            )}
            <span className="text-primary-foreground text-sm font-medium hidden sm:inline truncate max-w-[120px]">
              {profile?.full_name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
