import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Brain,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  Trash2,
  Calendar,
  Target,
  Zap,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

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
    time: "06:00 PM",
  });

  const { data: tasks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/scheduler/tasks"],
    queryFn: async () =>
      (await apiRequest("GET", "/api/scheduler/tasks")).json(),
  });

  const { data: mastery } = useQuery<any[]>({
    queryKey: [`/api/students/${student?.id}/mastery`],
    queryFn: async () =>
      (await apiRequest("GET", `/api/students/${student?.id}/mastery`)).json(),
    enabled: !!student,
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scheduler/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scheduler/tasks"] });
      setIsModalOpen(false);
      setNewTask({
        title: "",
        subject: "General",
        type: "Focus",
        priority: "medium",
        day: "Monday",
        time: "06:00 PM",
      });
      toast({
        title: "Task Scheduled!",
        description: "Your study session has been added to your calendar.",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scheduler/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scheduler/tasks"] });
      toast({
        title: "Task Removed",
        description: "The study block has been deleted from your schedule.",
      });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const task = tasks?.find((t) => t.id === id);
      await apiRequest("PATCH", `/api/scheduler/tasks/${id}`, {
        completed: !task?.completed,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/scheduler/tasks"] });
      toast({ title: "Status Updated", description: "Task progress saved!" });
    },
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const timeSlots = [
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
    "09:00 PM",
  ];

  const scheduleData: Record<string, Record<string, any>> = {};
  tasks?.forEach((task) => {
    const date = new Date(task.startTime);
    const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const day = days[dayIdx];
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (!scheduleData[day]) scheduleData[day] = {};
    scheduleData[day][time] = task;
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const dayIdx = days.indexOf(newTask.day);
    const targetDate = new Date();
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
      endTime: new Date(targetDate.getTime() + 60 * 60 * 1000).toISOString(),
      type: newTask.type,
      priority: newTask.priority,
    });
  };

  const completedCount = tasks?.filter((t) => t.completed).length || 0;
  const totalCount = tasks?.length || 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/subjects")}
              className="mb-4 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Learning
            </Button>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent font-display">
              Study <span className="text-emerald-500">Planner</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Design your learning rhythm. Track your progress. Master your
              subjects at your pace.
            </p>
          </div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-[2rem] border-border/40 flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Completed Today
              </p>
              <p className="text-3xl font-black text-emerald-500">
                {completedCount}/{totalCount}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-12">
          {["weekly", "ai-plan"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                activeTab === tab
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-card/50 text-muted-foreground hover:bg-card border border-border/40"
              }`}
            >
              {tab === "weekly"
                ? "📅 Weekly Schedule"
                : "🤖 AI Recommendations"}
            </button>
          ))}
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-6 py-3 h-14 rounded-2xl font-bold text-base ml-auto"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" /> Add Study Block
          </Button>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === "weekly" ? (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Weekly Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {days.map((day, dayIdx) => (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: dayIdx * 0.05 }}
                  >
                    <Card className="glass-card border-border/40 overflow-hidden hover:border-emerald-500/40 transition-all group h-full">
                      <CardHeader className="bg-gradient-to-br from-emerald-500/5 to-transparent pb-4 border-b border-border/40">
                        <CardTitle className="text-lg font-bold group-hover:text-emerald-500 transition-colors">
                          {day}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-3">
                        {timeSlots.map((time) => {
                          const task = scheduleData[day]?.[time];
                          return (
                            <motion.div
                              key={`${day}-${time}`}
                              layout
                              className={`relative group/slot transition-all ${task ? "" : "h-20 bg-muted/20 rounded-xl border border-dashed border-border/40"}`}
                            >
                              {task ? (
                                <div
                                  className={`p-4 rounded-xl border-l-4 transition-all group-hover/slot:shadow-lg group-hover/slot:scale-105 origin-left ${
                                    task.completed
                                      ? "bg-muted/30 border-l-emerald-500 opacity-60"
                                      : priorityColors[task.priority] +
                                        " bg-gradient-to-r from-transparent"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm truncate">
                                        {task.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {time}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() =>
                                          completeTaskMutation.mutate(task.id)
                                        }
                                        className="p-1 hover:bg-white/10 rounded opacity-0 group-hover/slot:opacity-100 transition-all"
                                      >
                                        <CheckCircle2
                                          className={`w-4 h-4 ${task.completed ? "text-emerald-500" : "text-muted-foreground"}`}
                                        />
                                      </button>
                                      <button
                                        onClick={() =>
                                          deleteTaskMutation.mutate(task.id)
                                        }
                                        className="p-1 hover:bg-red-500/10 rounded opacity-0 group-hover/slot:opacity-100 transition-all"
                                      >
                                        <X className="w-4 h-4 text-red-500" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover/slot:opacity-100 transition-all flex items-center justify-center group-hover/slot:bg-emerald-500/5 cursor-not-allowed">
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Available
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Tasks Summary */}
              {tasks && tasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-8 rounded-[2.5rem] border-border/40 space-y-6"
                >
                  <h3 className="text-2xl font-bold font-display">
                    Upcoming Tasks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks?.slice(0, 6).map((task, idx) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-xl border ${
                          task.completed
                            ? "bg-muted/20 border-border/40"
                            : "bg-gradient-to-r from-emerald-500/10 border-emerald-500/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={`font-bold text-sm ${task.completed ? "line-through opacity-60" : ""}`}
                            >
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.subject}
                            </p>
                          </div>
                          <Badge
                            className={`shrink-0 ml-2 ${priorityColors[task.priority]}`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="ai-plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-12 rounded-[2.5rem] border-border/40 text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <Brain className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display mb-2">
                  AI Study Recommendations
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Based on your mastery levels and learning patterns, we'll
                  recommend personalized study schedules to optimize your
                  learning outcomes.
                </p>
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 h-12 rounded-2xl font-bold"
                disabled
              >
                <Sparkles className="w-4 h-4 mr-2" /> Coming Soon
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Task Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-card max-w-2xl border-border/40">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              Schedule Study Block
            </DialogTitle>
            <DialogDescription>
              Plan your next learning session and watch your mastery grow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Task Title
              </label>
              <Input
                placeholder="e.g., Review Calculus Chapter 5"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="h-12 bg-muted/20 border-border/40 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Subject
                </label>
                <Select
                  value={newTask.subject}
                  onValueChange={(val) =>
                    setNewTask({ ...newTask, subject: val })
                  }
                >
                  <SelectTrigger className="h-12 bg-muted/20 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Math", "Science", "History", "English", "General"].map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Type
                </label>
                <Select
                  value={newTask.type}
                  onValueChange={(val) => setNewTask({ ...newTask, type: val })}
                >
                  <SelectTrigger className="h-12 bg-muted/20 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Focus", "Review", "Challenge"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Priority
                </label>
                <Select
                  value={newTask.priority}
                  onValueChange={(val) =>
                    setNewTask({ ...newTask, priority: val })
                  }
                >
                  <SelectTrigger className="h-12 bg-muted/20 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Day
                </label>
                <Select
                  value={newTask.day}
                  onValueChange={(val) => setNewTask({ ...newTask, day: val })}
                >
                  <SelectTrigger className="h-12 bg-muted/20 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Time
                </label>
                <Select
                  value={newTask.time}
                  onValueChange={(val) => setNewTask({ ...newTask, time: val })}
                >
                  <SelectTrigger className="h-12 bg-muted/20 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 px-8 font-bold"
              onClick={handleCreateTask}
              disabled={addTaskMutation.isPending}
            >
              {addTaskMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Schedule Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
