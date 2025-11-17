import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanggaLogo } from '@/components/KanggaLogo';
import { HamburgerMenu } from './HamburgerMenu';

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
        {/* Hamburger Menu */}
        <HamburgerMenu />
        
        <Link to="/" className="flex items-center gap-2">
          <KanggaLogo width={32} height={32} />
          <span className="text-lg font-heading font-bold text-primary-foreground">KanggaXpress</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{profile?.full_name}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
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
