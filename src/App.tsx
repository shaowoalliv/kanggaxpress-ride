import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import { ChatWidget } from "@/components/ChatWidget";
import { useSessionValidator } from "@/hooks/useSessionValidator";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import "@/styles/animations.css";
import Landing from "./pages/Landing";
import ChooseRole from "./pages/ChooseRole";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/auth/Auth";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import LoginRedirect from "./pages/auth/LoginRedirect";
import SignupRedirect from "./pages/auth/SignupRedirect";
import BookRide from "./pages/passenger/BookRide";
import RideStatus from "./pages/passenger/RideStatus";
import MyRides from "./pages/passenger/MyRides";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverSetup from "./pages/driver/Setup";
import DriverJobs from "./pages/driver/Jobs";
import JobDetail from "./pages/driver/JobDetail";
import DriverWallet from "./pages/driver/Wallet";
import SenderDashboard from "./pages/sender/Dashboard";
import CreateDelivery from "./pages/sender/CreateDelivery";
import MyDeliveries from "./pages/sender/MyDeliveries";
import CourierDashboard from "./pages/courier/Dashboard";
import CourierSetup from "./pages/courier/Setup";
import CourierWallet from "./pages/courier/Wallet";
import KycStatus from "./pages/account/KycStatus";
import ProfileSettings from "./pages/account/ProfileSettings";
import AdminSignIn from "./pages/admin/AdminSignIn";
import AdminDashboard from "./pages/admin/Dashboard";
import DashboardHome from "./pages/admin/DashboardHome";
import Coverage from "./pages/admin/Coverage";
import Pricing from "./pages/admin/Pricing";
import AdminDrivers from "./pages/admin/Drivers";
import AdminRiders from "./pages/admin/Riders";
import AdminTrips from "./pages/admin/Trips";
import AdminDeliveries from "./pages/admin/Deliveries";
import AdminKYC from "./pages/admin/KYC";
import AdminNotifications from "./pages/admin/Notifications";
import AdminFinance from "./pages/admin/Finance";
import AdminFareMatrix from "./pages/admin/FareMatrix";
import AdminFareTips from "./pages/admin/FareTips";
import AdminPromotions from "./pages/admin/Promotions";
import AdminOps from "./pages/admin/Ops";
import AdminDisputes from "./pages/admin/Disputes";
import AdminAudit from "./pages/admin/Audit";
import AdminSettings from "./pages/admin/Settings";
import AdminWallets from "./pages/admin/Wallets";
import TestDataSeeder from "./pages/admin/TestDataSeeder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for session validation, push notifications, and auto-logout
function SessionValidatorWrapper() {
  useSessionValidator();
  usePushNotifications();
  useAutoLogout();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <SessionValidatorWrapper />
          <Toaster />
          <Sonner />
          
          <ChatWidget />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/choose-role" element={<ChooseRole />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Legacy redirects */}
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/signup" element={<SignupRedirect />} />
            
            {/* Passenger Routes */}
            <Route path="/passenger/book-ride" element={<BookRide />} />
            <Route path="/passenger/ride-status/:rideId" element={<RideStatus />} />
            <Route path="/passenger/my-rides" element={<MyRides />} />
            
            {/* Driver Routes */}
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/setup" element={<DriverSetup />} />
            <Route path="/driver/jobs" element={<DriverJobs />} />
            <Route path="/driver/jobs/:rideId" element={<JobDetail />} />
            <Route path="/driver/wallet" element={<DriverWallet />} />
            
            {/* Sender Routes */}
            <Route path="/sender/dashboard" element={<SenderDashboard />} />
            <Route path="/sender/create-delivery" element={<CreateDelivery />} />
            <Route path="/sender/my-deliveries" element={<MyDeliveries />} />
            
            {/* Courier Routes */}
            <Route path="/courier/dashboard" element={<CourierDashboard />} />
            <Route path="/courier/setup" element={<CourierSetup />} />
            <Route path="/courier/wallet" element={<CourierWallet />} />
            
            {/* Account Routes */}
            <Route path="/account/kyc" element={<KycStatus />} />
            <Route path="/account/profile-settings" element={<ProfileSettings />} />
            
            {/* Admin Routes */}
            <Route path="/admin-sign-in" element={<AdminSignIn />} />
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="drivers" element={<AdminDrivers />} />
              <Route path="riders" element={<AdminRiders />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="deliveries" element={<AdminDeliveries />} />
              <Route path="coverage" element={<Coverage />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="kyc" element={<AdminKYC />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="wallets" element={<AdminWallets />} />
              <Route path="fare-matrix" element={<AdminFareMatrix />} />
              <Route path="fare-tips" element={<AdminFareTips />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="ops" element={<AdminOps />} />
              <Route path="disputes" element={<AdminDisputes />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="test-data-seeder" element={<TestDataSeeder />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
