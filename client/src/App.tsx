import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/home";
import Landing from "./pages/landing";
import AuthCallback from "./pages/auth-callback";
import AIBuilder from "./pages/ai-builder";
import MyPrompts from "./pages/my-prompts";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/library" component={Home} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/ai-builder" component={AIBuilder} />
      <Route path="/my-prompts" component={MyPrompts} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
