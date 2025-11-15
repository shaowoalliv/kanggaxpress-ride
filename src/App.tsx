import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import "@/styles/animations.css";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import BookRide from "./pages/passenger/BookRide";
import MyRides from "./pages/passenger/MyRides";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverSetup from "./pages/driver/Setup";
import SenderDashboard from "./pages/sender/Dashboard";
import CreateDelivery from "./pages/sender/CreateDelivery";
import MyDeliveries from "./pages/sender/MyDeliveries";
import CourierDashboard from "./pages/courier/Dashboard";
import CourierSetup from "./pages/courier/Setup";
import HeroAnim from "./pages/qa/HeroAnim";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <InstallPromptBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
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
            
            {/* QA Routes */}
            <Route path="/qa/hero-anim" element={<HeroAnim />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
