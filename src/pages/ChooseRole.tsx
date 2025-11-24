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
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8 md:py-12">
          <div className="max-w-4xl w-full space-y-4 sm:space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
              <div className="inline-flex items-center justify-center">
                <KanggaLogo width={480} height={480} className="w-48 h-48 sm:w-80 sm:h-80 md:w-[28rem] md:h-[28rem] lg:w-[36rem] lg:h-[36rem]" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground px-2 sm:px-4">
                Welcome to KanggaXpress
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-4">
                Choose how you'd like to use our service
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {/* Passenger Card */}
              <Link
                to="/auth?role=passenger"
                data-testid="role-card-passenger"
                className="group relative bg-card border-2 border-border rounded-xl p-4 sm:p-6 md:p-8 hover:border-primary transition-all hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center"
              >
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 md:space-y-4 w-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center transition-colors">
                    <User className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground mb-1 sm:mb-2">
                      Passenger
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Book rides and get to your destination safely and affordably
                    </p>
                  </div>
                  <div className="mt-auto pt-2 sm:pt-3 md:pt-4">
                    <span className="text-xs sm:text-sm font-medium text-primary group-hover:underline">
                      Continue as Passenger →
                    </span>
                  </div>
                </div>
              </Link>

              {/* Driver Card */}
              <Link
                to="/auth?role=driver"
                data-testid="role-card-driver"
                className="group relative bg-card border-2 border-border rounded-xl p-4 sm:p-6 md:p-8 hover:border-primary transition-all hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center"
              >
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 md:space-y-4 w-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center transition-colors">
                    <Car className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground mb-1 sm:mb-2">
                      Driver
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Earn money by providing safe and reliable transportation
                    </p>
                  </div>
                  <div className="mt-auto pt-2 sm:pt-3 md:pt-4">
                    <span className="text-xs sm:text-sm font-medium text-primary group-hover:underline">
                      Continue as Driver →
                    </span>
                  </div>
                </div>
              </Link>

              {/* Courier Card */}
              <Link
                to="/auth?role=courier"
                data-testid="role-card-courier"
                className="group relative bg-card border-2 border-border rounded-xl p-4 sm:p-6 md:p-8 hover:border-primary transition-all hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-span-2 lg:col-span-1 flex items-center"
              >
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 md:space-y-4 w-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center transition-colors">
                    <Package className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground mb-1 sm:mb-2">
                      Courier
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Deliver packages and earn flexible income on your schedule
                    </p>
                  </div>
                  <div className="mt-auto pt-2 sm:pt-3 md:pt-4">
                    <span className="text-xs sm:text-sm font-medium text-primary group-hover:underline">
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
