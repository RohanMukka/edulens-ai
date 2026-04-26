import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, GraduationCap, Activity, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

type StudentStat = {
  id: number;
  name: string;
  email: string;
  totalInteractions: number;
  avgScore: number;
  masteryCount: number;
};

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  const { data: students, isLoading } = useQuery<StudentStat[]>({
    queryKey: ["/api/teacher/students"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teacher/students");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>;
  }

  const avgClassScore = students && students.length > 0 
    ? students.reduce((acc, s) => acc + s.avgScore, 0) / students.length 
    : 0;
  
  const totalInteractions = students?.reduce((acc, s) => acc + s.totalInteractions, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              Educator Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor your students' real-time mastery and AI interactions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/"); }} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Students</p>
                  <h3 className="text-2xl font-bold">{students?.length || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Class Average Score</p>
                  <h3 className="text-2xl font-bold">{Math.round(avgClassScore * 100)}%</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total AI Interactions</p>
                  <h3 className="text-2xl font-bold">{totalInteractions}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Detailed breakdown of concept mastery per student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">Interactions</th>
                    <th className="px-4 py-3 text-center">Mastered Concepts</th>
                    <th className="px-4 py-3">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students?.map((student) => (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                      <td className="px-4 py-3 text-center">{student.totalInteractions}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                          {student.masteryCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                            <div 
                              className={`h-2 rounded-full ${student.avgScore >= 0.7 ? 'bg-emerald-500' : student.avgScore >= 0.4 ? 'bg-amber-500' : 'bg-destructive'}`} 
                              style={{ width: `${Math.round(student.avgScore * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{Math.round(student.avgScore * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No students have joined yet.
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
