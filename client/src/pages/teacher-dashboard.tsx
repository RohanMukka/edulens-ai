import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, GraduationCap, Activity, LogOut, Plus, Copy,
  ArrowLeft, Loader2, CheckCircle2, BookOpen, TrendingUp, CheckCheck, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { classroomSocket } from "@/lib/socket";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

type StudentStat = {
  id: number;
  name: string;
  email: string;
  totalInteractions: number;
  avgScore: number;
  masteryCount: number;
};

const BLOOMS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  REMEMBERING: { label: "Remembering", color: "text-rose-500", bg: "bg-rose-500/10" },
  UNDERSTANDING: { label: "Understanding", color: "text-amber-500", bg: "bg-amber-500/10" },
  APPLYING: { label: "Applying", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ANALYZING: { label: "Analyzing", color: "text-blue-500", bg: "bg-blue-500/10" },
  EVALUATING: { label: "Evaluating", color: "text-violet-500", bg: "bg-violet-500/10" },
  CREATING: { label: "Creating", color: "text-cyan-500", bg: "bg-cyan-500/10" },
};

type Classroom = {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  createdAt: string;
};

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    : score >= 0.4
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {pct}%
    </span>
  );
}

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { student, logout } = useAuth();
  const qc = useQueryClient();
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeLiveRoom, setActiveLiveRoom] = useState<Classroom | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (activeLiveRoom && student) {
      classroomSocket.connect(activeLiveRoom.code, student.id, "teacher");
      const removeListener = classroomSocket.addListener((msg) => {
        if (msg.type === "live_update") {
          setLiveUpdates(prev => [msg, ...prev].slice(0, 10));
        }
      });
      return () => {
        removeListener();
        classroomSocket.disconnect();
      };
    }
  }, [activeLiveRoom, student]);

  const { data: classrooms, isLoading: classroomsLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    queryFn: async () => (await apiRequest("GET", "/api/classrooms")).json(),
  });

  const { data: students, isLoading } = useQuery<StudentStat[]>({
    queryKey: ["/api/teacher/students"],
    queryFn: async () => (await apiRequest("GET", "/api/teacher/students")).json(),
  });

  const handleCreateClassroom = async () => {
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      await apiRequest("POST", "/api/classrooms", { name: newClassName });
      setNewClassName("");
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
      qc.invalidateQueries({ queryKey: ["/api/teacher/students"] });
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading || classroomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const avgClassScore = students && students.length > 0
    ? students.reduce((acc, s) => acc + s.avgScore, 0) / students.length
    : 0;
  const totalInteractions = students?.reduce((acc, s) => acc + s.totalInteractions, 0) || 0;
  const totalMastered = students?.reduce((acc, s) => acc + s.masteryCount, 0) || 0;

  // Chart data — top 8 students by avg score
  const chartData = (students || [])
    .slice()
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8)
    .map(s => ({
      name: s.name.split(" ")[0],
      score: Math.round(s.avgScore * 100),
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Home
            </Button>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              Educator Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back{student?.name ? `, ${student.name}` : ""}. Here's how your students are doing.
            </p>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => { logout(); setLocation("/"); }}
            className="text-muted-foreground self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
          </Button>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Enrolled Students", value: students?.length || 0,   icon: Users,          color: "text-primary",       bg: "bg-primary/10" },
            { label: "Class Avg Score",   value: `${Math.round(avgClassScore * 100)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "AI Interactions",   value: totalInteractions,        icon: Activity,       color: "text-blue-600",      bg: "bg-blue-500/10" },
            { label: "Concepts Mastered", value: totalMastered,            icon: CheckCheck,     color: "text-violet-600",    bg: "bg-violet-500/10" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card border border-border/40 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <CardContent className="pt-5 pb-4">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* ── CLASSROOMS ── */}
          <div className="lg:col-span-1">
            <Card className="glass-card border border-border/40 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">My Classrooms</CardTitle>
                <CardDescription>Share the code with your students</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Bio 101 – Fall 2026"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateClassroom()}
                    className="text-sm bg-background/50"
                  />
                  <Button size="sm" onClick={handleCreateClassroom} disabled={creating || !newClassName.trim()} className="shadow-lg shadow-primary/20">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>

                {classrooms && classrooms.length > 0 ? (
                  <div className="space-y-3">
                    {classrooms.map((c) => (
                      <div key={c.id} className="p-4 border border-border/40 rounded-2xl bg-muted/20 backdrop-blur-sm group hover:border-primary/30 transition-all">
                        <p className="font-bold text-sm mb-3 truncate group-hover:text-primary transition-colors">{c.name}</p>
                        <div className="flex items-center justify-between bg-background/60 rounded-xl px-3 py-2 border border-border/30">
                          <code className="text-xl font-black tracking-[0.3em] text-primary">{c.code}</code>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-xs gap-1.5 font-bold hover:bg-primary/10 transition-all"
                              onClick={() => handleCopy(c.code)}
                            >
                              {copied === c.code ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 text-xs gap-1.5 border-primary/40 hover:bg-primary hover:text-primary-foreground font-bold shadow-sm transition-all relative overflow-hidden group/btn"
                              onClick={() => {
                                setLiveUpdates([]);
                                setActiveLiveRoom(c);
                              }}
                            >
                              <div className="absolute inset-0 bg-primary/10 animate-pulse group-hover/btn:hidden" />
                              <Activity className="w-4 h-4 relative z-10" />
                              <span className="relative z-10">Go Live</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No classrooms yet.<br />Create one above to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── CLASS PERFORMANCE CHART ── */}
          <div className="lg:col-span-2">
            <Card className="border border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Student Score Overview
                </CardTitle>
                <CardDescription>Average score per enrolled student</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(240 6% 20%)", background: "hsl(240 10% 10%)" }}
                        formatter={(v: number) => [`${v}%`, "Avg Score"]}
                      />
                      <Bar
                        dataKey="score"
                        fill="hsl(239 84% 67%)"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[220px] gap-3">
                    <Users className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground text-center">
                      No students enrolled yet.<br />Create a classroom and share the code!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── STUDENT ROSTER TABLE ── */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Student Roster
            </CardTitle>
            <CardDescription>Detailed performance breakdown for all enrolled students</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Email</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responses</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mastered</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {students && students.length > 0 ? students.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {s.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{s.email}</td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant="secondary" className="text-xs">{s.totalInteractions}</Badge>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                          {s.masteryCount}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <Progress
                            value={s.avgScore * 100}
                            className="h-2 flex-1 max-w-[80px]"
                          />
                          <ScorePill score={s.avgScore} />
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-10 h-10 text-muted-foreground/30" />
                          <p className="text-muted-foreground text-sm">No students enrolled yet.</p>
                          <p className="text-xs text-muted-foreground">Create a classroom above and share the join code with your students.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── LIVE SESSION OVERLAY ── */}
      {activeLiveRoom && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 md:p-8 overflow-y-auto animate-in fade-in zoom-in duration-200">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Live Classroom Session</h2>
                  <p className="text-sm text-muted-foreground">Class: <span className="font-semibold text-foreground">{activeLiveRoom.name}</span> • Code: <span className="font-mono text-primary font-bold">{activeLiveRoom.code}</span></p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveLiveRoom(null)} className="gap-2">
                <LogOut className="w-4 h-4" /> End Live View
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Live Activity Feed */}
              <div className="md:col-span-2 space-y-4">
                <Card className="border-primary/20 shadow-lg shadow-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" /> Live Student Responses
                    </CardTitle>
                    <CardDescription>Streaming student answers as they arrive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {liveUpdates.length > 0 ? (
                      <div className="space-y-4">
                        {liveUpdates.map((update, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-4 rounded-xl border transition-all duration-500 ${
                              update.isSocraticActive 
                                ? "border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)] animate-pulse" 
                                : "border-border/50 bg-muted/20"
                            } flex flex-col gap-2`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {update.name.charAt(0)}
                                </div>
                                <span className="font-bold text-sm whitespace-nowrap">{update.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">just answered</span>
                                <Badge variant="outline" className="text-[10px] py-0 shrink-0">{update.concept}</Badge>
                                {update.bloomLevel && (
                                  <Badge className={`text-[10px] py-0 border-none shrink-0 ${BLOOMS_MAP[update.bloomLevel.trim().toUpperCase()]?.bg} ${BLOOMS_MAP[update.bloomLevel.trim().toUpperCase()]?.color}`}>
                                    {BLOOMS_MAP[update.bloomLevel.trim().toUpperCase()]?.label}
                                  </Badge>
                                )}
                                {update.isSocraticActive && (
                                  <Badge className="bg-red-500 text-white text-[10px] py-0 px-1.5 animate-bounce">
                                    INTERVENTION
                                  </Badge>
                                )}
                              </div>
                              <ScorePill score={update.score} />
                            </div>
                            <p className="text-sm italic text-muted-foreground line-clamp-2">
                              {update.isSocraticActive ? `“${update.socraticMessage || 'Starting Socratic review...'}”` : `“${update.feedback}”`}
                            </p>
                            {update.misconception && update.misconception !== "NO_MISCONCEPTION" && (
                              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                <AlertTriangle className="w-3 h-3" />
                                Misconception: {update.misconception.replace(/_/g, " ")}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 animate-spin" />
                        <p className="text-sm text-muted-foreground">Waiting for students to join and respond...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Instructions/Status */}
              <div className="space-y-4">
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">Session Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Instructions</p>
                      <p className="text-sm leading-relaxed">Students joined to <span className="font-bold">{activeLiveRoom.name}</span> will automatically stream their responses to this view. Stay on this page to monitor comprehension in real-time.</p>
                    </div>
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Connection Status</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px]">
                          Live Connected
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
