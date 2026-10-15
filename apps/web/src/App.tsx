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
      
      // CORREÇÃO: Não redireciona se estiver na porta standalone do MFE
      if (window.location.port === '5174') {
        console.warn('Bloqueado redirecionamento automático de login em modo Standalone');
        return;
      }

      if (status === 401 && window.location.pathname !== '/login') {
        window.location.href = `/login?returnTo=${encodeURIComponent(
          window.location.pathname + window.location.search,
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
              {/* Protected App Routes */}
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

              {/* Se tudo falhar e estiver na 5174, renderiza um aviso visual em vez de dar Navigate */}
              <Route 
                path="*" 
                element={
                  window.location.port === '5174' ? (
                    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
                      <h2>MFE Tasks (Porta 5174)</h2>
                      <p>Para testar esta rota isolada, certifique-se de injetar um Token fake no LocalStorage ou use o Shell.</p>
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
