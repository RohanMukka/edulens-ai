import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import type { MasteryScore, Concept } from "@shared/schema";
import {
  ArrowLeft, BarChart3, Brain, BookOpen, Target, TrendingUp,
  Clock, Loader2, Award, AlertTriangle
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();

  if (!student) {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ["/api/students", student.id, "stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/students/${student.id}/stats`);
      return res.json();
    },
  });

  const { data: mastery } = useQuery<MasteryScore[]>({
    queryKey: ["/api/students", student.id, "mastery"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/students/${student.id}/mastery`);
      return res.json();
    },
  });

  const subjects = ["Biology", "Math", "History"];

  const conceptQueries = subjects.map(subject =>
    useQuery<Concept[]>({
      queryKey: ["/api/concepts", subject],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/concepts/${subject}`);
        return res.json();
      },
    })
  );

  const allConcepts = conceptQueries.flatMap(q => q.data || []);

  const masteryMap: Record<number, number> = {};
  if (mastery) {
    for (const m of mastery) {
      masteryMap[m.conceptId] = m.score;
    }
  }

  // Bar chart data: mastery per concept
  const barData = allConcepts.map(c => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + "..." : c.name,
    mastery: Math.round((masteryMap[c.id] || 0) * 100),
    subject: c.subject,
  }));

  // Radar data: average mastery per subject
  const radarData = subjects.map(subject => {
    const subConcepts = allConcepts.filter(c => c.subject === subject);
    const avg = subConcepts.length > 0
      ? subConcepts.reduce((sum, c) => sum + (masteryMap[c.id] || 0), 0) / subConcepts.length
      : 0;
    return { subject, mastery: Math.round(avg * 100) };
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/subjects")} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">{student.name}'s learning progress</p>
          </div>
          <Button onClick={() => setLocation("/subjects")} data-testid="button-learn-more">
            <BookOpen className="w-4 h-4 mr-2" /> Continue Learning
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Sessions", value: stats?.totalSessions || 0, icon: Clock, color: "text-primary" },
            { label: "Responses", value: stats?.totalInteractions || 0, icon: Target, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Avg Score", value: `${Math.round((stats?.avgScore || 0) * 100)}%`, icon: TrendingUp, color: "text-amber-600 dark:text-amber-400" },
            { label: "Mastered", value: `${stats?.conceptsMastered || 0}/${stats?.totalConcepts || 0}`, icon: Award, color: "text-primary" },
          ].map(stat => (
            <Card key={stat.label} className="border border-border/60">
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Mastery by Subject (Radar) */}
          <Card className="border border-border/60">
            <CardContent className="pt-5 pb-3">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> Subject Mastery
              </h3>
              {radarData.some(d => d.mastery > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(240 6% 90%)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      dataKey="mastery"
                      stroke="hsl(239 84% 67%)"
                      fill="hsl(239 84% 67%)"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                  Complete some concepts to see your radar chart!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Concept Mastery (Bar) */}
          <Card className="border border-border/60">
            <CardContent className="pt-5 pb-3">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Concept Mastery
              </h3>
              {barData.some(d => d.mastery > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData.filter(d => d.mastery > 0)} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value: number) => [`${value}%`, "Mastery"]}
                    />
                    <Bar dataKey="mastery" fill="hsl(239 84% 67%)" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                  Complete some concepts to see your progress chart!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weak Areas */}
        {stats?.weakAreas && stats.weakAreas.length > 0 && (
          <Card className="border border-border/60 mb-6">
            <CardContent className="pt-5 pb-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Areas to Improve
              </h3>
              <div className="space-y-3">
                {stats.weakAreas.map(area => (
                  <div key={area.conceptId} className="flex items-center gap-3" data-testid={`weak-area-${area.conceptId}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{area.name}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(area.score * 100)}%</span>
                      </div>
                      <Progress value={area.score * 100} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sessions */}
        {stats?.recentSessions && stats.recentSessions.length > 0 && (
          <Card className="border border-border/60">
            <CardContent className="pt-5 pb-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Recent Sessions
              </h3>
              <div className="space-y-2">
                {stats.recentSessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{session.subject}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {session.endedAt ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">Completed</Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">In Progress</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
