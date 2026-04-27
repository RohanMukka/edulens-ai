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
import { Dna, Calculator, Landmark, ArrowLeft, ChevronRight, BookOpen, Loader2, Plus, Sparkles, GraduationCap, LogOut, Users, Code, Atom, FlaskConical, TrendingUp, Clock } from "lucide-react";
import { SubjectSkeleton } from "@/components/ui/skeleton-screen";

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
      const res = await apiRequest("GET", `/api/students/${student!.id}/mastery`);
      return res.json();
    },
  });

  if (mastery === undefined) {
    return <SubjectSkeleton />;
  }

  if (!student) {
    setLocation("/");
    return null;
  }

  const startSession = async (subject: string) => {
    try {
      const res = await apiRequest("POST", "/api/sessions", { studentId: student.id, subject });
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
      const res = await apiRequest("POST", "/api/concepts/generate", { subject: "Custom", topic: newTopic });
      const concept = await res.json();
      startSession(concept.subject);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      await apiRequest("POST", "/api/classrooms/join", { code: joinCode });
      setJoinCode("");
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
    } catch (e) {
      console.error(e);
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
    m => m.nextReviewAt && m.nextReviewAt <= now && m.score > 0
  );
  const reviewDueCount = reviewDueConcepts.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-bold">Choose a Subject</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Hi {student.name}! Pick a subject to start your learning session.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/graph")} data-testid="button-knowledge-graph">
              <BookOpen className="w-4 h-4 mr-1" /> Knowledge Graph
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-dashboard">
              Dashboard
            </Button>
          </div>
        </div>

        {classrooms && classrooms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> My Classrooms
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {classrooms.map(c => (
                <Card key={c.id} className="border border-border/60">
                  <CardContent className="py-4 px-5">
                    <h3 className="font-bold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Code: {c.code}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── SPACED REPETITION REVIEW DUE ── */}
        {reviewDueCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/5">
              <CardContent className="py-4 px-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400">Spaced Repetition Review</h3>
                  <p className="text-xs text-muted-foreground">You have <strong className="text-foreground">{reviewDueCount}</strong> concept{reviewDueCount !== 1 ? 's' : ''} due for review. Practice now to strengthen your memory!</p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-black shrink-0">
                  {reviewDueCount} Due
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid gap-4">
          {subjects.map((subject, idx) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className="glass-card border border-border/40 hover:border-primary/40 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5"
                onClick={() => startSession(subject.name)}
                data-testid={`card-subject-${subject.name.toLowerCase()}`}
              >
                <CardContent className="py-6 px-6 flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${subject.iconBg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                    <subject.icon className={`w-7 h-7 ${subject.color.split(" ").slice(1).join(" ")}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{subject.name}</h3>
                      <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-primary/5 text-primary/70 border-primary/10">5 Concepts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{subject.desc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
            Dynamic Knowledge Expansion
          </h2>
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="py-5 px-5">
              <p className="text-sm text-muted-foreground mb-4">
                Want to learn something not on the list? Type any topic below, and our AI will generate a custom learning concept for you on the fly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  placeholder="e.g., Quantum Physics, Black Holes, AI..." 
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="flex-1 bg-background"
                />
                <Button onClick={handleGenerateConcept} disabled={isGenerating || !newTopic.trim()}>
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Generate & Learn</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Join Classroom
            </h2>
            <Card className="border border-border/60 bg-muted/20 h-full">
              <CardContent className="py-5 px-5 flex flex-col justify-center h-full">
                <p className="text-sm text-muted-foreground mb-4">
                  Have a code from your teacher? Join their classroom here.
                </p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter 6-char code" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono text-center uppercase bg-background"
                  />
                  <Button 
                    onClick={handleJoinClassroom} 
                    disabled={isJoining || joinCode.length !== 6}
                    className="shrink-0"
                  >
                    {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
