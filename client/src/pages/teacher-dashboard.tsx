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
  ArrowLeft, Loader2, CheckCircle2, BookOpen, TrendingUp, CheckCheck, AlertTriangle,
  Flame, Brain, Trash2, ArrowRight, Sparkles, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { classroomSocket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { TeacherDashboardSkeleton } from "@/components/ui/skeleton-screen";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import { AssignmentWizard } from "@/components/assignment-wizard";
import { TutorialOverlay } from "@/components/tutorial-overlay";


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

const MISCONCEPTION_META: Record<string, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  PROCESS_CONFUSION: { label: "Process Confusion", emoji: "🔄", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  INCOMPLETE_UNDERSTANDING: { label: "Partial Understanding", emoji: "🧩", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  OVERGENERALIZATION: { label: "Overgeneralization", emoji: "🎯", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  CAUSE_EFFECT_REVERSAL: { label: "Cause-Effect Reversal", emoji: "↔️", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  TERMINOLOGY_CONFUSION: { label: "Vocabulary Confusion", emoji: "📝", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  SURFACE_LEVEL: { label: "Surface-Level", emoji: "🏊", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

type HeatmapEntry = {
  conceptId: number;
  conceptName: string;
  subject: string;
  misconceptions: Record<string, number>;
  total: number;
};

type Classroom = {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  createdAt: string;
  isOwner?: boolean;
};

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : score >= 0.4
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-rose-500/10 text-rose-400 border-rose-500/20";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${color}`}>
      {pct}% Mastery
    </span>
  );
}

function MisconceptionHeatmap() {
  const { data, isLoading } = useQuery<{ heatmap: HeatmapEntry[]; summary: Record<string, number> }>({
    queryKey: ["/api/teacher/misconception-heatmap"],
    queryFn: async () => (await apiRequest("GET", "/api/teacher/misconception-heatmap")).json(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const heatmap = data?.heatmap || [];
  const summary = data?.summary || {};
  const totalMisconceptions = Object.values(summary).reduce((a, b) => a + b, 0);

  if (heatmap.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
        <CardContent className="p-16 flex flex-col items-center justify-center gap-6 opacity-40">
          <Brain className="w-16 h-16" />
          <p className="text-xs font-black uppercase tracking-widest text-center leading-relaxed">
            No diagnostic data available.<br />Waiting for conceptual interactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const mcTypes = Object.keys(MISCONCEPTION_META);

  return (
    <Card className="rounded-[2.5rem] border-rose-500/10 bg-rose-500/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-rose-500/5 overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black font-display uppercase tracking-widest flex items-center gap-3">
              <Flame className="w-5 h-5 text-rose-500" /> Cognitive Heatmap
            </CardTitle>
            <CardDescription className="text-white/40 font-medium">Aggregated conceptual confusion across all nodes</CardDescription>
          </div>
          <Badge className="bg-rose-500/10 text-rose-400 border-none text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full">
            {totalMisconceptions} Flags
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-12">
        {/* Summary distribution */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {mcTypes.map(type => {
            const count = summary[type] || 0;
            if (count === 0) return null;
            const meta = MISCONCEPTION_META[type];
            const pct = Math.round((count / totalMisconceptions) * 100);
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-3xl border ${meta.border} ${meta.bg} backdrop-blur-3xl flex flex-col items-center text-center`}
              >
                <span className="text-3xl mb-3">{meta.emoji}</span>
                <p className={`text-[8px] font-black uppercase tracking-tighter ${meta.color} mb-1`}>{meta.label}</p>
                <p className="text-xl font-black">{count}</p>
                <p className="text-[10px] text-white/20 font-black uppercase">{pct}%</p>
              </motion.div>
            );
          })}
        </div>

        {/* Detailed heatmap grid */}
        <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-white/20 min-w-[200px]">Conceptual Node</th>
                {mcTypes.map(type => (
                  <th key={type} className="text-center py-6 px-3 text-lg" title={MISCONCEPTION_META[type].label}>
                    {MISCONCEPTION_META[type].emoji}
                  </th>
                ))}
                <th className="text-center py-6 px-6 text-[10px] font-black uppercase tracking-widest text-white/20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {heatmap.slice(0, 10).map((entry, idx) => (
                <tr key={entry.conceptId} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-5 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black font-display text-sm uppercase tracking-tight">{entry.conceptName}</span>
                      <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">{entry.subject}</span>
                    </div>
                  </td>
                  {mcTypes.map(type => {
                    const count = entry.misconceptions[type] || 0;
                    if (count === 0) return <td key={type} className="text-center py-5 px-3 opacity-10 font-black text-xs">—</td>;
                    const intensity = Math.min(1, count / 5);
                    const meta = MISCONCEPTION_META[type];
                    return (
                      <td key={type} className="text-center py-5 px-3">
                        <div 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto text-sm font-black ${meta.color} shadow-lg`}
                          style={{ 
                            backgroundColor: `color-mix(in srgb, currentColor ${Math.round(intensity * 20 + 10)}%, transparent)`,
                            boxShadow: `0 0 20px color-mix(in srgb, currentColor 10%, transparent)`
                          }}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-5 px-6">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-sm font-black">
                      {entry.total}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

type InterventionItem = {
  studentId: number;
  studentName: string;
  studentEmail: string;
  conceptId: number;
  conceptName: string;
  subject: string;
  attempts: number;
  avgScore: number;
  lastMisconception: string;
  misconceptionLabel: string;
  priority: "critical" | "warning";
};

type InterventionData = {
  queue: InterventionItem[];
  topMisconception: { type: string; label: string; count: number } | null;
  stats: { atRisk: number; total: number };
};

function InterventionQueue() {
  const { data, isLoading } = useQuery<InterventionData>({
    queryKey: ["/api/teacher/interventions"],
    queryFn: async () => (await apiRequest("GET", "/api/teacher/interventions")).json(),
  });

  if (isLoading) return null;

  const queue = data?.queue || [];
  const topMc = data?.topMisconception;
  const stats = data?.stats || { atRisk: 0, total: 0 };

  return (
    <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden mb-8">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black font-display uppercase tracking-widest flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Intervention Queue
            </CardTitle>
            <CardDescription className="text-white/40 font-medium">Prioritized cognitive friction points requiring attention</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {stats.atRisk > 0 && (
              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full gap-2">
                <Flame className="w-4 h-4 animate-pulse" /> {stats.atRisk} Critical
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/10 py-1.5 px-4 rounded-full">
              {stats.total} Total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4">
        {/* Top Mc Highlight */}
        {topMc && (
          <div className="mb-8 p-6 rounded-3xl bg-amber-500/[0.03] border border-amber-500/10 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Brain className="w-7 h-7 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Dominant Class Friction</p>
              <p className="text-xl font-black font-display uppercase tracking-tight">
                {topMc.label} <span className="text-white/20 ml-2">({topMc.count} Occurrences)</span>
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-amber-500/20 text-amber-400 hover:bg-amber-500/10 font-black uppercase tracking-widest text-[10px] h-10 px-6">
              View Remediation
            </Button>
          </div>
        )}

        {queue.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.map((item, idx) => {
              const mc = MISCONCEPTION_META[item.lastMisconception];
              return (
                <motion.div
                  key={`${item.studentId}-${item.conceptId}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-6 rounded-[2rem] border backdrop-blur-3xl flex items-center gap-6 group transition-all hover:scale-[1.02] ${
                    item.priority === "critical"
                      ? "bg-rose-500/[0.03] border-rose-500/10"
                      : "bg-amber-500/[0.03] border-amber-500/10"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    item.priority === "critical" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {item.priority === "critical" ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-black font-display text-sm uppercase tracking-tight truncate">{item.studentName}</p>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/5">{item.subject}</Badge>
                    </div>
                    <p className="text-xs text-white/40 font-medium">
                      Confusion in <span className="text-white">{item.conceptName}</span>
                    </p>
                  </div>
                  {mc && (
                    <div className="text-center shrink-0">
                      <div className="text-2xl mb-1">{mc.emoji}</div>
                      <p className={`text-[8px] font-black uppercase tracking-tighter ${mc.color}`}>{mc.label}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-6 opacity-40">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">Cohesion Optimal</p>
              <p className="text-lg font-black font-display uppercase tracking-tight">No active interventions required</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { student, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newClassName, setNewClassName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
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

  const handleExportGrades = async (assignmentId: number, title: string) => {
    try {
      const res = await apiRequest("GET", `/api/assignments/${assignmentId}/grades`);
      const data = await res.json();
      
      if (data.length === 0) {
        toast({ title: "No data", description: "No submissions yet for this assignment.", variant: "destructive" });
        return;
      }

      const headers = ["Student Name", "Email", "Status", "Average Score", "Submitted At", "Answers"];
      const csvContent = [
        headers.join(","),
        ...data.map((r: any) => [
          `"${r.studentName}"`,
          r.studentEmail,
          r.status,
          r.score.toFixed(2),
          r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "N/A",
          r.answerCount
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `EduLens_Grades_${title.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Export Successful", description: "Grade report has been downloaded." });
    } catch (e: any) {
      toast({ title: "Export Failed", description: e.message, variant: "destructive" });
    }
  };

  const { data: classrooms, isLoading: classroomsLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    queryFn: async () => (await apiRequest("GET", "/api/classrooms")).json(),
  });

  const { data: students, isLoading } = useQuery<StudentStat[]>({
    queryKey: ["/api/teacher/students"],
    queryFn: async () => (await apiRequest("GET", "/api/teacher/students")).json(),
  });

  const { data: assignments } = useQuery<any[]>({
    queryKey: ["/api/assignments/teacher"],
    queryFn: async () => (await apiRequest("GET", "/api/assignments/teacher")).json(),
  });

  const handleCreateClassroom = async () => {
    const name = newClassName.trim();
    if (!name) return;
    
    setCreating(true);
    try {
      const res = await apiRequest("POST", "/api/classrooms", { name });
      if (!res.ok) throw new Error("Failed to create classroom");
      
      setNewClassName("");
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
      qc.invalidateQueries({ queryKey: ["/api/teacher/students"] });
      
      toast({
        title: "Success",
        description: `Classroom "${name}" created successfully!`,
      });
    } catch (e: any) {
      console.error("Creation error:", e);
      toast({
        title: "Creation Failed",
        description: e.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await apiRequest("POST", "/api/classrooms/join", { code: joinCode });
      setJoinCode("");
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
      qc.invalidateQueries({ queryKey: ["/api/teacher/students"] });
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
    }
    setJoining(false);
  };

  const handleDeleteClassroom = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All student progress links for this specific classroom record will be disconnected.`)) return;
    
    try {
      const res = await apiRequest("DELETE", `/api/classrooms/${id}`);
      if (!res.ok) throw new Error("Failed to delete classroom");
      
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
      qc.invalidateQueries({ queryKey: ["/api/teacher/students"] });
      
      toast({
        title: "Classroom Deleted",
        description: `Successfully removed "${name}".`,
      });
    } catch (e: any) {
      toast({
        title: "Delete Failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleLeaveClassroom = async (id: number, name: string) => {
    if (!confirm(`Leave "${name}"?`)) return;
    
    try {
      const res = await apiRequest("DELETE", `/api/classrooms/leave/${id}`);
      if (!res.ok) throw new Error("Failed to leave classroom");
      
      qc.invalidateQueries({ queryKey: ["/api/classrooms"] });
      qc.invalidateQueries({ queryKey: ["/api/teacher/students"] });
      
      toast({
        title: "Left Classroom",
        description: `You are no longer enrolled in "${name}".`,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading || classroomsLoading) {
    return <TeacherDashboardSkeleton />;
  }

  const avgClassScore = students && students.length > 0
    ? students.reduce((acc, s) => acc + s.avgScore, 0) / students.length
    : 0;
  const totalInteractions = students?.reduce((acc, s) => acc + s.totalInteractions, 0) || 0;
  const totalMastered = students?.reduce((acc, s) => acc + s.masteryCount, 0) || 0;

  const chartData = (students || [])
    .slice()
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8)
    .map(s => ({
      name: s.name.split(" ")[0],
      score: Math.round(s.avgScore * 100),
    }));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      <TutorialOverlay role="educator" />
      
      {/* ── BACKGROUND AMBIANCE ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[100px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <div className="flex">
        {/* ── SIDE NAVIGATION ── */}
        <aside className="w-20 lg:w-72 h-screen sticky top-0 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center lg:items-stretch p-6 z-50">
          <div className="flex items-center gap-3 px-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="hidden lg:block text-xl font-black font-display tracking-tighter">
              EDULENS <span className="text-primary">PRO</span>
            </span>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { icon: Activity, label: "Command Center", active: true },
              { icon: Users, label: "Student Roster" },
              { icon: BookOpen, label: "Course Materials" },
              { icon: Brain, label: "AI Insights" },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group ${
                  item.active ? "bg-primary/10 text-primary" : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.active ? "text-primary" : "group-hover:scale-110 transition-transform"}`} />
                <span className="hidden lg:block font-black uppercase tracking-widest text-[10px]">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="hidden lg:block px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Engine</span>
              </div>
              <p className="text-[10px] text-white/40 font-bold leading-tight">AI Diagnostic Node Active</p>
            </div>
            
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-white/40 hover:text-rose-400 hover:bg-rose-400/5 transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block font-black uppercase tracking-widest text-[10px]">Terminate Session</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 p-8 lg:p-12">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest py-1 px-3 mb-4">
                    Educator Portal v4.0
                  </Badge>
                  <h1 className="text-4xl lg:text-6xl font-black font-display tracking-tighter mb-4 uppercase">
                    Command <span className="text-primary">Center</span>
                  </h1>
                  <p className="text-lg text-white/40 font-medium max-w-xl">
                    Aggregated real-time pedagogical insights for {student?.name || "Educator"}. 
                    Monitoring {students?.length || 0} active learning paths.
                  </p>
                </motion.div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => setShowWizard(true)}
                  className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5 mr-3" /> Assign Learning Path
                </Button>
                <AssignmentWizard 
                  open={showWizard} 
                  onOpenChange={setShowWizard} 
                  classrooms={classrooms || []} 
                />
              </div>
            </div>

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Active Cohort", value: students?.length || 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
                { label: "Avg Class Mastery", value: `${Math.round(avgClassScore * 100)}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "AI Diagnoses", value: totalInteractions, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Concepts Locked", value: totalMastered, icon: CheckCheck, color: "text-violet-400", bg: "bg-violet-500/10" },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="rounded-3xl border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
                    <CardContent className="p-8">
                      <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-4xl font-black font-display tracking-tight">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* ── CLASSROOMS ── */}
              <div className="lg:col-span-1">
                <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 h-full overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-black font-display uppercase tracking-widest flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-primary" /> Learning Nodes
                    </CardTitle>
                    <CardDescription className="text-white/40 font-medium">Manage and join classroom clusters</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Deploy New Node</p>
                        <div className="flex gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/5">
                          <Input
                            placeholder="Cluster Name..."
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreateClassroom()}
                            className="bg-transparent border-none focus-visible:ring-0 text-sm font-medium h-11"
                          />
                          <Button size="icon" onClick={handleCreateClassroom} disabled={creating || !newClassName.trim()} className="rounded-xl bg-primary shadow-lg shadow-primary/20 shrink-0 h-11 w-11">
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Sync Existing</p>
                        <div className="flex gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/5">
                          <Input
                            placeholder="6-Digit Access Key"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === "Enter" && handleJoinClassroom()}
                            maxLength={6}
                            className="bg-transparent border-none focus-visible:ring-0 text-sm font-black tracking-[0.2em] h-11"
                          />
                          <Button variant="ghost" size="sm" onClick={handleJoinClassroom} disabled={joining || joinCode.length !== 6} className="rounded-xl hover:bg-white/5 shrink-0 px-4 h-11 text-[10px] font-black uppercase tracking-widest">
                            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {classrooms && classrooms.length > 0 ? (
                      <div className="space-y-4 pt-8 border-t border-white/5">
                        {classrooms.map((c) => (
                          <div key={c.id} className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <p className="font-black font-display text-sm group-hover:text-primary transition-colors mb-1">{c.name}</p>
                                <div className="flex items-center gap-2">
                                  {c.isOwner ? (
                                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest">Master Node</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10">Connected</Badge>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full text-white/20 hover:text-rose-400 hover:bg-rose-400/10"
                                onClick={() => c.isOwner ? handleDeleteClassroom(c.id, c.name) : handleLeaveClassroom(c.id, c.name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3 border border-white/5 shadow-inner">
                              <code className="text-xl font-black tracking-[0.4em] text-primary">{c.code}</code>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl hover:bg-white/5 transition-all"
                                  onClick={() => handleCopy(c.code)}
                                >
                                  {copied === c.code ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 opacity-40 group-hover:opacity-100" />}
                                </Button>
                                {c.isOwner && (
                                  <Button
                                    size="sm"
                                    className="h-9 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-xl"
                                    onClick={() => { setLiveUpdates([]); setActiveLiveRoom(c); }}
                                  >
                                    <Activity className="w-4 h-4 mr-2 text-primary" /> Live
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center gap-4 opacity-40">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">No Active Nodes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── CLASS PERFORMANCE CHART ── */}
              <div className="lg:col-span-2">
                <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 h-full overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-black font-display uppercase tracking-widest flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-primary" /> Performance Analytics
                    </CardTitle>
                    <CardDescription className="text-white/40 font-medium">Average mastery levels across active students</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    {chartData.length > 0 ? (
                      <div className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} barCategoryGap="35%">
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 800 }} 
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 800 }} 
                              tickFormatter={v => `${v}%`} 
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                              contentStyle={{ 
                                fontSize: 12, 
                                borderRadius: 16, 
                                border: "1px solid rgba(255,255,255,0.1)", 
                                background: "rgba(0,0,0,0.8)",
                                backdropFilter: "blur(12px)",
                                fontWeight: 600
                              }}
                              formatter={(v: number) => [`${v}%`, "Mastery"]}
                            />
                            <Bar
                              dataKey="score"
                              fill="url(#barGradient)"
                              radius={[12, 12, 4, 4]}
                              barSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] gap-4 opacity-40">
                        <Users className="w-10 h-10" />
                        <p className="text-xs font-black uppercase tracking-widest">No Performance Data</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── ASSIGNMENTS LIST ── */}
            <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black font-display uppercase tracking-widest flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" /> Active Deployments
                  </CardTitle>
                  <CardDescription className="text-white/40 font-medium">Instructional materials ready for evaluation</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowWizard(true)} className="rounded-full hover:bg-white/5">
                  <Plus className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 border-t border-white/5">
                <div className="divide-y divide-white/5">
                  {assignments?.length === 0 ? (
                    <div className="p-16 text-center text-white/20 flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">No Active Deployments</p>
                    </div>
                  ) : (
                    assignments?.map(assignment => (
                      <div key={assignment.id} className="p-8 flex flex-col md:flex-row items-center justify-between hover:bg-white/[0.01] transition-all gap-6">
                        <div className="flex items-start gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
                            <Sparkles className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black font-display tracking-tight mb-1 uppercase">{assignment.title}</h4>
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className="bg-white/5 text-white/50 border-white/10 text-[8px] font-black uppercase tracking-widest">{assignment.classroomName}</Badge>
                              <Badge className="bg-amber-500/10 text-amber-400 border-none text-[8px] font-black uppercase tracking-widest">{assignment.pendingGrades} Action Items</Badge>
                              <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Deployed {new Date(assignment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleExportGrades(assignment.id, assignment.title)} 
                            className="flex-1 h-12 px-6 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px]"
                          >
                            <Download className="w-4 h-4 mr-2" /> Export
                          </Button>
                          <Button 
                            onClick={() => setLocation(`/teacher/grade/${assignment.id}`)} 
                            className="flex-1 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                          >
                            SpeedGrader <ArrowRight className="w-4 h-4 ml-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── INTERVENTION QUEUE ── */}
            <InterventionQueue />

            {/* ── MISCONCEPTION HEATMAP ── */}
            <MisconceptionHeatmap />

            {/* ── STUDENT ROSTER TABLE ── */}
            <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-black font-display uppercase tracking-widest flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" /> Personnel Registry
                </CardTitle>
                <CardDescription className="text-white/40 font-medium">Granular performance metrics for all active learners</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01]">
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Learner</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20 hidden sm:table-cell">Identity</th>
                        <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-white/20">Engagements</th>
                        <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-white/20">Mastery Lock</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Efficiency Index</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {students && students.length > 0 ? students.map((s, idx) => (
                        <tr key={`${s.id}-${idx}`} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <span className="text-sm font-black text-primary">
                                  {s.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-black font-display uppercase tracking-tight">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-white/40 font-medium hidden sm:table-cell">{s.email}</td>
                          <td className="px-8 py-6 text-center">
                            <Badge className="bg-white/5 text-white/60 border-white/10 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                              {s.totalInteractions}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                              {s.masteryCount}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-6 min-w-[200px]">
                              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${s.avgScore * 100}%` }}
                                  className={`h-full ${s.avgScore >= 0.7 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : s.avgScore >= 0.4 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                                />
                              </div>
                              <ScorePill score={s.avgScore} />
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-6 opacity-40">
                              <Users className="w-16 h-16" />
                              <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest">No Registered Learners</p>
                                <p className="text-[10px] font-medium max-w-xs mx-auto">Create a classroom and share the deployment code to begin population.</p>
                              </div>
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
        </main>
      </div>

      {/* ── LIVE SESSION OVERLAY ── */}
      <AnimatePresence>
        {activeLiveRoom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl p-8 overflow-y-auto"
          >
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="flex items-center justify-between border-b border-white/5 pb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Activity className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black font-display tracking-tighter uppercase">Live Engine <span className="text-primary">Stream</span></h2>
                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px] mt-2">
                      Node: <span className="text-white">{activeLiveRoom.name}</span> • Sync Key: <span className="text-primary tracking-[0.2em]">{activeLiveRoom.code}</span>
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveLiveRoom(null)} 
                  className="h-14 px-8 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs"
                >
                  <LogOut className="w-5 h-5 mr-3" /> Terminate Stream
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Packet Stream (Real-Time)</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Synchronized</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {liveUpdates.length > 0 ? (
                      liveUpdates.map((update, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-8 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 group ${
                            update.isSocraticActive 
                              ? "border-rose-500/30 bg-rose-500/[0.05] shadow-[0_0_30px_rgba(239,68,68,0.1)]" 
                              : "border-white/5 bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-black text-primary">
                                {update.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black font-display uppercase tracking-tight">{update.name}</p>
                                <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Transaction Recorded</p>
                              </div>
                            </div>
                            <ScorePill score={update.score} />
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-white/5 text-white/40 border-white/10 text-[8px] font-black uppercase tracking-widest px-3 py-1">{update.concept}</Badge>
                              {update.bloomLevel && (
                                <Badge className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 border-none ${BLOOMS_MAP[update.bloomLevel.trim().toUpperCase()]?.bg} ${BLOOMS_MAP[update.bloomLevel.trim().toUpperCase()]?.color}`}>
                                  {BLOOMS_MAP[update.bloomLevel.trim().toUpperCase()]?.label}
                                </Badge>
                              )}
                              {update.isSocraticActive && (
                                <Badge className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 animate-bounce">
                                  Intervention Active
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-lg font-medium text-white/80 italic leading-relaxed">
                              "{update.isSocraticActive ? (update.socraticMessage || 'Starting Socratic review...') : update.feedback}"
                            </p>

                            {update.misconception && update.misconception !== "NO_MISCONCEPTION" && (
                              <div className="pt-4 border-t border-white/5 flex items-center gap-3 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                <AlertTriangle className="w-4 h-4" />
                                Logic Error: {update.misconception.replace(/_/g, " ")}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-32 flex flex-col items-center justify-center gap-8 opacity-20">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/20 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Awaiting Inbound Packets...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Panel */}
                <div className="space-y-8">
                  <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-lg font-black font-display uppercase tracking-widest">Status Console</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Operational Protocol</p>
                        <p className="text-sm font-medium leading-relaxed text-white/60">
                          Real-time telemetry from <span className="text-white font-black">{activeLiveRoom.name}</span>. 
                          All conceptual engagements are processed via the AI Diagnostic Node before streaming.
                        </p>
                      </div>
                      <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Uplink Status</span>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-black uppercase tracking-widest">Established</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
