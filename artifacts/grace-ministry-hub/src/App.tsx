import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { Layout } from '@/components/layout';
import DashboardPage from '@/pages/dashboard';
import ConversationPage from '@/pages/conversation';
import ServiceBuilderPage from '@/pages/service-builder';
import ServicePlanPage from '@/pages/service-plan';
import ChurchProfilePage from '@/pages/church-profile';
import { PilotAccess } from '@/components/pilot-access';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/conversations/:id" component={ConversationPage} />
          <Route path="/service-builder" component={ServiceBuilderPage} />
          <Route path="/service-builder/:id" component={ServicePlanPage} />
          <Route path="/church-profile" component={ChurchProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Layout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <PilotAccess>
            <Router />
          </PilotAccess>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
