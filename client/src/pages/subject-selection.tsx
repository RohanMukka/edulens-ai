import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MasteryScore, Concept, Classroom } from "@shared/schema";
import {
  Brain,
  Dna,
  Calculator,
  Landmark,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Plus,
  Sparkles,
  GraduationCap,
  LogOut,
  Users,
  Code,
  Atom,
  FlaskConical,
  TrendingUp,
  Clock,
} from "lucide-react";
import { SubjectSkeleton } from "@/components/ui/skeleton-screen";
import { useToast } from "@/hooks/use-toast";

const subjects = [
  {
    name: "Biology",
    icon: Dna,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    desc: "Cells, photosynthesis, genetics, and evolution",
  },
  {
    name: "Math",
    icon: Calculator,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    desc: "Variables, equations, functions, and graphing",
  },
  {
    name: "History",
    icon: Landmark,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    desc: "Ancient civilizations through Industrial Revolution",
  },
  {
    name: "Computer Science",
    icon: Code,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/10",
    desc: "Variables, algorithms, data structures, and Big O",
  },
  {
    name: "Physics",
    icon: Atom,
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10",
    desc: "Motion, forces, energy, waves, and circuits",
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/10",
    desc: "Atoms, bonding, reactions, and acid-base chemistry",
  },
  {
    name: "Economics",
    icon: TrendingUp,
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-500/10",
    desc: "Supply & demand, GDP, inflation, and trade",
  },
];

