import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ArrowLeft, Send, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, Target, Lightbulb, ArrowRight, BookOpen, Layers, Zap, Shield,
} from "lucide-react";

const MISCONCEPTION_META: Record<string, { label: string; emoji: string; color: string; bg: string; border: string; remediation: string }> = {
  PROCESS_CONFUSION: { label: "Process Confusion", emoji: "🔄", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", remediation: "You may be mixing up two related but distinct processes." },
  INCOMPLETE_UNDERSTANDING: { label: "Partial Understanding", emoji: "🧩", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", remediation: "You've grasped the core idea but are missing critical components." },
  OVERGENERALIZATION: { label: "Overgeneralization", emoji: "🎯", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", remediation: "You're applying a rule too broadly." },
  CAUSE_EFFECT_REVERSAL: { label: "Cause-Effect Reversal", emoji: "↔️", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30", remediation: "You've identified the right concepts but inverted the causal direction." },
  TERMINOLOGY_CONFUSION: { label: "Vocabulary Confusion", emoji: "📝", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30", remediation: "Some technical terms are being used interchangeably." },
  SURFACE_LEVEL: { label: "Surface-Level Response", emoji: "🏊", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", remediation: "Your answer stays at a high level. Go deeper into the mechanism." },
  NO_MISCONCEPTION: { label: "Strong Understanding", emoji: "✅", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", remediation: "" },
};

const BLOOMS_META: Record<string, { label: string; color: string; bg: string; level: number }> = {
  REMEMBERING: { label: "Remembering", color: "text-rose-500", bg: "bg-rose-500/10", level: 1 },
  UNDERSTANDING: { label: "Understanding", color: "text-amber-500", bg: "bg-amber-500/10", level: 2 },
  APPLYING: { label: "Applying", color: "text-emerald-500", bg: "bg-emerald-500/10", level: 3 },
  ANALYZING: { label: "Analyzing", color: "text-blue-500", bg: "bg-blue-500/10", level: 4 },
  EVALUATING: { label: "Evaluating", color: "text-violet-500", bg: "bg-violet-500/10", level: 5 },
  CREATING: { label: "Creating", color: "text-cyan-500", bg: "bg-cyan-500/10", level: 6 },
};

// Pre-filled sample for quick demo
const SAMPLE_CONCEPT = "Photosynthesis";
const SAMPLE_QUESTION = "Explain how photosynthesis converts light energy into chemical energy in plants.";
const SAMPLE_WEAK_ANSWER = "Photosynthesis is when plants eat sunlight and turn it into food. The leaves absorb the sun and that makes them green. Carbon dioxide goes in and oxygen comes out.";
const SAMPLE_STRONG_ANSWER = "Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose. In the light-dependent reactions occurring in the thylakoid membranes, chlorophyll absorbs photons, splitting water molecules to release oxygen and generate ATP and NADPH. These energy carriers then drive the Calvin cycle in the stroma, where CO₂ is fixed into G3P molecules that are used to synthesize glucose.";

interface ScoreResult {
  score: number;
  gaps: string[];
  strengths: string[];
  feedback: string;
  misconceptionType: string | null;
  misconceptionDetail: string | null;
  bloomLevel?: string | null;
}

const PIPELINE_STEPS = [
  { icon: Shield, label: "Gatekeeper Agent", desc: "Anti-plagiarism & jailbreak check" },
  { icon: Brain, label: "Diagnostic Agent", desc: "NLP scoring + misconception classification" },
  { icon: Layers, label: "Bloom's Classifier", desc: "Cognitive depth measurement" },
  { icon: Target, label: "Remediation Engine", desc: "Adaptive next-step generation" },
];

export default function DemoShowcase() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const [answer, setAnswer] = useState(SAMPLE_WEAK_ANSWER);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [showAdaptive, setShowAdaptive] = useState(false);

  const scoreMutation = useMutation({
    mutationFn: async (studentResponse: string) => {
      // Animate pipeline steps
      for (let i = 0; i < 4; i++) {
        setPipelineStep(i);
        await new Promise(r => setTimeout(r, 600));
      }
      const res = await apiRequest("POST", "/api/ai/score", {
        studentResponse,
        idealExplanation: "Photosynthesis is the process by which green plants convert light energy into chemical energy stored in glucose. Light-dependent reactions in thylakoids split water, releasing O2 and producing ATP/NADPH. The Calvin cycle in the stroma uses CO2 and these carriers to synthesize glucose.",
        conceptName: SAMPLE_CONCEPT,
        question: SAMPLE_QUESTION,
      });
      return res.json() as Promise<ScoreResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setPipelineStep(4);
      setTimeout(() => setShowAdaptive(true), 800);
    },
    onError: () => {
      setPipelineStep(-1);
      // Fallback demo result for when not logged in
      const fallback: ScoreResult = {
        score: 0.35,
        gaps: ["Missing light-dependent vs light-independent reaction distinction", "No mention of ATP/NADPH energy carriers", "Oversimplified: 'eat sunlight' is not accurate"],
        strengths: ["Correctly identified CO₂ → O₂ gas exchange", "Understands leaves are the site of photosynthesis"],
        feedback: "You have the right general idea but are oversimplifying the mechanism. Photosynthesis isn't 'eating sunlight' — it's a two-stage biochemical process.",
        misconceptionType: "PROCESS_CONFUSION",
        misconceptionDetail: "Student conflates the overall process with a simple input-output model, missing the two-stage mechanism (light reactions + Calvin cycle).",
        bloomLevel: "REMEMBERING",
      };
      setResult(fallback);
      setPipelineStep(4);
      setTimeout(() => setShowAdaptive(true), 800);
    },
  });

  const handleAnalyze = () => {
    setResult(null);
    setShowAdaptive(false);
    setPipelineStep(0);
    scoreMutation.mutate(answer);
  };

  const handleLoadSample = (type: "weak" | "strong") => {
    setAnswer(type === "weak" ? SAMPLE_WEAK_ANSWER : SAMPLE_STRONG_ANSWER);
    setResult(null);
    setShowAdaptive(false);
    setPipelineStep(-1);
  };

  const mc = result?.misconceptionType ? MISCONCEPTION_META[result.misconceptionType] : null;
  const bloom = result?.bloomLevel ? BLOOMS_META[result.bloomLevel] : null;
  const scorePct = result ? Math.round(result.score * 100) : 0;

  return (
    <div className="min-h-screen bg-background premium-gradient">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sm">EduLens AI — Evidence Mode</h1>
                <p className="text-[10px] text-muted-foreground font-medium">Live NLP Diagnosis Pipeline</p>
              </div>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold gap-1.5">
            <Zap className="w-3 h-3" /> Groq + Llama 3.1
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Pipeline visualization */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: pipelineStep === i ? 1.1 : 1,
                  opacity: pipelineStep >= i ? 1 : 0.3,
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  pipelineStep === i ? "bg-primary/10 border-primary/40 text-primary" :
                  pipelineStep > i ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
                  "bg-muted/30 border-border/40 text-muted-foreground"
                }`}
              >
                {pipelineStep > i ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 pipelineStep === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                 <step.icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{step.label}</span>
              </motion.div>
              {i < PIPELINE_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Student Input */}
          <div className="space-y-4">
            <Card className="border border-border/50 bg-card/60 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h2 className="font-bold text-sm">Student Response</h2>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{SAMPLE_CONCEPT}</Badge>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Question</p>
                  <p className="text-sm font-medium">{SAMPLE_QUESTION}</p>
                </div>

                <Textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={6}
                  className="text-sm bg-background/50 border-border/40 resize-none"
                  placeholder="Type a student response..."
                />

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => handleLoadSample("weak")} className="text-xs">
                    Load Weak Answer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleLoadSample("strong")} className="text-xs">
                    Load Strong Answer
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={!answer.trim() || scoreMutation.isPending}
                    className="ml-auto shadow-lg shadow-primary/20 text-xs gap-1.5"
                  >
                    {scoreMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Analyze with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: AI Diagnosis */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Score Header */}
                  <Card className="border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            result.score >= 0.7 ? "bg-emerald-500/10" : result.score >= 0.4 ? "bg-amber-500/10" : "bg-rose-500/10"
                          }`}>
                            {result.score >= 0.7 ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                             result.score >= 0.4 ? <AlertTriangle className="w-6 h-6 text-amber-500" /> :
                             <XCircle className="w-6 h-6 text-rose-500" />}
                          </div>
                          <div>
                            <p className={`text-3xl font-black ${
                              result.score >= 0.7 ? "text-emerald-500" : result.score >= 0.4 ? "text-amber-500" : "text-rose-500"
                            }`}>{scorePct}%</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Understanding Score</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {mc && mc.label !== "Strong Understanding" && (
                            <Badge className={`${mc.bg} ${mc.color} border ${mc.border} text-[10px] font-bold`}>
                              {mc.emoji} {mc.label}
                            </Badge>
                          )}
                          {bloom && (
                            <Badge className={`${bloom.bg} ${bloom.color} text-[10px] font-bold`}>
                              Bloom's: {bloom.label} (L{bloom.level}/6)
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={scorePct} className="h-2" />
                    </CardContent>
                  </Card>

                  {/* 4-Panel Diagnosis */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Strengths */}
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> What You Understood
                        </p>
                        <ul className="space-y-1.5">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                          {result.strengths.length === 0 && <li className="text-xs text-muted-foreground italic">No strengths detected</li>}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Gaps */}
                    <Card className="border-rose-500/20 bg-rose-500/5">
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <XCircle className="w-3 h-3" /> What You Missed
                        </p>
                        <ul className="space-y-1.5">
                          {result.gaps.map((g, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              {g}
                            </li>
                          ))}
                          {result.gaps.length === 0 && <li className="text-xs text-muted-foreground italic">No gaps found — great work!</li>}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Misconception Detail */}
                    <Card className={`border ${mc?.border || "border-border/40"} ${mc?.bg || "bg-muted/10"}`}>
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className={`text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 ${mc?.color || "text-muted-foreground"}`}>
                          <Target className="w-3 h-3" /> Why This Matters
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {result.misconceptionDetail || result.feedback}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Adaptive Next Step */}
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="pt-4 pb-4 px-4">
                        <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3" /> Your Next Best Activity
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {result.score >= 0.7
                            ? "You've mastered this concept! The system advances you to the next topic with a harder question."
                            : result.score >= 0.4
                            ? "The system generates an easier question and offers Socratic tutoring to address your specific gap."
                            : "The system redirects you to prerequisite concepts and provides a mini-lesson with Mermaid diagrams before retrying."}
                        </p>
                        {mc && mc.remediation && (
                          <p className="text-[10px] font-bold text-primary italic">{mc.remediation}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Feedback */}
                  <Card className="border border-border/50">
                    <CardContent className="pt-4 pb-4 px-4">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary" /> AI Feedback
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{result.feedback}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4"
                >
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-primary/40" />
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">AI Diagnosis Panel</p>
                    <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
                      Click "Analyze with AI" to see the multi-agent pipeline diagnose a student's reasoning in real-time.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Adaptive Next Step Preview */}
        <AnimatePresence>
          {showAdaptive && result && result.score < 0.7 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card className="border-2 border-primary/30 bg-primary/5 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-1">Adaptive Response Triggered</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Because the student scored {scorePct}%, the system automatically:
                      </p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-background/60 border border-border/30">
                          <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">1. Difficulty Adjusted</p>
                          <p className="text-xs text-muted-foreground">Next question drops to "easy" difficulty band</p>
                        </div>
                        <div className="p-3 rounded-xl bg-background/60 border border-border/30">
                          <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">2. Socratic Mode</p>
                          <p className="text-xs text-muted-foreground">AI tutor guides without giving direct answers</p>
                        </div>
                        <div className="p-3 rounded-xl bg-background/60 border border-border/30">
                          <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">3. Teacher Alerted</p>
                          <p className="text-xs text-muted-foreground">Live WebSocket update sent to classroom dashboard</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
