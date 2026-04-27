import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/ui/skeleton-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from "recharts";
import type { MasteryScore, Concept, Classroom } from "@shared/schema";
import {
  ArrowLeft, BookOpen, Target, TrendingUp, Clock, Loader2, Award,
  AlertTriangle, Dna, Calculator, Landmark, Sparkles, Flame, Trophy,
  Brain, Network, LogOut, ArrowRight, CheckCircle2, Lock, Code, Atom, FlaskConical, Users, Trash2
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface StudentStats {
  totalSessions: number;
  totalInteractions: number;
  avgScore: number;
  conceptsMastered: number;
  totalConcepts: number;
  weakAreas: { conceptId: number; name: string; score: number }[];
  recentSessions: any[];
  recentInteractions: any[];
  classPercentile: number | null;
  currentStreak: number;
}

const BLOOMS_VALUE_MAP: Record<string, number> = {
  'REMEMBERING': 1,
  'UNDERSTANDING': 2,
  'APPLYING': 3,
  'ANALYZING': 4,
  'EVALUATING': 5,
  'CREATING': 6
};

const BLOOMS_LABEL_MAP: Record<number, string> = {
  1: 'REMEMBERING',
  2: 'UNDERSTANDING',
  3: 'APPLYING',
  4: 'ANALYZING',
  5: 'EVALUATING',
  6: 'CREATING'
};

const SUBJECT_META: Record<string, { icon: any; color: string; bg: string; ring: string }> = {
  Biology:            { icon: Dna,           color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", ring: "#10b981" },
  Math:               { icon: Calculator,     color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/10",    ring: "#3b82f6" },
  History:            { icon: Landmark,       color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10",   ring: "#f59e0b" },
  "Computer Science": { icon: Code,           color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", ring: "#8b5cf6" },
  Physics:            { icon: Atom,           color: "text-cyan-600 dark:text-cyan-400",    bg: "bg-cyan-500/10",    ring: "#06b6d4" },
  Chemistry:          { icon: FlaskConical,   color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-500/10",    ring: "#f43f5e" },
  Economics:          { icon: TrendingUp,     color: "text-teal-600 dark:text-teal-400",    bg: "bg-teal-500/10",    ring: "#14b8a6" },
};

// SVG circular progress
function ProgressRing({ pct, size = 120, stroke = 10, color = "#6366f1" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { student, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleLeaveClassroom = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to leave "${name}"?`)) return;
    
    try {
      const res = await apiRequest("DELETE", `/api/classrooms/leave/${id}`);
      if (!res.ok) throw new Error("Failed to leave classroom");
      
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
      
      toast({
        title: "Left Classroom",
        description: `You have unenrolled from "${name}".`,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  if (!student) { setLocation("/"); return null; }

  const { data: stats, isLoading } = useQuery<StudentStats>({
    queryKey: ["/api/students", student.id, "stats"],
    queryFn: async () => (await apiRequest("GET", `/api/students/${student.id}/stats`)).json(),
  });

  const { data: mastery } = useQuery<MasteryScore[]>({
    queryKey: ["/api/students", student.id, "mastery"],
    queryFn: async () => (await apiRequest("GET", `/api/students/${student.id}/mastery`)).json(),
  });

  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    enabled: !!student,
    queryFn: async () => (await apiRequest("GET", "/api/classrooms")).json(),
  });

  const subjects = ["Biology", "Math", "History", "Computer Science", "Physics", "Chemistry", "Economics"];
  const conceptQueries = subjects.map(subject =>
    useQuery<Concept[]>({
      queryKey: ["/api/concepts", subject],
      queryFn: async () => (await apiRequest("GET", `/api/concepts/${subject}`)).json(),
    })
  );
  const allConcepts = conceptQueries.flatMap(q => q.data || []);

  const masteryMap: Record<number, number> = {};
  (mastery || []).forEach(m => { masteryMap[m.conceptId] = m.score; });

  const overallPct = Math.round((stats?.avgScore || 0) * 100);
  const masteredCount = stats?.conceptsMastered || 0;
  const totalCount = stats?.totalConcepts || 0;

  const radarData = subjects.map(subject => {
    const sub = allConcepts.filter(c => c.subject === subject);
    const avg = sub.length ? sub.reduce((s, c) => s + (masteryMap[c.id] || 0), 0) / sub.length : 0;
    return { subject, mastery: Math.round(avg * 100) };
  });

  const barData = allConcepts
    .filter(c => masteryMap[c.id] > 0)
    .map(c => ({
      name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
      mastery: Math.round(masteryMap[c.id] * 100),
      subject: c.subject,
    }));

  // Subject-level breakdown
  const subjectBreakdown = subjects.map(subject => {
    const sub = allConcepts.filter(c => c.subject === subject);
    const mastered = sub.filter(c => (masteryMap[c.id] || 0) >= 0.7).length;
    const avg = sub.length ? sub.reduce((s, c) => s + (masteryMap[c.id] || 0), 0) / sub.length : 0;
    return { subject, mastered, total: sub.length, avg, meta: SUBJECT_META[subject] };
  });

  // Badges
  const allBadgeDefs = [
    { name: "First Steps",        desc: "Mastered your first concept",  icon: Target,    color: "text-blue-500",    bg: "bg-blue-500/10",    earned: masteredCount >= 1 },
    { name: "Consistent Learner", desc: "Answered 5+ questions",        icon: Flame,     color: "text-orange-500",  bg: "bg-orange-500/10",  earned: (stats?.totalInteractions || 0) >= 5 },
    { name: "Darwin's Heir",      desc: "Mastered a Biology concept",   icon: Dna,       color: "text-emerald-500", bg: "bg-emerald-500/10", earned: barData.some(d => d.subject === "Biology" && d.mastery >= 70) },
    { name: "Euler's Protégé",    desc: "Mastered a Math concept",      icon: Calculator, color: "text-rose-500",   bg: "bg-rose-500/10",    earned: barData.some(d => d.subject === "Math" && d.mastery >= 70) },
    { name: "Knowledge Pioneer",  desc: "Generated a custom topic",     icon: Sparkles,  color: "text-purple-500",  bg: "bg-purple-500/10",  earned: barData.some(d => !["Biology","Math","History"].includes(d.subject)) },
    { name: "Scholar",            desc: "Mastered 5+ concepts",         icon: Trophy,    color: "text-amber-500",   bg: "bg-amber-500/10",   earned: masteredCount >= 5 },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasActivity = (stats?.totalInteractions || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/subjects")} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <Button variant="outline" size="sm" onClick={() => setLocation("/graph")} className="shrink-0">
              <Network className="w-4 h-4 mr-1.5" /> Graph
            </Button>
            <Button size="sm" onClick={() => setLocation("/subjects")} className="shrink-0">
              <BookOpen className="w-4 h-4 mr-1.5" /> Continue Learning
            </Button>
          </div>
        </div>

        {/* ── HERO BANNER ── */}
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-violet-500/5 p-8 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">

            {/* Progress ring */}
            <div className="relative shrink-0">
              <ProgressRing pct={overallPct} size={130} stroke={10} color="hsl(239 84% 67%)" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{overallPct}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Score</span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium mb-1">Welcome back,</p>
              <h1 className="text-4xl font-extrabold tracking-tight mb-3">{student.name}</h1>
              <div className="flex flex-wrap gap-3">
                {stats?.currentStreak ? (
                  <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400 font-bold animate-pulse">
                    <Flame className="w-4 h-4 fill-orange-500" />
                    <span>{stats.currentStreak} Day Streak</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded-full px-3 py-1.5 text-sm">
                  <Award className="w-4 h-4 text-primary" />
                  <span><strong>{masteredCount}</strong> / {totalCount} concepts mastered</span>
                </div>
                <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded-full px-3 py-1.5 text-sm">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span><strong>{stats?.totalSessions || 0}</strong> sessions</span>
                </div>
                <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded-full px-3 py-1.5 text-sm">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span><strong>{stats?.totalInteractions || 0}</strong> responses</span>
                </div>
                {stats?.classPercentile !== null && stats?.classPercentile !== undefined && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5 text-sm text-primary font-semibold animate-in fade-in slide-in-from-left-2 duration-700">
                    <Trophy className="w-4 h-4" />
                    <span>
                      {stats.classPercentile >= 95 ? "Class Leader" : 
                       stats.classPercentile >= 90 ? "Top 10% of class" :
                       stats.classPercentile >= 75 ? "Top 25% of class" :
                       `Top ${100 - stats.classPercentile}% of class`}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── SUBJECT BREAKDOWN ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {subjectBreakdown.map(({ subject, mastered, total, avg, meta }) => {
            const Icon = meta.icon;
            const pct = Math.round(avg * 100);
            return (
              <Card key={subject} className="border border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold">{subject}</h3>
                      <p className="text-xs text-muted-foreground">{mastered}/{total} mastered</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-2xl font-black" style={{ color: meta.ring }}>{pct}%</span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── CHARTS ── */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <Card className="border border-border/50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> Subject Mastery Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {radarData.some(d => d.mastery > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(240 6% 20%)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="mastery" stroke="hsl(239 84% 67%)" fill="hsl(239 84% 67%)" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] gap-3">
                  <Brain className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground text-center">Complete some concepts to see your radar chart.</p>
                  <Button size="sm" variant="outline" onClick={() => setLocation("/subjects")}>
                    Start Learning <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Concept Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(240 6% 20%)", background: "hsl(240 10% 10%)" }}
                      formatter={(v: number) => [`${v}%`, "Mastery"]}
                    />
                    <Bar dataKey="mastery" fill="hsl(239 84% 67%)" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] gap-3">
                  <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground text-center">No data yet. Answer some questions to track progress!</p>
                  <Button size="sm" variant="outline" onClick={() => setLocation("/subjects")}>
                    Start Learning <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── COGNITIVE GROWTH ── */}
        <Card className="border border-border/50 mb-8 overflow-hidden group">
          <CardHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" /> Cognitive Growth Tracker
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Visualization of your depth of understanding over time (Bloom's Taxonomy).</p>
              </div>
              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest px-2">Live Diagnostics</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-6 px-6 pt-2">
            {stats?.recentInteractions && stats.recentInteractions.length > 0 ? (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={(stats.recentInteractions).map((i, idx) => ({
                      index: idx + 1,
                      level: BLOOMS_VALUE_MAP[i.bloomsLevel?.trim().toUpperCase() || 'UNDERSTANDING'] || 2,
                      label: i.bloomsLevel || 'Understanding'
                    }))}
                    margin={{ left: 35, right: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.3)" vertical={false} />
                    <XAxis 
                      dataKey="index" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      label={{ value: 'Response History (Last 20)', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[1, 6]}
                      ticks={[1, 2, 3, 4, 5, 6]}
                      tickFormatter={(val) => BLOOMS_LABEL_MAP[val]?.charAt(0) + BLOOMS_LABEL_MAP[val]?.slice(1).toLowerCase()}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover/90 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl text-xs ring-1 ring-primary/20">
                              <p className="font-black text-primary uppercase tracking-tighter mb-1">{payload[0].payload.label}</p>
                              <p className="text-muted-foreground text-[10px]">Interaction #{payload[0].payload.index}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="level" 
                      stroke="hsl(239 84% 67%)" 
                      strokeWidth={3} 
                      dot={{ fill: 'hsl(239 84% 67%)', r: 4, strokeWidth: 2, stroke: 'white' }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] gap-3">
                <Brain className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground text-center">Answer questions to visualize your cognitive progression.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {/* ── WEAK AREAS ── */}
          <Card className="border border-border/50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              {stats?.weakAreas && stats.weakAreas.length > 0 ? (
                <div className="space-y-4">
                  {stats.weakAreas.map(area => (
                    <div key={area.conceptId} data-testid={`weak-area-${area.conceptId}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{area.name}</span>
                        <span className="text-xs font-bold text-amber-500">{Math.round(area.score * 100)}%</span>
                      </div>
                      <Progress value={area.score * 100} className="h-2" />
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setLocation("/subjects")}>
                    Practice These <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
                  <p className="text-sm text-muted-foreground text-center">
                    {hasActivity ? "No weak areas detected — great work! 🎉" : "Complete some concepts to see where you need improvement."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── RECENT SESSIONS ── */}
          <Card className="border border-border/50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              {stats?.recentSessions && stats.recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentSessions.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors" data-testid={`session-${s.id}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${s.endedAt ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <Badge variant="secondary" className="text-xs">{s.subject}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(s.startedAt).toLocaleDateString()}</span>
                      </div>
                      {s.endedAt ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs border-0">Completed</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs border-0">In Progress</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Clock className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No sessions yet. Start your first session!</p>
                  <Button size="sm" variant="outline" onClick={() => setLocation("/subjects")}>
                    Start Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── CLASSROOM STATUS ── */}
        {classrooms && classrooms.length > 0 && (
          <Card className="border border-border/50 mb-8 bg-emerald-500/5">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> Joined Classrooms
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="flex flex-wrap gap-3">
                {classrooms.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-background/60 border border-emerald-500/20 rounded-xl px-4 py-2 group">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold">{c.name}</span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter opacity-70">{c.code}</Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleLeaveClassroom(c.id, c.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── TROPHY CASE ── */}
        <Card className="border border-border/50 bg-gradient-to-r from-amber-500/5 via-background to-background">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Trophy Case
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {allBadgeDefs.map((badge, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                    badge.earned
                      ? "border-border/50 bg-card hover:border-primary/20"
                      : "border-border/20 bg-muted/10 opacity-40 grayscale"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${badge.earned ? badge.bg : "bg-muted"}`}>
                    {badge.earned
                      ? <badge.icon className={`w-6 h-6 ${badge.color}`} />
                      : <Lock className="w-5 h-5 text-muted-foreground" />
                    }
                  </div>
                  <span className="font-semibold text-[11px] leading-tight mb-0.5">{badge.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{badge.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
