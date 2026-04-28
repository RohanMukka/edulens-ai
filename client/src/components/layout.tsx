import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Brain, BarChart3, Network, BookOpen, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

import { Footer } from "@/components/footer";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { student, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (location === "/") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col premium-gradient relative overflow-x-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold">
        Skip to content
      </a>
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      <header className="border-b border-border/60 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setLocation(student?.role === "educator" ? "/teacher" : "/subjects")}
            role="button"
            aria-label="Go to Dashboard"
          >
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline-block">
              EduLens
            </span>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-2">
            {student?.role === "educator" ? (
              <Button 
                variant={location === "/teacher" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setLocation("/teacher")}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant={location === "/subjects" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setLocation("/subjects")}
                >
                  <BookOpen className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline-block">Subjects</span>
                </Button>
                <Button 
                  variant={location === "/graph" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setLocation("/graph")}
                >
                  <Network className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline-block">Graph</span>
                </Button>
                <Button 
                  variant={location === "/dashboard" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setLocation("/dashboard")}
                >
                  <BarChart3 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline-block">Stats</span>
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-9 h-9 rounded-full" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" /> : <Moon className="w-4 h-4 text-primary" aria-hidden="true" />}
            </Button>
            
            <div className="w-px h-6 bg-border/40 mx-1 hidden sm:block" />
            
            <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/"); }} aria-label="Log out">
              <LogOut className="w-4 h-4 sm:mr-2 text-muted-foreground" aria-hidden="true" />
              <span className="hidden sm:inline-block text-muted-foreground">Log out</span>
            </Button>
          </nav>
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.main 
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1"
          id="main-content"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
