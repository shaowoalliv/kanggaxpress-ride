import { Helmet } from 'react-helmet';
import { AdminGate } from '@/components/admin/AdminGate';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Outlet } from 'react-router-dom';
import { KanggaLogo } from '@/components/KanggaLogo';

export default function AdminDashboard() {
  return (
    <AdminGate>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <KanggaLogo width={40} height={40} className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-heading font-bold">KanggaXpress Admin</h1>
              <p className="text-xs text-muted-foreground">Management Console</p>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminGate>
  );
}
