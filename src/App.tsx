import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { DevPreviewBanner } from "@/components/DevPreviewBanner";
import "@/styles/animations.css";
import Landing from "./pages/Landing";
import ChooseRole from "./pages/ChooseRole";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/auth/Auth";
import ResetPassword from "./pages/auth/ResetPassword";
import LoginRedirect from "./pages/auth/LoginRedirect";
import SignupRedirect from "./pages/auth/SignupRedirect";
import BookRide from "./pages/passenger/BookRide";
import MyRides from "./pages/passenger/MyRides";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverSetup from "./pages/driver/Setup";
import SenderDashboard from "./pages/sender/Dashboard";
import CreateDelivery from "./pages/sender/CreateDelivery";
import MyDeliveries from "./pages/sender/MyDeliveries";
import CourierDashboard from "./pages/courier/Dashboard";
import CourierSetup from "./pages/courier/Setup";
import KycStatus from "./pages/account/KycStatus";
import HeroAnim from "./pages/qa/HeroAnim";
import QAState from "./pages/qa/QAState";
import QASOT from "./pages/qa/QASOT";
import RoutingPhase1 from "./pages/qa/RoutingPhase1";
import AdminSmoke from "./pages/qa/AdminSmoke";
import QAOOCR from "./pages/qa/OCR";
import QAKYCAdmin from "./pages/qa/KYCAdmin";
import QAMapsKeys from "./pages/qa/MapsKeys";
import DevPreview from "./pages/qa/DevPreview";
import PreviewTest from "./pages/qa/PreviewTest";
import AdminSignIn from "./pages/admin/AdminSignIn";
import AdminDashboard from "./pages/admin/Dashboard";
import DashboardHome from "./pages/admin/DashboardHome";
import Pricing from "./pages/admin/Pricing";
import AdminDrivers from "./pages/admin/Drivers";
import AdminRiders from "./pages/admin/Riders";
import AdminTrips from "./pages/admin/Trips";
import AdminDeliveries from "./pages/admin/Deliveries";
import AdminKYC from "./pages/admin/KYC";
import AdminFinance from "./pages/admin/Finance";
import AdminFareMatrix from "./pages/admin/FareMatrix";
import AdminPromotions from "./pages/admin/Promotions";
import AdminOps from "./pages/admin/Ops";
import AdminDisputes from "./pages/admin/Disputes";
import AdminAudit from "./pages/admin/Audit";
import AdminSettings from "./pages/admin/Settings";
import FareSettings from "./pages/admin/FareSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Keyboard shortcut: Ctrl/Cmd + Alt + D to open dev preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'd') {
        e.preventDefault();
        window.location.href = '/qa/dev-preview';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <InstallPromptBanner />
            <DevPreviewBanner />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/choose-role" element={<ChooseRole />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Legacy redirects */}
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/signup" element={<SignupRedirect />} />
            
            {/* Passenger Routes */}
            <Route path="/passenger/book-ride" element={<BookRide />} />
            <Route path="/passenger/my-rides" element={<MyRides />} />
            
            {/* Driver Routes */}
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/setup" element={<DriverSetup />} />
            
            {/* Sender Routes */}
            <Route path="/sender/dashboard" element={<SenderDashboard />} />
            <Route path="/sender/create-delivery" element={<CreateDelivery />} />
            <Route path="/sender/my-deliveries" element={<MyDeliveries />} />
            
            {/* Courier Routes */}
            <Route path="/courier/dashboard" element={<CourierDashboard />} />
            <Route path="/courier/setup" element={<CourierSetup />} />
            
            {/* Account Routes */}
            <Route path="/account/kyc" element={<KycStatus />} />
            
            {/* Admin Routes */}
            <Route path="/admin-sign-in" element={<AdminSignIn />} />
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="drivers" element={<AdminDrivers />} />
              <Route path="riders" element={<AdminRiders />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="deliveries" element={<AdminDeliveries />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="kyc" element={<AdminKYC />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="fare-matrix" element={<AdminFareMatrix />} />
              <Route path="fare-settings" element={<FareSettings />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="ops" element={<AdminOps />} />
              <Route path="disputes" element={<AdminDisputes />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            {/* QA Routes */}
            <Route path="/qa/hero-anim" element={<HeroAnim />} />
            <Route path="/qa/state" element={<QAState />} />
            <Route path="/qa/sot" element={<QASOT />} />
            <Route path="/qa/routing-phase1" element={<RoutingPhase1 />} />
            <Route path="/qa/admin-smoke" element={<AdminSmoke />} />
            <Route path="/qa/ocr" element={<QAOOCR />} />
            <Route path="/qa/kyc-admin" element={<QAKYCAdmin />} />
            <Route path="/qa/maps-keys" element={<QAMapsKeys />} />
            <Route path="/qa/dev-preview" element={<DevPreview />} />
            <Route path="/qa/preview" element={<PreviewTest />} />
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
