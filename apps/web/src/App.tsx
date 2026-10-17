import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { AuthProvider } from './context/auth-context';
import { ThemeProvider } from './context/theme-context';
import { AuthLayout } from './components/layout/auth-layout';
import { ProtectedRoute } from './components/layout/protected-route';
import { TasksPage } from './pages/tasks-page';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const status = (error as { status?: number })?.status;
      
      if (window.location.port === '5174') {
        console.warn('A identidade deve ser fornecida pelo Shell em modo Standalone.');
        return;
      }

      if (status === 401) {
        const shellBaseUrl = import.meta.env.VITE_SHELL_BASE_URL ?? 'http://localhost:3000';
        window.location.href = `${shellBaseUrl}/api/v1/auth/login?returnTo=${encodeURIComponent(
          window.location.href,
        )}`;
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route
                element={
                  <ProtectedRoute>
                    <AuthLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<TasksPage />} />
                <Route path="/tasks" element={<TasksPage />} />
              </Route>

              <Route 
                path="*" 
                element={
                  window.location.port === '5174' ? (
                    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
                      <h2>MFE Tasks (Porta 5174)</h2>
                      <p>Abra esta aplicação pelo Shell para fornecer a identidade autenticada.</p>
                      <button onClick={() => window.location.href = '/'}>Ir para Raiz</button>
                    </div>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
