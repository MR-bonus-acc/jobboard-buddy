import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Jobs from "./pages/dashboard/Jobs";
import JobKanban from "./pages/dashboard/JobKanban";
import Candidates from "./pages/dashboard/Candidates";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import CreateCustomer from "./pages/admin/CreateCustomer";
import ApplyJob from "./pages/ApplyJob";
const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'customer' }) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole === 'admin' && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      
      <Route path="/apply/:jobId" element={<ApplyJob />} />
      
      {/* Customer routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="customer"><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/jobs" element={<ProtectedRoute requiredRole="customer"><Jobs /></ProtectedRoute>} />
      <Route path="/dashboard/jobs/:jobId" element={<ProtectedRoute requiredRole="customer"><JobKanban /></ProtectedRoute>} />
      <Route path="/dashboard/candidates" element={<ProtectedRoute requiredRole="customer"><Candidates /></ProtectedRoute>} />
      
      {/* Admin routes - only user_roles.role = 'admin' can access */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><ManageUsers /></ProtectedRoute>} />
      <Route path="/admin/create-customer" element={<ProtectedRoute requiredRole="admin"><CreateCustomer /></ProtectedRoute>} />
      

      {/*404 error route*/}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
