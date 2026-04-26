import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MasteryScore, Concept, Classroom } from "@shared/schema";
import { Dna, Calculator, Landmark, ArrowLeft, ChevronRight, BookOpen, Loader2, Plus, Sparkles, GraduationCap, LogOut, Users, Code, Atom, FlaskConical, TrendingUp } from "lucide-react";

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
            <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/"); }} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
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

        <div className="grid gap-4">
          {subjects.map((subject) => (
            <Card
              key={subject.name}
              className="border border-border/60 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => startSession(subject.name)}
              data-testid={`card-subject-${subject.name.toLowerCase()}`}
            >
              <CardContent className="py-5 px-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${subject.iconBg} flex items-center justify-center shrink-0`}>
                  <subject.icon className={`w-6 h-6 ${subject.color.split(" ").slice(1).join(" ")}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold">{subject.name}</h3>
                    <Badge variant="secondary" className="text-xs">5 concepts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{subject.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
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
