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
  ArrowLeft, Loader2, CheckCircle2, BookOpen, TrendingUp, CheckCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Enrolled Students", value: students?.length || 0,   icon: Users,          color: "text-primary",       bg: "bg-primary/10" },
            { label: "Class Avg Score",   value: `${Math.round(avgClassScore * 100)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "AI Interactions",   value: totalInteractions,        icon: Activity,       color: "text-blue-600",      bg: "bg-blue-500/10" },
            { label: "Concepts Mastered", value: totalMastered,            icon: CheckCheck,     color: "text-violet-600",    bg: "bg-violet-500/10" },
          ].map(stat => (
            <Card key={stat.label} className="border border-border/50">
              <CardContent className="pt-5 pb-4">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* ── CLASSROOMS ── */}
          <div className="lg:col-span-1">
            <Card className="border border-border/50 h-full">
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
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleCreateClassroom} disabled={creating || !newClassName.trim()}>
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>

                {classrooms && classrooms.length > 0 ? (
                  <div className="space-y-3">
                    {classrooms.map((c) => (
                      <div key={c.id} className="p-3 border border-border/50 rounded-xl bg-muted/20">
                        <p className="font-semibold text-sm mb-2 truncate">{c.name}</p>
                        <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border/40">
                          <code className="text-xl font-black tracking-[0.3em] text-primary">{c.code}</code>
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleCopy(c.code)}
                          >
                            {copied === c.code
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <Copy className="w-4 h-4" />}
                          </Button>
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
    </div>
  );
}
