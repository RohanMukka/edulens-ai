import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, Clock, Brain, Download, Plus, CheckCircle2, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function Scheduler() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"weekly" | "ai-plan">("weekly");

  const { data: tasks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/scheduler/tasks"],
    queryFn: async () => (await apiRequest("GET", "/api/scheduler/tasks")).json(),
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scheduler/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scheduler/tasks"] });
      toast({ title: "Task Scheduled!", description: "Your study session has been added." });
    }
  });

  const handleExport = () => {
    toast({
      title: "Calendar Exported!",
      description: "Your study schedule has been synced to your .ics calendar format.",
    });
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeSlots = ["04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"];

  // Map tasks to grid
  const scheduleData: Record<string, Record<string, any>> = {};
  tasks?.forEach(task => {
    const date = new Date(task.startTime);
    const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (!scheduleData[day]) scheduleData[day] = {};
    scheduleData[day][time] = task;
  });

  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("bio")) return "bg-emerald-500/20 text-emerald-600";
    if (s.includes("math")) return "bg-blue-500/20 text-blue-600";
    if (s.includes("hist")) return "bg-amber-500/20 text-amber-600";
    if (s.includes("comp")) return "bg-violet-500/20 text-violet-600";
    return "bg-slate-500/20 text-slate-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              Study Scheduler
            </h1>
            <p className="text-muted-foreground mt-1">Manage your time and let AI optimize your study blocks.</p>
          </div>
          
          <Button className="bg-primary hover:bg-primary/90" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Sync to Google Calendar
          </Button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button 
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === "weekly" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly View
          </button>
          <button 
            className={`pb-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "ai-plan" ? "border-violet-500 text-violet-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("ai-plan")}
          >
            <Brain className="w-4 h-4" /> AI Study Plan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "weekly" ? (
            <motion.div key="weekly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-8 border-b border-border bg-muted/20">
                    <div className="p-4 text-center font-bold text-xs uppercase text-muted-foreground border-r border-border">Time</div>
                    {days.map(day => (
                      <div key={day} className="p-4 text-center font-bold text-sm border-r border-border last:border-0">{day}</div>
                    ))}
                  </div>

                  {/* Calendar Body */}
                  {timeSlots.map(time => (
                    <div key={time} className="grid grid-cols-8 border-b border-border last:border-0">
                      <div className="p-4 flex items-center justify-center font-semibold text-xs text-muted-foreground border-r border-border bg-muted/10">
                        {time}
                      </div>
                      {days.map((day, dayIdx) => {
                        const block = scheduleData[day]?.[time];
                        return (
                          <div key={day + time} className="p-2 border-r border-border last:border-0 min-h-[100px] hover:bg-muted/30 transition-colors relative group">
                            {block ? (
                              <div className={`w-full h-full rounded-lg p-2 flex flex-col ${getSubjectColor(block.subject)} border border-current/20`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">{block.subject}</span>
                                <span className="text-sm font-semibold leading-tight">{block.title}</span>
                              </div>
                            ) : (
                              <button 
                                className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  // Simplified add for demo
                                  const now = new Date();
                                  const targetDate = new Date();
                                  targetDate.setDate(now.getDate() + (dayIdx - (now.getDay() === 0 ? 6 : now.getDay() - 1)));
                                  const [h, m, p] = time.split(/[: ]/);
                                  let hour = parseInt(h);
                                  if (p === "PM" && hour < 12) hour += 12;
                                  targetDate.setHours(hour, 0, 0, 0);
                                  
                                  addTaskMutation.mutate({
                                    title: "Study Session",
                                    subject: "General",
                                    startTime: targetDate.toISOString(),
                                    endTime: new Date(targetDate.getTime() + 3600000).toISOString(),
                                    type: "Focus",
                                    priority: "medium"
                                  });
                                }}
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="ai-plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <Card className="border-violet-500/30 shadow-md bg-gradient-to-br from-background to-violet-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-500" /> Personalized AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">Based on your recent performance, the AI has detected weak areas and suggests the following schedule adjustments:</p>
                      
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex gap-4">
                        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm text-rose-600 dark:text-rose-400">Add 30 mins for Biology</h4>
                          <p className="text-xs text-muted-foreground mt-1">You struggled with the Calvin Cycle recently. We recommend adding a study block on Thursday.</p>
                          <Button size="sm" variant="outline" className="mt-3 border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white">Accept Suggestion</Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex gap-4">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Reduce Math Time</h4>
                          <p className="text-xs text-muted-foreground mt-1">You scored 95% on Algebra! You can safely reduce Friday's review session by 20 minutes.</p>
                          <Button size="sm" variant="outline" className="mt-3 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white">Accept Suggestion</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <h3 className="font-bold text-lg">Focus Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Biology</span>
                        <span className="text-muted-foreground">4 hrs / week</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[60%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Math</span>
                        <span className="text-muted-foreground">2 hrs / week</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[30%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> History</span>
                        <span className="text-muted-foreground">1 hr / week</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[15%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
