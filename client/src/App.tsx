import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Dashboard from "./pages/Dashboard";
import Grants from "./pages/Grants";
import NewGrantForm from "./pages/NewGrantForm";
import GrantDetail from "./pages/GrantDetail";
import Artists from "./pages/Artists";
import ArtistDetail from "./pages/ArtistDetail";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import NewApplicationForm from "./pages/NewApplicationForm";
import Templates from "./pages/Templates";
import TemplateDetail from "./pages/TemplateDetail";
import TemplateEdit from "./pages/TemplateEdit";
import AIAssistant from "./pages/AIAssistant";
import GrantRecommendations from "./pages/GrantRecommendations";
import Documents from "./pages/Documents";
import UserManagement from "./pages/admin/UserManagement";
import AdminDashboard from "./pages/admin/Dashboard";
import AiControls from "./pages/admin/AiControls";
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import AuthPage from "./pages/auth-page";
import ProfilePage from "./pages/ProfilePage";
import ProgressDashboard from "./pages/ProgressDashboard";
import SettingsPage from "./pages/SettingsPage";
import Checkout from "./pages/checkout";
import SuccessStories from "./pages/SuccessStories";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { ThemeProvider } from "./hooks/use-theme";
import { ChatbotProvider } from "./context/ChatbotContext";
import { AuthProvider } from "./hooks/use-auth";
import { OnboardingProvider } from "./hooks/use-onboarding";
import { ProtectedRoute } from "./lib/protected-route";
import { 
  RoleBasedRoute, 
  AdminRoute, 
  GrantWriterRoute,
  ManagerRoute,
  ArtistRoute 
} from "./lib/role-based-route";
import { SkipToContent, LiveRegion } from "./components/ui/a11y-utils";

function AppContent() {
  const [location] = useLocation();

  // Check if the current path is a public page
  const isPublicPage = 
    location === "/" || 
    location === "/about" || 
    location === "/pricing" ||
    location === "/auth" ||
    location === "/contact" ||
    location === "/success-stories" ||
    location === "/blog" ||
    location.startsWith("/checkout");

  // Dashboard/app layout
  if (!isPublicPage) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SkipToContent contentId="main-content" />
        <LiveRegion ariaLive="polite">
          {location.replace('/', '').length > 0 
            ? `You are now on the ${location.replace('/', '')} page` 
            : 'You are now on the dashboard page'}
        </LiveRegion>

        <nav aria-label="Main navigation">
          <Sidebar />
        </nav>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header role="banner">
            <Header />
          </header>

          <main 
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8"
            aria-label="Main content"
          >
            <Switch>
              {/* Dashboard is accessible by all authenticated users */}
              <ProtectedRoute path="/dashboard" component={Dashboard} />
              
              {/* Grant management - accessible by grant writers and admins */}
              <GrantWriterRoute path="/grants/new" component={NewGrantForm} />
              <ProtectedRoute path="/grants" component={Grants} />
              <ProtectedRoute path="/grants/:id" component={GrantDetail} />
              
              {/* Artist management - accessible by appropriate roles */}
              <ArtistRoute path="/artists" component={Artists} />
              <ArtistRoute path="/artists/:id" component={ArtistDetail} />
              
              {/* Application management */}
              <ArtistRoute path="/applications/new" component={NewApplicationForm} />
              <ArtistRoute path="/applications/:id" component={ApplicationDetail} />
              <ManagerRoute path="/applications" component={Applications} />
              
              {/* Templates - admin and grant writers can edit */}
              <GrantWriterRoute path="/templates/:id/edit" component={TemplateEdit} />
              <ArtistRoute path="/templates/:id" component={TemplateDetail} />
              <ArtistRoute path="/templates" component={Templates} />
              
              {/* AI Assistant is available to premium users (all roles) */}
              <ProtectedRoute path="/ai-assistant" component={AIAssistant} />
              
              {/* Grant Recommendations - accessible to all authenticated users */}
              <ProtectedRoute path="/grant-recommendations" component={GrantRecommendations} />
              
              {/* Document management - different roles have different access */}
              <ProtectedRoute path="/documents" component={Documents} />
              
              {/* User profile and settings */}
              <ProtectedRoute path="/profile" component={ProfilePage} />
              <ProtectedRoute path="/progress" component={ProgressDashboard} />
              <ProtectedRoute path="/settings" component={SettingsPage} />
              
              {/* Admin section */}
              <AdminRoute path="/admin" component={AdminDashboard} />
              <AdminRoute path="/admin/users" component={UserManagement} />
              <AdminRoute path="/admin/ai-controls" component={AiControls} />
              
              {/* Access denied page */}
              <Route path="/unauthorized" component={UnauthorizedPage} />
              
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    );
  }

  // Public pages layout (no sidebar)
  return (
    <>
      <SkipToContent contentId="main-content" />
      <LiveRegion ariaLive="polite">
        {location === '/' 
          ? 'You are now on the home page' 
          : `You are now on the ${location.replace('/', '')} page`}
      </LiveRegion>

      <main id="main-content" tabIndex={-1}>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/about" component={About} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/checkout/:planName" component={Checkout} />
          <Route path="/success-stories" component={SuccessStories} />
          <Route path="/blog" component={Blog} />
          <Route path="/contact" component={Contact} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider queryClient={queryClient}>
            <ChatbotProvider>
              <AppContent />
              <Toaster />
            </ChatbotProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;