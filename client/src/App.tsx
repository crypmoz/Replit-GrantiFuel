import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/Dashboard";
import Grants from "./pages/Grants";
import NewGrantForm from "./pages/NewGrantForm";
import GrantDetail from "./pages/GrantDetail";
import Artists from "./pages/Artists";
import ArtistDetail from "./pages/ArtistDetail";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import NewApplicationForm from "./pages/NewApplicationForm"; // Added import
import Templates from "./pages/Templates";
import TemplateDetail from "./pages/TemplateDetail";
import TemplateEdit from "./pages/TemplateEdit";
import AIAssistant from "./pages/AIAssistant";
import Documents from "./pages/Documents";
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import AuthPage from "./pages/auth-page";
import ProfilePage from "./pages/ProfilePage";
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
              <ProtectedRoute path="/dashboard" component={Dashboard} />
              <ProtectedRoute path="/grants" component={Grants} />
              <ProtectedRoute path="/grants/new" component={NewGrantForm} />
              <ProtectedRoute path="/grants/:id" component={GrantDetail} />
              <ProtectedRoute path="/artists" component={Artists} />
              <ProtectedRoute path="/artists/:id" component={ArtistDetail} />
              <ProtectedRoute path="/applications/new" component={NewApplicationForm} />
              <ProtectedRoute path="/applications/:id" component={ApplicationDetail} />
              <ProtectedRoute path="/applications" component={Applications} />
              <ProtectedRoute path="/templates" component={Templates} />
              <ProtectedRoute path="/templates/:id" component={TemplateDetail} />
              <ProtectedRoute path="/templates/:id/edit" component={TemplateEdit} />
              <ProtectedRoute path="/ai-assistant" component={AIAssistant} />
              <ProtectedRoute path="/documents" component={Documents} />
              <ProtectedRoute path="/profile" component={ProfilePage} />
              <ProtectedRoute path="/settings" component={SettingsPage} />
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