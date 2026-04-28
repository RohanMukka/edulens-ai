import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Brain, Loader2
} from "lucide-react";



export default function SpeedGrader() {
  const { id } = useParams(); // Assignment ID
  const [, setLocation] = useLocation();
  const { student: teacher } = useAuth();
  const { toast } = useToast();
  
  const qc = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { data, isLoading } = useQuery({
    queryKey: ["/api/assignments", id, "submissions"],
    queryFn: async () => (await apiRequest("GET", `/api/assignments/${id}/submissions`)).json(),
    enabled: !!id
  });

  const submissions = data?.submissions || [];
  const assignmentData = data?.assignment;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentSubmission = submissions[currentIndex];
  
  // Local state for the current student's grading
  const [finalScore, setFinalScore] = useState<number | "">("");
  const [finalFeedback, setFinalFeedback] = useState("");
  const [evaluatingIndex, setEvaluatingIndex] = useState<number | null>(null);

  const gradeMutation = useMutation({
    mutationFn: async (data: { rubric: string; question: string; studentResponse: string; answerIndex: number }) => {
      const res = await apiRequest("POST", "/api/ai/grade", data);
      const json = await res.json();
      return { ...json, answerIndex: data.answerIndex };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/assignments", id, "submissions"] });
      setEvaluatingIndex(null);
      toast({ title: "Re-graded successfully", description: "AI has updated its assessment based on the engine." });
    },
    onError: (error: any) => {
      setEvaluatingIndex(null);
      toast({ title: "Engine Error", description: error.message, variant: "destructive" });
    }
  });

  const suggestedTotal = currentSubmission 
    ? Math.round((currentSubmission.answers.reduce((acc: number, ans: any) => acc + (ans.aiScore || 0), 0) / currentSubmission.answers.length) * 100)
    : 0;

  const handleAcceptAI = () => {
    setFinalScore(suggestedTotal);
    setFinalFeedback(`AI Pre-Assessment Summary:\n${currentSubmission.answers.map((a: any, i: number) => `Q${i+1}: ${a.aiFeedback}`).join("\n")}\n\nGreat effort!`);
  };

  const handleSaveNext = async () => {
    if (finalScore === "") {
      toast({ title: "Score required", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    // Simulation for demo: in reality, we'd have a PATCH /api/assignments/:id/submissions/:subId
    await new Promise(r => setTimeout(r, 600));
    
    qc.invalidateQueries({ queryKey: ["/api/assignments", id, "submissions"] });
    toast({ title: "Grade Saved", description: `Graded ${currentSubmission.studentName}.` });
    setIsSubmitting(false);
    
    // Move to next
    if (currentIndex < submissions.length - 1) {
      setCurrentIndex(curr => curr + 1);
      setFinalScore("");
      setFinalFeedback("");
    } else {
      toast({ title: "All caught up!", description: "You have graded all submissions.", variant: "default" });
      setLocation("/teacher");
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!currentSubmission) return (
    <div className="flex flex-col h-screen items-center justify-center bg-background gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold">No Pending Submissions</h2>
      <p className="text-muted-foreground">There are no ungraded submissions for this assignment.</p>
      <Button variant="outline" onClick={() => setLocation("/teacher")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/teacher")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm">{assignmentData?.title || "Assignment"}</h1>
            <p className="text-xs text-muted-foreground">SpeedGrader™ Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            disabled={currentIndex === 0} 
            onClick={() => { setCurrentIndex(c => c - 1); setFinalScore(""); setFinalFeedback(""); }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-semibold whitespace-nowrap min-w-[120px] text-center">
            {currentSubmission.studentName} <span className="text-muted-foreground font-normal">({currentIndex + 1} of {submissions.length})</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={currentIndex === submissions.length - 1} 
            onClick={() => { setCurrentIndex(c => c + 1); setFinalScore(""); setFinalFeedback(""); }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Student Answers */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentSubmission.answers.map((ans: any, idx: number) => (
            <Card key={idx} className="border-border/50 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                    Q{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{ans.question}</p>
                    <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2 py-1 italic mb-3">Ideal: {ans.idealAnswer}</p>
                    <div className="bg-background border rounded-lg p-3 text-sm">
                      {ans.studentAnswer}
                    </div>
                  </div>
                </div>

                {/* AI Assessment Box */}
                <div className="ml-12 mt-4 bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">AI Pre-Grade</span>
                      <span className="text-xs font-black bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-full">{Math.round(ans.aiScore * 100)}% Match</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[10px] ml-2 text-violet-600 hover:text-violet-700 hover:bg-violet-500/10"
                        onClick={() => {
                          setEvaluatingIndex(idx);
                          gradeMutation.mutate({
                            rubric: ans.idealAnswer,
                            question: ans.question,
                            studentResponse: ans.studentAnswer,
                            answerIndex: idx
                          });
                        }}
                        disabled={evaluatingIndex === idx}
                      >
                        {evaluatingIndex === idx ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        {evaluatingIndex === idx ? "Engine Running..." : "Live Grade"}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{ans.aiFeedback}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Grading Sidebar */}
        <div className="w-80 shrink-0 border-l border-border/40 bg-muted/10 p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-1">Final Assessment</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Status: 
              <Badge variant={currentSubmission.status === "graded" ? "default" : "secondary"} className="text-[10px] uppercase">
                {currentSubmission.status}
              </Badge>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            {/* AI Suggestion */}
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">AI Suggested Total</p>
              <p className="text-4xl font-black text-violet-600">{suggestedTotal}<span className="text-lg text-violet-600/50">/100</span></p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4 bg-background border-violet-500/30 hover:bg-violet-500 hover:text-white transition-all text-violet-600"
                onClick={handleAcceptAI}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Auto-Fill Rubric
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Final Score</label>
              <Input 
                type="number" 
                placeholder="e.g. 85" 
                className="text-lg font-bold h-12 bg-background border-2 focus-visible:ring-primary/20"
                value={finalScore}
                onChange={e => setFinalScore(e.target.value ? Number(e.target.value) : "")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Teacher Feedback</label>
              <Textarea 
                placeholder="Great job on..." 
                className="min-h-[150px] resize-none bg-background text-sm leading-relaxed"
                value={finalFeedback}
                onChange={e => setFinalFeedback(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 mt-auto">
            <Button 
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90" 
              onClick={handleSaveNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit & Next Student"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
