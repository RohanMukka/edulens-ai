import { Brain, Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-card/30 border-t border-border/40 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EduLens
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Revolutionizing personalized education through transparent, agentic
            AI diagnostics. Built to bridge the 2-sigma learning gap for every
            student on Earth.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full"
            >
              <Github className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full"
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full"
            >
              <Linkedin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6">
            Platform
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <a
                href="#/subjects"
                className="hover:text-primary transition-colors"
              >
                Learning Path
              </a>
            </li>
            <li>
              <a
                href="#/graph"
                className="hover:text-primary transition-colors"
              >
                Knowledge Graph
              </a>
            </li>
            <li>
              <a href="#/demo" className="hover:text-primary transition-colors">
                AI Demo
              </a>
            </li>
            <li>
              <a
                href="#/forums"
                className="hover:text-primary transition-colors"
              >
                Community Forums
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6">
            Resources
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Research Papers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                API Reference
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-6">
            Built For
          </h4>
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-widest">
              Innovation Challenge 2026
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              A competition-grade implementation of agentic EdTech systems.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Team
                EduLens
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
        <p>© 2026 EduLens AI. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Systems Operational</span>
          </div>
          <span>Powered by Groq & Llama 3.1</span>
        </div>
      </div>
    </footer>
  );
}
