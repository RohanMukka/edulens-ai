import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CalendarDays, Clock, Brain, Download, Plus, CheckCircle2, AlertTriangle, Sparkles, Loader2, Trash2, Calendar, Target, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Scheduler() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"weekly" | "ai-plan">("weekly");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    subject: "General",
    type: "Focus",
    priority: "medium",
    day: "Monday",
    time: "06:00 PM"
  });

  const { data: tasks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/scheduler/tasks"],
    queryFn: async () => (await apiRequest("GET", "/api/scheduler/tasks")).json(),
  });

  const { data: mastery } = useQuery<any[]>({
    queryKey: [`/api/students/${student?.id}/mastery`],
    queryFn: async () => (await apiRequest("GET", `/api/students/${student?.id}/mastery`)).json(),
    enabled: !!student
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scheduler/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scheduler/tasks"] });
      setIsModalOpen(false);
      toast({ title: "Task Scheduled!", description: "Your study session has been added." });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scheduler/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scheduler/tasks"] });
      toast({ title: "Task Removed", description: "The study block has been deleted." });
    }
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeSlots = ["03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"];

  // Map tasks to grid
  const scheduleData: Record<string, Record<string, any>> = {};
  tasks?.forEach(task => {
    const date = new Date(task.startTime);
    // Adjust for JS getDay (0=Sun, 1=Mon...) to our array (0=Mon...)
    const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const day = days[dayIdx];
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (!scheduleData[day]) scheduleData[day] = {};
    scheduleData[day][time] = task;
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;

    const now = new Date();
    const dayIdx = days.indexOf(newTask.day);
    const targetDate = new Date();
    // Move to the correct day of the current week
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
    targetDate.setDate(now.getDate() + (dayIdx - currentDay));
    
    const [h, m, p] = newTask.time.split(/[: ]/);
    let hour = parseInt(h);
    if (p === "PM" && hour < 12) hour += 12;
    if (p === "AM" && hour === 12) hour = 0;
    targetDate.setHours(hour, 0, 0, 0);

    addTaskMutation.mutate({
      title: newTask.title,
      subject: newTask.subject,
      startTime: targetDate.toISOString(),
      endTime: new Date(targetDate.getTime() + 3600000).toISOString(),
      type: newTask.type,
      priority: newTask.priority
    });
  };

  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("bio")) return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
    if (s.includes("math")) return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    if (s.includes("hist")) return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    if (s.includes("comp") || s.includes("cs")) return "bg-violet-500/20 text-violet-600 border-violet-500/30";
    if (s.includes("phys")) return "bg-cyan-500/20 text-cyan-600 border-cyan-500/30";
    return "bg-slate-500/20 text-slate-600 border-slate-500/30";
  };

  const weakMastery = mastery?.filter(m => m.score < 0.6).slice(0, 2) || [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),transparent)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="mb-4 -ml-2 hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                <CalendarDays className="w-8 h-8 text-primary" />
              </div>
              Study <span className="text-primary">Scheduler</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Optimize your learning flow with AI-driven study blocks and real-time performance syncing.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none h-12 px-6 font-bold" onClick={() => toast({ title: "Syncing...", description: "Connecting to your calendar provider." })}>
              <Download className="w-4 h-4 mr-2" /> Export ICS
            </Button>
            <Button className="flex-1 sm:flex-none h-12 px-8 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Study Block
            </Button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex p-1 bg-muted/30 backdrop-blur-sm rounded-2xl w-fit mb-10 border border-border/40">
          <button 
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === "weekly" ? "bg-background text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly Schedule
          </button>
          <button 
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === "ai-plan" ? "bg-background text-violet-500 shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("ai-plan")}
          >
            <Brain className="w-4 h-4" /> AI Optimization
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "weekly" ? (
            <motion.div 
              key="weekly" 
              initial={{ opacity: 0, scale: 0.99 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.99 }}
              className="space-y-6"
            >
              <Card className="glass-card border-border/40 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    {/* CALENDAR HEADER */}
                    <div className="grid grid-cols-8 border-b border-border/40 bg-muted/10">
                      <div className="p-6 text-center flex items-center justify-center border-r border-border/40">
                        <Clock className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      {days.map(day => (
                        <div key={day} className="p-6 text-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{day.slice(0, 3)}</span>
                          <span className="text-lg font-black tracking-tight">{day}</span>
                        </div>
                      ))}
                    </div>

                    {/* CALENDAR BODY */}
                    {timeSlots.map(time => (
                      <div key={time} className="grid grid-cols-8 border-b border-border/40 last:border-0 group/row">
                        <div className="p-6 flex items-center justify-center font-black text-xs text-muted-foreground/60 border-r border-border/40 bg-muted/5 group-hover/row:bg-muted/10 transition-colors">
                          {time}
                        </div>
                        {days.map((day) => {
                          const block = scheduleData[day]?.[time];
                          return (
                            <div key={day + time} className="p-2 border-r border-border/40 last:border-0 min-h-[140px] relative group transition-all duration-300">
                              {block ? (
                                <motion.div 
                                  layoutId={`task-${block.id}`}
                                  className={`w-full h-full rounded-[1.2rem] p-4 flex flex-col justify-between border-2 ${getSubjectColor(block.subject)} shadow-lg shadow-current/5 relative group/item overflow-hidden`}
                                >
                                  <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => deleteTaskMutation.mutate(block.id)}
                                      className="p-1.5 rounded-lg bg-background/50 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{block.subject}</span>
                                    </div>
                                    <span className="text-sm font-black leading-tight tracking-tight block mt-1">{block.title}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-4">
                                    <Badge className="bg-background/40 border-none text-[9px] font-black uppercase tracking-tighter h-5">
                                      {block.type}
                                    </Badge>
                                    <div className={`p-1 rounded-md bg-background/30 ${block.priority === 'high' ? 'text-rose-500' : 'text-amber-500'}`}>
                                      {block.priority === 'high' ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                    </div>
                                  </div>
                                </motion.div>
                              ) : (
                                <button 
                                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-primary/5 border-2 border-dashed border-primary/20 m-2 rounded-[1.2rem] text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    setNewTask(prev => ({ ...prev, day, time }));
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <Plus className="w-6 h-6 mb-1 scale-75 group-hover:scale-100 transition-transform" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="ai-plan" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-7 space-y-8">
                <Card className="glass-card border-violet-500/30 overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Brain className="w-32 h-32 text-violet-500" />
                  </div>
                  <CardHeader className="p-8 border-b border-violet-500/10 bg-violet-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-600/20 text-white">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black tracking-tight">Diagnostic Recommendations</CardTitle>
                        <p className="text-muted-foreground text-sm font-medium">Auto-generated study plan based on your recent activity.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    {weakMastery.length > 0 ? weakMastery.map((m, i) => (
                      <motion.div 
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-[2rem] border-2 border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row gap-6 group hover:border-rose-500/40 transition-all"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 text-white group-hover:scale-110 transition-transform">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-lg font-black tracking-tight">Struggling with Concept {m.conceptId}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed font-medium">Your average score is only {Math.round(m.score * 100)}%. We recommend a deep-focus session this Thursday to address gaps.</p>
                          <div className="flex flex-wrap gap-2 pt-3">
                            <Badge className="bg-rose-500/10 text-rose-500 border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">Critical Review</Badge>
                            <Badge className="bg-slate-500/10 text-slate-500 border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">30 Min Session</Badge>
                          </div>
                        </div>
                        <Button className="bg-rose-600 hover:bg-rose-700 h-12 px-6 rounded-xl font-bold shadow-lg shadow-rose-600/20 self-center">
                          Add Session
                        </Button>
                      </motion.div>
                    )) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black tracking-tight">On Track!</h4>
                          <p className="text-muted-foreground font-medium">No critical knowledge gaps detected. Keep up the consistent work!</p>
                        </div>
                      </div>
                    )}

                    <div className="p-6 rounded-[2rem] border-2 border-violet-500/20 bg-violet-500/5 flex flex-col sm:flex-row gap-6 group hover:border-violet-500/40 transition-all">
                      <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/20 text-white">
                        <Target className="w-8 h-8" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-lg font-black tracking-tight">Spaced Repetition: Chemistry</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">It's been 3 days since you reviewed "Covalent Bonds". A quick 15-min practice will boost long-term retention.</p>
                      </div>
                      <Button className="bg-violet-600 hover:bg-violet-700 h-12 px-6 rounded-xl font-bold shadow-lg shadow-violet-600/20 self-center">
                        Schedule Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <Card className="glass-card border-border/40 p-8 space-y-8">
                  <h3 className="text-xl font-black tracking-tighter">Engagement Pulse</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.15em] text-emerald-500 block mb-1">High Mastery</span>
                          <span className="text-lg font-black tracking-tight">Biology Focus</span>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground tracking-tighter">4.2 hrs / week</span>
                      </div>
                      <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden border border-border/20 p-1">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: '65%' }} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.15em] text-blue-500 block mb-1">Standard Load</span>
                          <span className="text-lg font-black tracking-tight">Mathematics</span>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground tracking-tighter">2.5 hrs / week</span>
                      </div>
                      <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden border border-border/20 p-1">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]" style={{ width: '38%' }} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.15em] text-rose-500 block mb-1">Underutilized</span>
                          <span className="text-lg font-black tracking-tight">World History</span>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground tracking-tighter">0.8 hrs / week</span>
                      </div>
                      <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden border border-border/20 p-1">
                        <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)]" style={{ width: '12%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/40">
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                        <Zap className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary">Optimal Session Length</p>
                        <p className="text-sm font-bold tracking-tight mt-0.5">Focus for 45 mins then 10 min break.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CREATE TASK MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card border-border/40 p-0 overflow-hidden">
          <div className="h-2 bg-primary" />
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Schedule Study Block</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">Define your focus area and time for this session.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Session Title</label>
                <Input 
                  placeholder="e.g. Molecular Biology Review" 
                  className="bg-muted/30 border-border/40 h-12 font-bold"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                  <Select value={newTask.subject} onValueChange={v => setNewTask({...newTask, subject: v})}>
                    <SelectTrigger className="bg-muted/30 border-border/40 h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Math">Math</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Computer Science">CS</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Priority</label>
                  <Select value={newTask.priority} onValueChange={v => setNewTask({...newTask, priority: v})}>
                    <SelectTrigger className="bg-muted/30 border-border/40 h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Intensity</SelectItem>
                      <SelectItem value="medium">Medium Focus</SelectItem>
                      <SelectItem value="high">Deep Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Day</label>
                  <Select value={newTask.day} onValueChange={v => setNewTask({...newTask, day: v})}>
                    <SelectTrigger className="bg-muted/30 border-border/40 h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Start Time</label>
                  <Select value={newTask.time} onValueChange={v => setNewTask({...newTask, time: v})}>
                    <SelectTrigger className="bg-muted/30 border-border/40 h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="px-6 font-bold">Cancel</Button>
              <Button 
                className="px-8 bg-primary hover:bg-primary/90 font-black tracking-tight shadow-lg shadow-primary/20 h-12" 
                onClick={handleCreateTask}
                disabled={addTaskMutation.isPending || !newTask.title.trim()}
              >
                {addTaskMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Schedule Session"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
