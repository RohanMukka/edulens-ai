import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Target, ArrowRight, Check } from "lucide-react";

interface TutorialOverlayProps {
  role: "student" | "educator";
}

export function TutorialOverlay({ role }: TutorialOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if the user has already seen the tutorial
    const hasSeen = localStorage.getItem(`edulens.tutorial.${role}`);
    if (!hasSeen) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const handleClose = () => {
    localStorage.setItem(`edulens.tutorial.${role}`, "true");
    setIsOpen(false);
  };

  const studentSteps = [
    {
      title: "Welcome to EduLens AI! 🚀",
      description: "Get ready to learn smarter, not harder. This AI-powered platform adapts exactly to how you learn best.",
      icon: <Sparkles className="w-12 h-12 text-violet-500" />
    },
    {
      title: "The Knowledge Graph",
      description: "Instead of linear lists, explore your subjects through the Knowledge Graph! See how concepts connect and unlock new paths as you master the basics.",
      icon: <Brain className="w-12 h-12 text-blue-500" />
    },
    {
      title: "Socratic AI Tutor",
      description: "Stuck? Our AI won't just give you the answer. It will act like a personal tutor, asking you guiding questions to help you reach the 'Aha!' moment yourself.",
      icon: <Target className="w-12 h-12 text-emerald-500" />
    }
  ];

  const educatorSteps = [
    {
      title: "Welcome, Educator! 🎓",
      description: "EduLens is designed to automate grading and help you instantly identify which students are struggling with which concepts.",
      icon: <Sparkles className="w-12 h-12 text-violet-500" />
    },
    {
      title: "Assign Magic ✨",
      description: "Use our AI Co-Pilot to generate entire assignments, questions, and rubrics in seconds just by typing what you want to teach.",
      icon: <Brain className="w-12 h-12 text-blue-500" />
    },
    {
      title: "SpeedGrader",
      description: "Say goodbye to weekend grading. The AI pre-grades all student submissions based on your rubric, so you just review, approve, and move on!",
      icon: <Target className="w-12 h-12 text-emerald-500" />
    }
  ];

  const steps = role === "student" ? studentSteps : educatorSteps;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden relative"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: `${((step) / steps.length) * 100}%` }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-8 pb-6 flex flex-col items-center text-center">
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6"
            >
              {steps[step].icon}
            </motion.div>
            
            <motion.h3 
              key={`title-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-3"
            >
              {steps[step].title}
            </motion.h3>

            <motion.p 
              key={`desc-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground leading-relaxed mb-8"
            >
              {steps[step].description}
            </motion.p>

            <div className="flex gap-3 w-full">
              {step > 0 && (
                <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleClose}>
                  Get Started <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="px-8 pb-4 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary scale-125" : "bg-primary/20"}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
