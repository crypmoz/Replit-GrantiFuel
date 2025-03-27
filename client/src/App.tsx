import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Grants from "@/pages/Grants";
import Artists from "@/pages/Artists";
import ArtistDetail from "@/pages/ArtistDetail";
import Applications from "@/pages/Applications";
import ApplicationDetail from "@/pages/ApplicationDetail";
import Templates from "@/pages/Templates";
import TemplateDetail from "@/pages/TemplateDetail";
import TemplateEdit from "@/pages/TemplateEdit";
import AIAssistant from "@/pages/AIAssistant";
import LandingPage from "@/pages/LandingPage";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "@/hooks/use-theme";
import { ChatbotProvider } from "@/context/ChatbotContext";

function AppContent() {
  const [location] = useLocation();
  
  // Check if the current path is a public page
  const isPublicPage = 
    location === "/" || 
    location === "/about" || 
    location === "/pricing" ||
    location === "/login" ||
    location === "/register" ||
    location === "/contact" ||
    location === "/success-stories" ||
    location === "/blog";
    
  // Dashboard/app layout
  if (!isPublicPage) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/grants" component={Grants} />
              <Route path="/artists" component={Artists} />
              <Route path="/artists/:id" component={ArtistDetail} />
              <Route path="/applications" component={Applications} />
              <Route path="/applications/:id" component={ApplicationDetail} />
              <Route path="/templates" component={Templates} />
              <Route path="/templates/:id" component={TemplateDetail} />
              <Route path="/templates/:id/edit" component={TemplateEdit} />
              <Route path="/ai-assistant" component={AIAssistant} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    );
  }
  
  // Public pages layout (no sidebar)
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ChatbotProvider>
          <AppContent />
          <Toaster />
        </ChatbotProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
