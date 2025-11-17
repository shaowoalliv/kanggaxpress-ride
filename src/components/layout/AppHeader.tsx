import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HamburgerMenu } from './HamburgerMenu';

/**
 * AppHeader Component - LOCKED CONFIGURATION
 * 
 * IMPORTANT: This header is configured to show ONLY the hamburger menu.
 * DO NOT add logo, branding, or other elements to this header.
 * The landing page uses its own separate header component.
 * 
 * This configuration is intentional and should not be modified.
 */
export function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* LOCKED: Only hamburger menu - DO NOT ADD LOGO OR BRANDING */}
        <HamburgerMenu />
        
        {/* Empty spacer for layout balance */}
        <div className="flex-1" />

        {user && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="gap-2 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{profile?.full_name}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
