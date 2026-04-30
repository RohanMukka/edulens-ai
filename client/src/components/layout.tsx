import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Brain,
  BarChart3,
  Network,
  BookOpen,
  LogOut,
  MessageSquare,
  Calendar,
} from "lucide-react";
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

  const navItems =
    student?.role === "educator"
      ? [{ label: "Dashboard", path: "/teacher", icon: BarChart3 }]
      : [
          { label: "Learn", path: "/subjects", icon: BookOpen },
          { label: "Knowledge Graph", path: "/graph", icon: Network },
          { label: "Progress", path: "/dashboard", icon: BarChart3 },
          { label: "Forums", path: "/forums", icon: MessageSquare },
          { label: "Scheduler", path: "/scheduler", icon: Calendar },
        ];

  return (
    <div className="min-h-screen bg-background flex flex-col premium-gradient relative overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold"
      >
        Skip to content
      </a>
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

      <header className="border-b border-border/60 bg-card/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() =>
              setLocation(
                student?.role === "educator" ? "/teacher" : "/subjects",
              )
            }
            role="button"
            aria-label="Go to Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-black text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline-block group-hover:opacity-80 transition-opacity">
              EduLens <span className="text-primary">AI</span>
            </span>
          </motion.div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setLocation(item.path)}
                      className={`transition-all ${
                        isActive
                          ? "bg-primary/20 text-primary shadow-lg shadow-primary/20"
                          : "hover:bg-primary/10"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline-block">
                        {item.label}
                      </span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-lg hover:bg-primary/10 transition-all"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? (
                    <Sun
                      className="w-4 h-4 text-amber-400 transition-transform"
                      aria-hidden="true"
                    />
                  ) : (
                    <Moon
                      className="w-4 h-4 text-primary transition-transform"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </motion.div>

              <div className="w-px h-6 bg-border/40 mx-1 hidden sm:block" />

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    setLocation("/");
                  }}
                  className="hover:bg-red-500/10 hover:text-red-500 transition-all"
                  aria-label="Log out"
                >
                  <LogOut
                    className="w-4 h-4 sm:mr-2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline-block text-muted-foreground">
                    Log out
                  </span>
                </Button>
              </motion.div>
            </div>
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
