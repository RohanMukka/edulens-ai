import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Brain, BarChart3, Network, BookOpen, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { student, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (location === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col premium-gradient relative overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      <header className="border-b border-border/60 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setLocation(student?.role === "educator" ? "/teacher" : "/subjects")}
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
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-9 h-9 rounded-full">
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary" />}
            </Button>
            
            <div className="w-px h-6 bg-border/40 mx-1 hidden sm:block" />
            
            <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/"); }}>
              <LogOut className="w-4 h-4 sm:mr-2 text-muted-foreground" />
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
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
