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
  Brain, Network, LogOut, ArrowRight, CheckCircle2, Lock, Code, Atom, FlaskConical, Users, Trash2, Quote, CalendarDays, Bell, CheckSquare, MessageCircle, ChevronRight
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { TutorialOverlay } from "@/components/tutorial-overlay";

interface MisconceptionPattern {
  type: string;
  label: string;
  emoji: string;
  count: number;
  concepts: string[];
}

interface Reflection {
  id: number;
  studentId: number;
  conceptId: number;
  content: string;
  createdAt: string;
  conceptName: string;
}

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

  const { data: earnedBadges } = useQuery<any[]>({
    queryKey: ["/api/students", student.id, "badges"],
    enabled: !!student,
    queryFn: async () => (await apiRequest("GET", `/api/students/${student.id}/badges`)).json(),
  });


  const { data: misconceptionHistory } = useQuery<MisconceptionPattern[]>({
    queryKey: ["/api/students", student.id, "misconception-history"],
    queryFn: async () => (await apiRequest("GET", `/api/students/${student.id}/misconception-history`)).json(),
  });

  const { data: reflections } = useQuery<Reflection[]>({
    queryKey: ["/api/students", student.id, "reflections"],
    queryFn: async () => (await apiRequest("GET", `/api/students/${student.id}/reflections`)).json(),
  });

  const { data: assignments } = useQuery<any[]>({
    queryKey: ["/api/assignments/student"],
    enabled: !!student,
    queryFn: async () => (await apiRequest("GET", "/api/assignments/student")).json(),
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

  const dynamicBadges = (earnedBadges || []).map(b => {
    let icon = Award, color = "text-primary", bg = "bg-primary/10", name = b.badgeType, desc = "Earned an achievement";
    if (b.badgeType === "CONCEPT_MASTER") {
      name = "Concept Master"; desc = "Mastered a new concept with >80% score"; icon = Trophy; color = "text-amber-500"; bg = "bg-amber-500/10";
    } else if (b.badgeType === "COMEBACK_KID") {
      name = "Comeback Kid"; desc = "Bounced back from <50% to >70%"; icon = Flame; color = "text-rose-500"; bg = "bg-rose-500/10";
    } else if (b.badgeType === "SOCRATES") {
      name = "Socratic Thinker"; desc = "Used the Socratic Tutor to solve a problem"; icon = Brain; color = "text-blue-500"; bg = "bg-blue-500/10";
    }
    return { name, desc, icon, color, bg, earned: true };
  }).filter(b => b.name);

  // Combine them for display, showing earned ones first
  const displayBadges = [...dynamicBadges, ...allBadgeDefs].filter((b, idx, self) => self.findIndex(t => t.name === b.name) === idx).sort((a, b) => Number(b.earned) - Number(a.earned));

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasActivity = (stats?.totalInteractions || 0) > 0;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 premium-gradient overflow-hidden pb-20">
      <TutorialOverlay role="student" />
      
      {/* ── BACKGROUND ELEMENTS ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/subjects")} 
              className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1 mb-2 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Performance Hub
              </div>
              <h1 className="text-4xl font-black tracking-tight font-display">Student Command Center</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <Button variant="outline" size="sm" onClick={() => setLocation("/graph")} className="h-11 px-6 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/5 font-bold shrink-0">
              <Network className="w-4 h-4 mr-2 text-primary" /> Graph
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/forums")} className="h-11 px-6 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/5 font-bold shrink-0">
              <MessageCircle className="w-4 h-4 mr-2 text-blue-400" /> Forums
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/scheduler")} className="h-11 px-6 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/5 font-bold shrink-0">
              <CalendarDays className="w-4 h-4 mr-2 text-emerald-400" /> Scheduler
            </Button>
            <Button size="sm" onClick={() => setLocation("/subjects")} className="h-11 px-6 rounded-xl bg-primary shadow-lg shadow-primary/20 font-black shrink-0">
              <BookOpen className="w-4 h-4 mr-2" /> Start Learning
            </Button>
          </div>
        </header>

        {/* ── HERO BANNER ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl p-10 mb-10 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
            {/* Progress ring with inner glow */}
            <div className="relative shrink-0 group">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-all duration-700" />
              <div className="relative bg-black/40 rounded-full p-2">
                <ProgressRing pct={overallPct} size={180} stroke={14} color="hsl(var(--primary))" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black font-display tracking-tighter">{overallPct}%</span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Mastery Index</span>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] mb-4">
                <Flame className="w-4 h-4 fill-primary" /> Active Learning Streak
              </div>
              <h2 className="text-5xl font-black tracking-tighter mb-6 font-display">
                You're on a <span className="text-primary">{stats?.currentStreak || 1} day</span> roll, <br />
                keep pushing limits.
              </h2>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Trophy className="w-5 h-5 text-primary" /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Mastered</p>
                    <p className="font-display font-black text-lg leading-none">{masteredCount} <span className="text-sm font-bold text-muted-foreground/50">/ {totalCount}</span></p>
                  </div>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10"><Clock className="w-5 h-5 text-emerald-400" /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Time Spent</p>
                    <p className="font-display font-black text-lg leading-none">{stats?.totalSessions || 0} <span className="text-sm font-bold text-muted-foreground/50">Sessions</span></p>
                  </div>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10"><Target className="w-5 h-5 text-amber-400" /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Reasoning</p>
                    <p className="font-display font-black text-lg leading-none">{stats?.totalInteractions || 0} <span className="text-sm font-bold text-muted-foreground/50">Interactions</span></p>
                  </div>
                </div>
                {stats?.classPercentile !== null && (
                  <div className="px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20"><Award className="w-5 h-5 text-primary" /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Class Standing</p>
                      <p className="font-display font-black text-lg leading-none">Top {100 - stats!.classPercentile}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8 mb-10">
          {/* ── STAT CARDS ── */}
          {subjectBreakdown.map(({ subject, mastered, total, avg, meta }, idx) => {
            const Icon = meta.icon;
            const pct = Math.round(avg * 100);
            return (
              <motion.div
                key={subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="premium-card h-full bg-white/[0.01] hover:bg-white/[0.03] border-white/5 hover:border-primary/30 transition-all duration-500 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl ${meta.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${meta.color}`} />
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black font-display tracking-tight" style={{ color: meta.ring }}>{pct}%</span>
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-lg mb-1">{subject}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-4">
                      {mastered} / {total} Mastered
                    </p>
                    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute h-full rounded-full" 
                        style={{ backgroundColor: meta.ring }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-10">
          {/* ── RADAR CHART ── */}
          <Card className="rounded-[2rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden group">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10"><Brain className="w-5 h-5 text-primary" /></div>
                <CardTitle className="text-xl font-display font-bold">Subject Mastery Balance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {radarData.some(d => d.mastery > 0) ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar 
                        dataKey="mastery" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3} 
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-center">
                  <Brain className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground font-bold">Complete some sessions to unlock your radar visualization.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── COGNITIVE GROWTH ── */}
          <Card className="rounded-[2rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden group">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10"><TrendingUp className="w-5 h-5 text-violet-400" /></div>
                <CardTitle className="text-xl font-display font-bold">Cognitive Depth Index</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {stats?.recentInteractions && stats.recentInteractions.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={(stats.recentInteractions).map((i, idx) => ({
                        index: idx + 1,
                        level: BLOOMS_VALUE_MAP[i.bloomsLevel?.trim().toUpperCase() || 'UNDERSTANDING'] || 2,
                        label: i.bloomsLevel || 'Understanding'
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis hide />
                      <YAxis 
                        stroke="rgba(255,255,255,0.3)" 
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
                              <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                                <p className="font-black text-primary uppercase tracking-widest text-[10px] mb-1">{payload[0].payload.label}</p>
                                <p className="text-white font-bold text-sm">Interaction #{payload[0].payload.index}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="level" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={4} 
                        dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 3, stroke: 'black' }} 
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground font-bold">Answer questions to track your Bloom's Taxonomy progression.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Misconceptions */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 font-display">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              Detected Cognitive Gaps
            </h2>
            <Card className="rounded-[2rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden">
              <CardContent className="p-8">
                {misconceptionHistory && misconceptionHistory.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {misconceptionHistory.map((m, idx) => (
                      <motion.div
                        key={m.type}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-4xl group-hover:scale-125 transition-transform">{m.emoji}</div>
                          <div>
                            <h4 className="font-display font-black text-lg leading-none mb-1">{m.label}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">Flagged {m.count} times</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.concepts.map(c => (
                            <Badge key={c} variant="outline" className="bg-white/5 border-white/5 text-[10px] font-bold text-muted-foreground">{c}</Badge>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500/30 mx-auto mb-6" />
                    <h3 className="text-xl font-bold font-display mb-2">Clear Reasoning Detected</h3>
                    <p className="text-muted-foreground font-medium">No recurring misconceptions found. Your conceptual models are solid!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Assignments */}
          <div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 font-display">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              Deadlines
            </h2>
            <Card className="rounded-[2rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden">
              <CardContent className="p-0">
                {(!assignments || assignments.length === 0) ? (
                  <div className="p-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">No active tasks</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {assignments.map((sa: any) => (
                      <div key={sa.id} className="p-6 hover:bg-white/[0.03] transition-all flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${sa.status === 'pending' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                          {sa.status === 'pending' ? <Clock className="w-6 h-6 text-rose-500" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-bold text-base leading-tight mb-1">{sa.assignment.title}</h4>
                          <p className="text-xs text-muted-foreground font-bold">{sa.classroomName}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trophy Case Redesign */}
        <div className="mt-20">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3 font-display">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            Trophy Case
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {displayBadges.map((badge, idx) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex flex-col items-center p-6 rounded-[2rem] border transition-all duration-500 ${badge.earned ? "bg-white/[0.03] border-white/10 shadow-2xl shadow-primary/5" : "bg-white/[0.01] border-white/5 opacity-40 grayscale"}`}
              >
                <div className={`w-16 h-16 rounded-full ${badge.bg} flex items-center justify-center mb-4 ${badge.earned ? "animate-float" : ""}`}>
                  <badge.icon className={`w-8 h-8 ${badge.color}`} />
                </div>
                <h4 className="text-sm font-black font-display text-center mb-1 leading-none">{badge.name}</h4>
                <p className="text-[10px] text-muted-foreground font-bold text-center leading-tight uppercase tracking-tighter">{badge.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
