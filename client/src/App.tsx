import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Landing from "@/pages/landing";
import SubjectSelection from "@/pages/subject-selection";
import LearningInterface from "@/pages/learning-interface";
import KnowledgeGraph from "@/pages/knowledge-graph";
import Dashboard from "@/pages/dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/subjects" component={SubjectSelection} />
        <Route path="/learn/:sessionId" component={LearningInterface} />
        <Route path="/graph" component={KnowledgeGraph} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/teacher" component={TeacherDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
