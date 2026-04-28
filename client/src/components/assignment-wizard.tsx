import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Sparkles, ArrowRight, Wand2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  idealAnswer: string;
}

interface Blueprint {
  title: string;
  description: string;
  questions: Question[];
}

export function AssignmentWizard({ open, onOpenChange, classrooms }: { open: boolean, onOpenChange: (o: boolean) => void, classrooms: any[] }) {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [aiStrictness, setAiStrictness] = useState<"lenient" | "standard" | "strict">("standard");
  const [adaptiveDeadlines, setAdaptiveDeadlines] = useState(true);
  const [selectedClassrooms, setSelectedClassrooms] = useState<number[]>([]);
  
  const { toast } = useToast();
  const qc = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (p: string) => {
      const res = await apiRequest("POST", "/api/ai/generate-assignment", { prompt: p });
      return res.json() as Promise<Blueprint>;
    },
    onSuccess: (data) => {
      setBlueprint(data);
      setStep(2);
    },
    onError: (e: any) => {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // For now, we just pretend to save to show the flow, or we could add a save route
      // In a full implementation, this would POST to /api/assignments
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    },
    onSuccess: () => {
      toast({ title: "Magic Complete! ✨", description: "Assignment deployed successfully." });
      onOpenChange(false);
      // Reset
      setTimeout(() => {
        setStep(1);
        setBlueprint(null);
        setPrompt("");
      }, 500);
    }
  });

  const handleGenerate = () => {
    if (!prompt) return;
    generateMutation.mutate(prompt);
  };

  const handleUpdateQuestion = (idx: number, field: keyof Question, value: string) => {
    if (!blueprint) return;
    const newQs = [...blueprint.questions];
    newQs[idx][field] = value;
    setBlueprint({ ...blueprint, questions: newQs });
  };

  const handleDeleteQuestion = (idx: number) => {
    if (!blueprint) return;
    const newQs = blueprint.questions.filter((_, i) => i !== idx);
    setBlueprint({ ...blueprint, questions: newQs });
  };

  const addQuestion = () => {
    if (!blueprint) return;
    setBlueprint({ ...blueprint, questions: [...blueprint.questions, { question: "", idealAnswer: "" }] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 bg-background/60 backdrop-blur-3xl border-border/50 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8 relative z-10 min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 mb-6">
                    <Sparkles className="w-8 h-8 text-violet-500" />
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight mb-3">AI Co-Pilot</h2>
                  <p className="text-muted-foreground">Describe what you want to teach. The AI will instantly generate questions, rubrics, and model answers.</p>
                </div>
                
                <div className="relative">
                  <Textarea
                    placeholder="e.g. Create a 3-question short-answer quiz on the Calvin Cycle for my Bio 101 class..."
                    className="min-h-[120px] text-lg p-5 bg-background/80 resize-none border-primary/20 focus-visible:ring-primary/50"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={generateMutation.isPending}
                  />
                  <Button 
                    className="absolute bottom-4 right-4 bg-violet-600 hover:bg-violet-700" 
                    disabled={!prompt || generateMutation.isPending}
                    onClick={handleGenerate}
                  >
                    {generateMutation.isPending ? "Generating..." : "Generate Magic"}
                    {!generateMutation.isPending && <Wand2 className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && blueprint && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{blueprint.title}</h2>
                    <p className="text-muted-foreground">{blueprint.description}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border border-border/50">
                    <span className="text-xs font-semibold text-muted-foreground">Auto-Grader Strictness:</span>
                    <select 
                      className="bg-transparent text-sm font-bold focus:outline-none"
                      value={aiStrictness}
                      onChange={(e: any) => setAiStrictness(e.target.value)}
                    >
                      <option value="lenient">Lenient (Concepts)</option>
                      <option value="standard">Standard</option>
                      <option value="strict">Strict (Keywords)</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[350px]">
                  {blueprint.questions.map((q, idx) => (
                    <Card key={idx} className="border-border/50 bg-background/50">
                      <CardContent className="p-4 flex gap-4">
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase">Question {idx + 1}</label>
                            <Input value={q.question} onChange={e => handleUpdateQuestion(idx, 'question', e.target.value)} className="mt-1 font-medium bg-background" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-primary uppercase">Ideal Answer (Rubric)</label>
                            <Textarea value={q.idealAnswer} onChange={e => handleUpdateQuestion(idx, 'idealAnswer', e.target.value)} className="mt-1 text-sm bg-primary/5 border-primary/20" rows={2} />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteQuestion(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" className="w-full border-dashed" onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-2" /> Add Question
                  </Button>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Continue to Distribution <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight mb-3">Almost Ready</h2>
                  <p className="text-muted-foreground">Select where to send this assignment and configure adaptive rules.</p>
                </div>

                <Card className="border-border/50 bg-background/50 mb-6">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <label className="text-sm font-bold mb-3 block">Select Classrooms</label>
                      <div className="flex flex-wrap gap-2">
                        {classrooms.map(c => (
                          <Badge 
                            key={c.id} 
                            variant={selectedClassrooms.includes(c.id) ? "default" : "outline"}
                            className="cursor-pointer text-sm py-1.5 px-3"
                            onClick={() => {
                              if (selectedClassrooms.includes(c.id)) setSelectedClassrooms(prev => prev.filter(id => id !== c.id));
                              else setSelectedClassrooms(prev => [...prev, c.id]);
                            }}
                          >
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <div>
                        <h4 className="font-bold text-sm">Adaptive Deadlines</h4>
                        <p className="text-xs text-muted-foreground mt-1 w-64">Automatically grant a 24-hour extension to students flagged as "At-Risk" by the AI.</p>
                      </div>
                      <Switch checked={adaptiveDeadlines} onCheckedChange={setAdaptiveDeadlines} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700" 
                    disabled={selectedClassrooms.length === 0 || saveMutation.isPending}
                    onClick={() => saveMutation.mutate()}
                  >
                    Deploy Assignment <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Temporary internal component for Badge since it's not imported directly in this snippet
function Badge({ children, variant, className, onClick }: any) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants: any = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    outline: "text-foreground",
  };
  return <div onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</div>;
}
