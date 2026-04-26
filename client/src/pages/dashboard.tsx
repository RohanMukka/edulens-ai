import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import type { MasteryScore, Concept } from "@shared/schema";
import {
  ArrowLeft, BookOpen, Target, TrendingUp, Clock, Loader2, Award,
  AlertTriangle, Dna, Calculator, Landmark, Sparkles, Flame, Trophy,
  Brain, Network, LogOut, ArrowRight, CheckCircle2, Lock,
} from "lucide-react";

interface StudentStats {
  totalSessions: number;
  totalInteractions: number;
  avgScore: number;
  conceptsMastered: number;
  totalConcepts: number;
  weakAreas: { conceptId: number; name: string; score: number }[];
  recentSessions: any[];
}

const SUBJECT_META: Record<string, { icon: any; color: string; bg: string; ring: string }> = {
  Biology:  { icon: Dna,       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", ring: "#10b981" },
  Math:     { icon: Calculator, color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/10",    ring: "#3b82f6" },
  History:  { icon: Landmark,   color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-500/10",   ring: "#f59e0b" },
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

  if (!student) { setLocation("/"); return null; }

  const { data: stats, isLoading } = useQuery<StudentStats>({
    queryKey: ["/api/students", student.id, "stats"],
    queryFn: async () => (await apiRequest("GET", `/api/students/${student.id}/stats`)).json(),
  });

  const { data: mastery } = useQuery<MasteryScore[]>({
    queryKey: ["/api/students", student.id, "mastery"],
    queryFn: async () => (await apiRequest("GET", `/api/students/${student.id}/mastery`)).json(),
  });

  const subjects = ["Biology", "Math", "History"];
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasActivity = (stats?.totalInteractions || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/subjects")} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/graph")}>
              <Network className="w-4 h-4 mr-1.5" /> Knowledge Graph
            </Button>
            <Button size="sm" onClick={() => setLocation("/subjects")}>
              <BookOpen className="w-4 h-4 mr-1.5" /> Continue Learning
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/"); }} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
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
              </div>
            </div>

          </div>
        </div>

        {/* ── SUBJECT BREAKDOWN ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