export default function SubjectSelection() {
  const [, setLocation] = useLocation();
  const { student, logout } = useAuth();
  const [newTopic, setNewTopic] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    enabled: !!student,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/classrooms");
      return res.json();
    },
  });

  const { data: mastery } = useQuery<MasteryScore[]>({
    queryKey: ["/api/students", student?.id, "mastery"],
    enabled: !!student,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/students/${student!.id}/mastery`,
      );
      return res.json();
    },
  });

  if (!student) {
    setLocation("/");
    return null;
  }

  if (mastery === undefined) {
    return <SubjectSkeleton />;
  }

  const startSession = async (subject: string) => {
    try {
      const preferredCode = localStorage.getItem("edulens.activeClassroomCode");
      if (!preferredCode && classrooms && classrooms.length > 0) {
        localStorage.setItem("edulens.activeClassroomCode", classrooms[0].code);
      }
      const res = await apiRequest("POST", "/api/sessions", {
        studentId: student.id,
        subject,
      });
      const session = await res.json();
      setLocation(`/learn/${session.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateConcept = async () => {
    if (!newTopic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/concepts/generate", {
        subject: "Custom",
        topic: newTopic,
      });
      const concept = await res.json();
      toast({
        title: "Concept Generated",
        description: `Successfully generated learning module for "${newTopic}".`,
      });
      startSession(concept.subject);
    } catch (e: any) {
      toast({
        title: "Generation Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const normalizedCode = joinCode.trim().toUpperCase();
      await apiRequest("POST", "/api/classrooms/join", {
        code: normalizedCode,
      });
      localStorage.setItem("edulens.activeClassroomCode", normalizedCode);
      setJoinCode("");
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
      toast({
        title: "Joined Classroom",
        description: "You have successfully joined the classroom.",
      });
    } catch (e: any) {
      toast({
        title: "Join Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getMasteryForSubject = (subjectName: string) => {
    if (!mastery) return null;
    // We'd need concepts to map, so just show total mastery count
    return mastery.length > 0 ? mastery : null;
  };

  // Surface SM-2 spaced repetition: count concepts due for review
  const now = new Date().toISOString();
  const reviewDueConcepts = (mastery || []).filter(
    (m) => m.nextReviewAt && m.nextReviewAt <= now && m.score > 0,
  );
  const reviewDueCount = reviewDueConcepts.length;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 premium-gradient overflow-hidden">
      {/* ── BACKGROUND ELEMENTS ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── PREMIUM NAV ── */}
      <nav className="nav-glass relative z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-black text-2xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
              EduLens <span className="text-primary">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-muted-foreground">Session Active</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              className="w-10 h-10 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* ── HEADER ── */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1 mb-4 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Student Hub
              </div>
              <h1 className="text-5xl font-black tracking-tight font-display">
                What will you <span className="text-primary">master</span> today?
              </h1>
              <p className="text-muted-foreground text-lg mt-3 font-medium">
                Welcome back, <span className="text-foreground font-bold">{student.name}</span>. Your adaptive learning path is ready.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/graph")}
                className="h-14 px-8 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all font-bold group"
              >
                <BookOpen className="w-5 h-5 mr-3 text-primary group-hover:scale-110 transition-transform" /> 
                Knowledge Graph
              </Button>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="h-14 px-8 rounded-2xl bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-black"
              >
                My Dashboard
              </Button>
            </div>
          </motion.div>
        </header>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* ── LEFT COL: SUBJECTS ── */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-display">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              Available Disciplines
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {subjects.map((subject, idx) => (
                <motion.div
                  key={subject.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className="premium-card cursor-pointer group h-full bg-white/[0.01] hover:bg-white/[0.03] border-white/5 hover:border-primary/30 transition-all duration-500"
                    onClick={() => startSession(subject.name)}
                  >
                    <CardContent className="p-8">
                      <div className={`w-14 h-14 rounded-2xl ${subject.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                        <subject.icon className={`w-7 h-7 ${subject.color.split(" ").slice(1).join(" ")}`} />
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-bold font-display group-hover:text-primary transition-colors leading-none">
                            {subject.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                          {subject.desc}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                        <Badge variant="secondary" className="bg-primary/5 text-primary/70 border-primary/10 text-[10px] font-black tracking-widest uppercase">
                          Adaptive Modules
                        </Badge>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COL: ACTIONS & STATS ── */}
          <div className="space-y-8">
            {/* Review Card */}
            {reviewDueCount > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="rounded-[2.5rem] border-amber-500/20 bg-amber-500/5 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
                      </div>
                      <h3 className="font-display font-black text-xl text-amber-500">Practice Due</h3>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground mb-8 leading-relaxed">
                      Your memory of <span className="text-foreground">{reviewDueCount} concepts</span> is fading. Practice now to ensure long-term mastery.
                    </p>
                    <Button className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-lg shadow-amber-500/20">
                      Start Review Session
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Dynamic Generation */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-display">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                AI Generator
              </h2>
              <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                <CardContent className="p-8">
                  <p className="text-sm font-bold text-muted-foreground mb-6 leading-relaxed">
                    Type any topic to generate a custom AI-powered learning session.
                  </p>
                  <div className="space-y-4">
                    <Input
                      placeholder="e.g., Quantum Computing"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="h-14 rounded-2xl bg-white/5 border-white/5 focus:bg-white/10 transition-all font-bold px-6"
                    />
                    <Button
                      onClick={handleGenerateConcept}
                      disabled={isGenerating || !newTopic.trim()}
                      className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-black border border-white/10"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Generate Concept"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Classroom */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-display">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                Classroom
              </h2>
              <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="flex gap-3">
                    <Input
                      placeholder="6-CHAR CODE"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="h-14 rounded-2xl bg-white/5 border-white/5 text-center font-mono font-black tracking-widest px-6"
                    />
                    <Button
                      onClick={handleJoinClassroom}
                      disabled={isJoining || joinCode.length !== 6}
                      className="h-14 w-14 rounded-2xl bg-primary p-0 shadow-lg shadow-primary/20"
                    >
                      {isJoining ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-6 h-6" />
                      )}
                    </Button>
                  </div>
                  
                  {classrooms && classrooms.length > 0 && (
                    <div className="mt-8 space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Active Classrooms</p>
                      {classrooms.map((c) => (
                        <div key={c.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                          <span className="text-sm font-bold">{c.name}</span>
                          <Badge className="bg-primary/10 text-primary border-none font-mono">{c.code}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
