import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { KanggaLogo } from '@/components/KanggaLogo';
import { User, Car, Package } from 'lucide-react';

export default function ChooseRole() {
  return (
    <>
      <Helmet>
        <title>Choose Your Role - KanggaXpress</title>
        <meta name="description" content="Select your role to get started with KanggaXpress" />
      </Helmet>
      <PageLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center mb-2 sm:mb-4">
                <KanggaLogo width={240} height={240} className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground px-4">
                Welcome to KanggaXpress
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground px-4">
                Choose how you'd like to use our service
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Passenger Card */}
              <Link
                to="/auth?role=passenger"
                data-testid="role-card-passenger"
                className="group relative bg-card border-2 border-border rounded-xl p-6 sm:p-8 hover:border-primary transition-all hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[200px] flex items-center"
              >
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                  <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <User className="w-10 h-10 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                      Passenger
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Book rides and get to your destination safely and affordably
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Continue as Passenger →
                    </span>
                  </div>
                </div>
              </Link>

              {/* Driver Card */}
              <Link
                to="/auth?role=driver"
                data-testid="role-card-driver"
                className="group relative bg-card border-2 border-border rounded-xl p-6 sm:p-8 hover:border-primary transition-all hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[200px] flex items-center"
              >
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                  <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Car className="w-10 h-10 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                      Driver
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Earn money by providing safe and reliable transportation
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Continue as Driver →
                    </span>
                  </div>
                </div>
              </Link>

              {/* Courier Card */}
              <Link
                to="/auth?role=courier"
                data-testid="role-card-courier"
                className="group relative bg-card border-2 border-border rounded-xl p-6 sm:p-8 hover:border-primary transition-all hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-span-2 lg:col-span-1 min-h-[200px] flex items-center"
              >
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                  <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Package className="w-10 h-10 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
                      Courier
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Deliver packages and earn flexible income on your schedule
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Continue as Courier →
                    </span>
                  </div>
                </div>
              </Link>
            </div>

          </div>
        </div>
      </PageLayout>
    </>
  );
}
