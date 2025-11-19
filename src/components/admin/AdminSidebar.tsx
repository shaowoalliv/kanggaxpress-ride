import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Car,
  Users,
  Route,
  Package,
  DollarSign,
  FileCheck,
  Wallet,
  Grid3x3,
  Sparkles,
  Briefcase,
  Scale,
  FileText,
  Settings,
  BadgeDollarSign,
} from 'lucide-react';

const sections = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Drivers', path: '/admin/drivers', icon: Car },
  { name: 'Riders', path: '/admin/riders', icon: Users },
  { name: 'Trips', path: '/admin/trips', icon: Route },
  { name: 'Deliveries', path: '/admin/deliveries', icon: Package },
  { name: 'Pricing', path: '/admin/pricing', icon: DollarSign },
  { name: 'KYC', path: '/admin/kyc', icon: FileCheck },
  { name: 'Finance', path: '/admin/finance', icon: Wallet },
  { name: 'Fare Matrix', path: '/admin/fare-matrix', icon: Grid3x3 },
  { name: 'Fare Tips', path: '/admin/fare-tips', icon: BadgeDollarSign },
  { name: 'Promotions', path: '/admin/promotions', icon: Sparkles },
  { name: 'Ops', path: '/admin/ops', icon: Briefcase },
  { name: 'Disputes', path: '/admin/disputes', icon: Scale },
  { name: 'Audit', path: '/admin/audit', icon: FileText },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <nav className="p-4 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = location.pathname === section.path;
          
          return (
            <Link
              key={section.path}
              to={section.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {section.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
