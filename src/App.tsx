import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthConfirm } from './pages/AuthConfirm';
import { RestaurantSetup } from './pages/RestaurantSetup';
import { Dashboard } from './pages/Dashboard';
import { RestaurantSettings } from './pages/RestaurantSettings';
import { MenuEditor } from './pages/MenuEditor';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from './lib/api';
import type { Restaurant } from './lib/types';

function AuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function RestaurantGuard({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState(false);

  useEffect(() => {
    if (!session) {
      setChecking(false);
      return;
    }

    const check = async () => {
      try {
        const restaurants = await api.get<Restaurant[]>('/api/owner/restaurant');
        setHasRestaurant(restaurants.length > 0);
      } catch {
        setHasRestaurant(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [session]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasRestaurant) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <GuestGuard>
                <Login />
              </GuestGuard>
            }
          />
          <Route
            path="/register"
            element={
              <GuestGuard>
                <Register />
              </GuestGuard>
            }
          />
          <Route path="/auth/confirm" element={<AuthConfirm />} />

          {/* Setup — requires auth but no restaurant yet */}
          <Route
            path="/setup"
            element={
              <AuthGuard>
                <RestaurantSetup />
              </AuthGuard>
            }
          />

          {/* Protected — requires auth + restaurant */}
          <Route
            element={
              <AuthGuard>
                <RestaurantGuard>
                  <Layout />
                </RestaurantGuard>
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/menu" element={<MenuEditor />} />
            <Route path="/settings" element={<RestaurantSettings />} />
          </Route>

          {/* Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
