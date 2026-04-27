import { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  Concept,
  Session,
  Interaction,
  Classroom,
  MasteryScore,
} from "@shared/schema";
import { classroomSocket } from "@/lib/socket";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  Sparkles,
  BookOpen,
  Target,
  Lightbulb,
  Mic,
  MicOff,
  Search,
  Shuffle,
  MessageSquare,
  Layers,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

mermaid.initialize({ startOnLoad: false, theme: "default" });

const MermaidChart = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>("");
  const id = useMemo(
    () => `mermaid-${Math.random().toString(36).substring(7)}`,
    [],
  );

  useEffect(() => {
    mermaid
      .render(id, chart)
      .then((res) => {
        setSvg(res.svg);
      })
      .catch((err) => {
        console.error("Mermaid error:", err);
        setSvg(
          `<div class="text-red-500 text-sm">Failed to render diagram</div>`,
        );
      });
  }, [chart, id]);

  return (
    <div
      className="flex justify-center my-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const VoiceVisualizer = ({ isActive }: { isActive: boolean }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-center gap-1 mb-4 h-12"
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-primary rounded-full"
              animate={{
                height: [
                  "10%",
                  `${Math.random() * 80 + 20}%`,
                  `${Math.random() * 80 + 20}%`,
                  "10%",
                ],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.05,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    if (!inline && match && match[1] === "mermaid") {
      return <MermaidChart chart={String(children).replace(/\n$/, "")} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

interface ScoreResult {
  interaction: Interaction;
  score: number;
  gaps: string[];
  strengths: string[];
  feedback: string;
  misconceptionType: string | null;
  misconceptionDetail: string | null;
  mastery: number;
  bloomLevel?: string | null;
}

const MISCONCEPTION_META: Record<
  string,
  {
    label: string;
    emoji: string;
    color: string;
    bg: string;
    border: string;
    remediation: string;
  }
> = {
  PROCESS_CONFUSION: {
    label: "Process Confusion",
    emoji: "🔄",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    remediation:
      "You may be mixing up two related but distinct processes. Let's compare them side by side.",
  },
  INCOMPLETE_UNDERSTANDING: {
    label: "Partial Understanding",
    emoji: "🧩",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    remediation:
      "You've grasped the core idea but are missing some critical components.",
  },
  OVERGENERALIZATION: {
    label: "Overgeneralization",
    emoji: "🎯",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    remediation:
      "You're applying a rule too broadly — there are important exceptions to consider.",
  },
  CAUSE_EFFECT_REVERSAL: {
    label: "Cause-Effect Reversal",
    emoji: "↔️",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    remediation:
      "You've identified the right concepts but inverted the causal direction.",
  },
  TERMINOLOGY_CONFUSION: {
    label: "Vocabulary Confusion",
    emoji: "📝",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    remediation:
      "Some technical terms are being used interchangeably — let's clarify what each one means.",
  },
  SURFACE_LEVEL: {
    label: "Surface-Level Response",
    emoji: "🏊",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    remediation:
      "Your answer stays at a high level. Try to go deeper into the mechanism or reasoning.",
  },
  NO_MISCONCEPTION: {
    label: "Strong Understanding",
    emoji: "✅",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    remediation: "",
  },
};

const BLOOMS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  REMEMBERING: {
    label: "Remembering",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  UNDERSTANDING: {
    label: "Understanding",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  APPLYING: {
    label: "Applying",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  ANALYZING: {
    label: "Analyzing",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  EVALUATING: {
    label: "Evaluating",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  CREATING: { label: "Creating", color: "text-cyan-500", bg: "bg-cyan-500/10" },
};

export default function LearningInterface() {
  const params = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const qc = useQueryClient();

  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [lastScore, setLastScore] = useState<ScoreResult | null>(null);
  const [explanation, setExplanation] = useState("");
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<
    "intro" | "question" | "responding" | "feedback" | "complete"
  >("intro");

  const [socraticHistory, setSocraticHistory] = useState<
    { role: string; content: string }[]
  >([]);
  const [socraticInput, setSocraticInput] = useState("");
  const [isSocraticActive, setIsSocraticActive] = useState(false);
  const [prerequisiteRedirect, setPrerequisiteRedirect] = useState<
    string | null
  >(null);
  const [isLessonOpen, setIsLessonOpen] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [activeClassroomCode, setActiveClassroomCode] = useState<string | null>(
    null,
  );

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setResponse(
            (prev) =>
              prev + (prev && !prev.endsWith(" ") ? " " : "") + finalTranscript,
          );
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (phase === "feedback" && lastScore && lastScore.score >= 0.8) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#059669", "#f59e0b", "#fbbf24"],
      });
    }
  }, [phase, lastScore]);

  if (!student) {
    setLocation("/");
    return null;
  }

  const sessionId = Number(params.sessionId);

  const { data: session, isLoading: sessionLoading } = useQuery<
    Session & { interactions: Interaction[] }
  >({
    queryKey: [`/api/sessions/${params.sessionId}`],
    queryFn: async () =>
      (await apiRequest("GET", `/api/sessions/${params.sessionId}`)).json(),
  });

  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    enabled: !!student,
    queryFn: async () => (await apiRequest("GET", "/api/classrooms")).json(),
  });

  useEffect(() => {
    if (!student || !classrooms || classrooms.length === 0) {
      setActiveClassroomCode(null);
      return;
    }

    const storedCode = localStorage.getItem("edulens.activeClassroomCode");
    const room = classrooms.some((c) => c.code === storedCode)
      ? (storedCode as string)
      : classrooms[0].code;

    setActiveClassroomCode(room);
    localStorage.setItem("edulens.activeClassroomCode", room);
    classroomSocket.connect(room, student.id, "student");

    return () => classroomSocket.disconnect();
  }, [student, classrooms]);

  const { data: concepts } = useQuery<Concept[]>({
    queryKey: ["/api/concepts", session?.subject],
    enabled: !!session?.subject,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/concepts/${session!.subject}`);
      return res.json();
    },
  });

  // Fetch student mastery for prerequisite-driven pathfinding
  const { data: studentMastery } = useQuery<MasteryScore[]>({
    queryKey: ["/api/students", student.id, "mastery"],
    enabled: !!student,
    queryFn: async () =>
      (await apiRequest("GET", `/api/students/${student.id}/mastery`)).json(),
  });

  const respondMutation = useMutation({
    mutationFn: async (data: {
      conceptId: number;
      studentResponse: string;
      question: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/sessions/${sessionId}/respond`,
        data,
      );
      return res.json() as Promise<ScoreResult>;
    },
    onSuccess: (data) => {
      setLastScore(data);
      setPhase("feedback");
      setPrerequisiteRedirect(null);
      if (data.score >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#a855f7", "#ec4899"],
        });
      }
      // Step 2: Auto-show AI explanation for low scores
      if (data.score < 0.5 && currentConcept && session) {
        explainMutation.mutate({
          conceptName: currentConcept.name,
          subject: session.subject,
          gaps: data.gaps,
        });
      }
      qc.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      qc.invalidateQueries({
        queryKey: ["/api/students", student.id, "mastery"],
      });
      qc.invalidateQueries({
        queryKey: ["/api/students", student.id, "stats"],
      });

      // Emit live update
      if (activeClassroomCode) {
        classroomSocket.send({
          type: "student_update",
          room: activeClassroomCode,
          data: {
            name: student?.name,
            score: data.score,
            concept: currentConcept?.name,
            misconception: data.misconceptionType,
            feedback: data.feedback,
            bloomLevel: data.bloomLevel,
          },
        });
      }
    },
  });

  const explainMutation = useMutation({
    mutationFn: async (data: {
      conceptName: string;
      subject: string;
      gaps?: string[];
    }) => {
      const res = await apiRequest("POST", "/api/ai/explain", data);
      return res.json();
    },
    onSuccess: (data) => setExplanation(data.explanation),
  });

  const socraticMutation = useMutation({
    mutationFn: async (data: {
      history: any[];
      conceptName: string;
      misconception: string;
    }) => {
      const res = await apiRequest("POST", "/api/ai/socratic", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSocraticHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    },
  });

  const handleStartSocratic = () => {
    if (!currentConcept || !lastScore?.misconceptionType) return;
    setIsSocraticActive(true);
    setSocraticHistory([]);
    socraticMutation.mutate({
      history: [],
      conceptName: currentConcept.name,
      misconception:
        MISCONCEPTION_META[lastScore.misconceptionType]?.label ||
        "Misconception",
    });

    // Notify teacher
    if (activeClassroomCode) {
      classroomSocket.send({
        type: "student_update",
        room: activeClassroomCode,
        data: {
          name: student?.name,
          score: lastScore.score,
          concept: currentConcept?.name,
          misconception: lastScore.misconceptionType,
          isSocraticActive: true,
        },
      });
    }
  };

  const handleSocraticSubmit = () => {
    if (
      !socraticInput.trim() ||
      !currentConcept ||
      !lastScore?.misconceptionType
    )
      return;
    const newHistory = [
      ...socraticHistory,
      { role: "user", content: socraticInput },
    ];
    setSocraticHistory(newHistory);
    setSocraticInput("");
    socraticMutation.mutate({
      history: newHistory,
      conceptName: currentConcept.name,
      misconception:
        MISCONCEPTION_META[lastScore.misconceptionType]?.label ||
        "Misconception",
    });

    // Update teacher
    if (activeClassroomCode) {
      classroomSocket.send({
        type: "student_update",
        room: activeClassroomCode,
        data: {
          name: student?.name,
          score: lastScore.score,
          concept: currentConcept?.name,
          misconception: lastScore.misconceptionType,
          isSocraticActive: true,
          socraticMessage: socraticInput,
        },
      });
    }
  };

  const questionMutation = useMutation({
    mutationFn: async (data: {
      conceptName: string;
      subject: string;
      difficulty?: string;
    }) => {
      const res = await apiRequest("POST", "/api/ai/question", data);
      return res.json();
    },
    onSuccess: (data) => {
      setQuestion(data.question);
      setPhase("question");
    },
    onError: (error: Error) => {
      console.error("Question generation failed:", error);
      setQuestion("Explain the key concepts of this topic in your own words.");
      setPhase("question");
    },
  });

  const currentConcept = concepts?.[currentConceptIndex];
  const totalConcepts = concepts?.length || 0;
  const progressPercent =
    totalConcepts > 0 ? (currentConceptIndex / totalConcepts) * 100 : 0;

  const handleGetQuestion = () => {
    if (!currentConcept || !session) return;
    const difficulty =
      lastScore && lastScore.score < 0.5
        ? "easy"
        : lastScore && lastScore.score > 0.8
          ? "hard"
          : "medium";
    questionMutation.mutate({
      conceptName: currentConcept.name,
      subject: session.subject,
      difficulty,
    });
  };

  const handleStartConcept = () => {
    if (!currentConcept || !session) return;
    handleGetQuestion();
  };

  const handleSubmitResponse = () => {
    if (!currentConcept || !response.trim()) return;
    respondMutation.mutate({
      conceptId: currentConcept.id,
      studentResponse: response,
      question,
    });
  };

  const resetConceptState = () => {
    setPhase("intro");
    setResponse("");
    setLastScore(null);
    setExplanation("");
    setQuestion("");
    setIsSocraticActive(false);
    setSocraticHistory([]);
    setPrerequisiteRedirect(null);
  };

  const handleNext = () => {
    if (currentConceptIndex < totalConcepts - 1) {
      // Step 1: Prerequisite-Driven Adaptive Pathfinding
      // If score was low, check if a prerequisite needs attention first
      if (
        lastScore &&
        lastScore.score < 0.4 &&
        currentConcept &&
        concepts &&
        studentMastery
      ) {
        try {
          const prereqs: string[] = JSON.parse(
            currentConcept.prerequisites || "[]",
          );
          if (prereqs.length > 0) {
            // Find prerequisite concepts that have weak mastery
            for (const prereqName of prereqs) {
              const prereqConcept = concepts.find((c) => c.name === prereqName);
              if (prereqConcept) {
                const prereqMastery = studentMastery.find(
                  (m) => m.conceptId === prereqConcept.id,
                );
                // If prerequisite mastery is low (< 0.5) or never attempted, redirect
                if (!prereqMastery || prereqMastery.score < 0.5) {
                  const prereqIndex = concepts.findIndex(
                    (c) => c.name === prereqName,
                  );
                  if (prereqIndex >= 0 && prereqIndex !== currentConceptIndex) {
                    setPrerequisiteRedirect(prereqName);
                    setCurrentConceptIndex(prereqIndex);
                    resetConceptState();
                    return;
                  }
                }
              }
            }
          }
        } catch (e) {
          // If prereq parsing fails, fall through to normal retry
        }
        // No weak prerequisite found — retry same concept
        resetConceptState();
        return;
      }
      setCurrentConceptIndex((prev) => prev + 1);
      resetConceptState();
    } else {
      setPhase("complete");
      apiRequest("POST", `/api/sessions/${sessionId}/end`);
    }
  };

  // Step 3: "I Don't Know" handler
  const handleIDontKnow = async () => {
    if (!currentConcept) return;
    // Log a 0.0 score interaction so we track the gap
    await respondMutation.mutateAsync({
      conceptId: currentConcept.id,
      studentResponse: "[Student indicated they don't know the answer]",
      question: question || "Explain this concept",
    });
  };

  const handleRetry = () => {
    setResponse("");
    setLastScore(null);
    setPhase("question");
    setIsSocraticActive(false);
    setSocraticHistory([]);
    // Optionally get a new question
    if (currentConcept && session) {
      questionMutation.mutate({
        conceptName: currentConcept.name,
        subject: session.subject,
        difficulty: "easy",
      });
    }
  };

  const getExplanation = () => {
    if (!currentConcept || !session) return;
    explainMutation.mutate({
      conceptName: currentConcept.name,
      subject: session.subject,
      gaps: lastScore?.gaps,
    });
  };

  const scoreColor = (score: number) => {
    if (score >= 0.7) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 0.4) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const scoreBg = (score: number) => {
    if (score >= 0.7) return "bg-emerald-500";
    if (score >= 0.4) return "bg-amber-500";
    return "bg-rose-500";
  };

  const scoreIcon = (score: number) => {
    if (score >= 0.7)
      return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    if (score >= 0.4)
      return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    return <XCircle className="w-6 h-6 text-rose-500" />;
  };

  if (!session || !concepts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Session complete
  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-border/60">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Session Complete!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Great job studying {session.subject}! You covered {totalConcepts}{" "}
              concepts.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setLocation("/subjects")}
                data-testid="button-new-session"
              >
                New Session
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-view-progress"
              >
                View Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/60 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {session.subject}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentConceptIndex + 1} of {totalConcepts}
                </span>
                {activeClassroomCode && (
                  <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Live Feed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/graph")}
            data-testid="button-view-graph"
          >
            <Brain className="w-4 h-4 mr-1" /> Graph
          </Button>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-2">
          <Progress
            value={progressPercent}
            className="h-1.5"
            data-testid="progress-session"
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {currentConcept && (
          <>
            {/* Prerequisite Redirect Banner */}
            {prerequisiteRedirect && phase === "intro" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2"
              >
                <Card className="border border-amber-500/30 bg-amber-500/5">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        Adaptive Redirect
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You're struggling with a concept that builds on{" "}
                        <strong className="text-foreground">
                          {prerequisiteRedirect}
                        </strong>
                        . Let's strengthen that foundation first.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Concept Introduction */}
            {phase === "intro" && (
              <Card
                className="border border-border/60"
                data-testid="card-concept-intro"
              >
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">
                        {currentConcept.name}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1 mb-4">
                        {currentConcept.description}
                      </p>

                      <Collapsible
                        open={isLessonOpen}
                        onOpenChange={setIsLessonOpen}
                        className="mb-4"
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center justify-between py-2 px-3 h-auto bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg group transition-all"
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                              <BookOpen className="w-4 h-4" />
                              {isLessonOpen
                                ? "Hide Mini-Lesson"
                                : "Review Mini-Lesson"}
                            </span>
                            {isLessonOpen ? (
                              <ChevronUp className="w-4 h-4 text-primary" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-primary" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="bg-primary/5 border-x border-b border-primary/20 rounded-b-lg p-5 prose dark:prose-invert prose-sm max-w-none text-left">
                            <ReactMarkdown components={markdownComponents}>
                              {currentConcept.idealExplanation}
                            </ReactMarkdown>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                  {(() => {
                    let prereqs: string[] = [];
                    try {
                      prereqs = JSON.parse(currentConcept.prerequisites);
                    } catch (e) {}
                    if (prereqs.length === 0) return null;
                    return (
                      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                        <Target className="w-4 h-4" />
                        Prerequisites: {prereqs.join(", ")}
                      </div>
                    );
                  })()}
                  <Button
                    onClick={handleStartConcept}
                    className="w-full"
                    data-testid="button-start-concept"
                  >
                    {questionMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Generating question...
                      </>
                    ) : (
                      <>
                        Ready to Practice{" "}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Question & Response */}
            {(phase === "question" || phase === "responding") && (
              <Card
                className="border border-border/60"
                data-testid="card-question"
              >
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {currentConcept.name}
                      </h3>
                      <div
                        className="text-sm prose prose-sm dark:prose-invert max-w-none"
                        data-testid="text-question"
                      >
                        <ReactMarkdown components={markdownComponents}>
                          {question ||
                            `Explain the key concepts of ${currentConcept.name} in your own words.`}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <VoiceVisualizer isActive={isRecording} />
                    <Textarea
                      placeholder="Type your explanation here... Be as detailed as you can!"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={5}
                      className={`resize-none transition-all duration-300 ${isRecording ? "border-primary shadow-lg shadow-primary/20" : ""}`}
                      disabled={respondMutation.isPending}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-2">
                        {isRecording && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                        {response.length > 0
                          ? `${response.split(/\s+/).filter(Boolean).length} words`
                          : isRecording
                            ? "Listening..."
                            : "Start typing or speaking..."}
                      </span>
                      <div className="flex gap-2">
                        <div className="relative">
                          <AnimatePresence>
                            {isRecording && (
                              <motion.div
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 rounded-md bg-red-500 z-0"
                              />
                            )}
                          </AnimatePresence>
                          <Button
                            variant={isRecording ? "destructive" : "secondary"}
                            onClick={toggleRecording}
                            title={
                              isRecording ? "Stop recording" : "Start recording"
                            }
                            className="relative z-10"
                          >
                            {isRecording ? (
                              <>
                                <MicOff className="w-4 h-4 mr-2" /> Stop
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4 mr-2" /> Speak
                              </>
                            )}
                          </Button>
                        </div>
                        <Button
                          data-testid="button-submit-response"
                          onClick={handleSubmitResponse}
                          disabled={
                            !response.trim() ||
                            respondMutation.isPending ||
                            isRecording
                          }
                        >
                          {respondMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                              Scoring...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" /> Submit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {/* Step 3: "I Don't Know" button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-muted-foreground hover:text-foreground"
                      onClick={handleIDontKnow}
                      disabled={respondMutation.isPending}
                      data-testid="button-i-dont-know"
                    >
                      <HelpCircle className="w-4 h-4 mr-1" /> I'm stuck — show
                      me the explanation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {phase === "feedback" && lastScore && (
              <div className="space-y-4">
                {/* Score Card */}
                <Card
                  className="border border-border/60"
                  data-testid="card-score"
                >
                  <CardContent className="pt-6 pb-5">
                    <div className="flex items-center gap-4 mb-4">
                      {scoreIcon(lastScore.score)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-2xl font-bold ${scoreColor(lastScore.score)}`}
                            data-testid="text-score"
                          >
                            {Math.round(lastScore.score * 100)}%
                          </span>
                          <span className="text-sm text-muted-foreground">
                            understanding
                          </span>
                          {lastScore.bloomLevel &&
                            BLOOMS_META[
                              lastScore.bloomLevel.trim().toUpperCase()
                            ] && (
                              <Badge
                                className={`ml-auto ${BLOOMS_META[lastScore.bloomLevel.trim().toUpperCase()].bg} ${BLOOMS_META[lastScore.bloomLevel.trim().toUpperCase()].color} border-none text-[10px] uppercase font-black tracking-widest`}
                              >
                                {
                                  BLOOMS_META[
                                    lastScore.bloomLevel.trim().toUpperCase()
                                  ].label
                                }
                              </Badge>
                            )}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lastScore.score * 100}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className={`h-full rounded-full ${scoreBg(lastScore.score)}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="text-sm mb-4 prose prose-sm dark:prose-invert max-w-none"
                      data-testid="text-feedback"
                    >
                      <ReactMarkdown components={markdownComponents}>
                        {lastScore.feedback}
                      </ReactMarkdown>
                    </div>

                    {/* Misconception Diagnostic Card */}
                    {lastScore.misconceptionType &&
                      lastScore.misconceptionType !== "NO_MISCONCEPTION" &&
                      (() => {
                        const mc =
                          MISCONCEPTION_META[lastScore.misconceptionType] ||
                          MISCONCEPTION_META.INCOMPLETE_UNDERSTANDING;
                        return (
                          <div
                            className={`rounded-xl border ${mc.border} ${mc.bg} p-4 mb-4`}
                            data-testid="card-misconception"
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl leading-none mt-0.5">
                                {mc.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs font-bold uppercase tracking-wider ${mc.color}`}
                                  >
                                    Misconception Detected
                                  </span>
                                </div>
                                <h4 className={`font-bold text-sm ${mc.color}`}>
                                  {mc.label}
                                </h4>
                                {lastScore.misconceptionDetail && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {lastScore.misconceptionDetail}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  💡 {mc.remediation}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    {lastScore.misconceptionType === "NO_MISCONCEPTION" && (
                      <div
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-4 flex items-center gap-3"
                        data-testid="card-no-misconception"
                      >
                        <span className="text-xl">✅</span>
                        <div>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            No Misconceptions Detected
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Your response demonstrates accurate conceptual
                            understanding.
                          </p>
                        </div>
                      </div>
                    )}

                    {lastScore.strengths.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 mb-1.5">
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {lastScore.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="text-sm flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lastScore.gaps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400 mb-1.5">
                          Areas to Improve
                        </h4>
                        <ul className="space-y-1">
                          {lastScore.gaps.map((g, i) => (
                            <li
                              key={i}
                              className="text-sm flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Explanation — auto-triggered for low scores, manual button otherwise */}
                {!explanation && (!lastScore || lastScore.score >= 0.5) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={getExplanation}
                    disabled={explainMutation.isPending}
                    data-testid="button-get-explanation"
                  >
                    {explainMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" /> Get AI Explanation
                      </>
                    )}
                  </Button>
                )}
                {!explanation &&
                  lastScore &&
                  lastScore.score < 0.5 &&
                  explainMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />{" "}
                      Auto-generating explanation for you...
                    </div>
                  )}

                {explanation && (
                  <Card
                    className="border border-primary/20 bg-primary/5"
                    data-testid="card-explanation"
                  >
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm">
                          AI Explanation
                        </h4>
                      </div>
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown components={markdownComponents}>
                          {explanation}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Socratic Chat UI */}
                {isSocraticActive && (
                  <Card
                    className="border border-blue-500/30 bg-blue-500/5 mb-4"
                    data-testid="card-socratic"
                  >
                    <CardContent className="pt-5 pb-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                          Socratic Tutor
                        </h4>
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {socraticHistory.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`prose prose-sm dark:prose-invert max-w-none max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-blue-100 dark:bg-blue-900/40 text-foreground"}`}
                            >
                              <ReactMarkdown components={markdownComponents}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                        {socraticMutation.isPending && (
                          <div className="flex justify-start">
                            <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/40 flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />{" "}
                              <span className="text-muted-foreground text-xs italic">
                                Tutor is typing...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Textarea
                          value={socraticInput}
                          onChange={(e) => setSocraticInput(e.target.value)}
                          placeholder="Reply to the tutor..."
                          rows={2}
                          className="resize-none min-h-[60px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSocraticSubmit();
                            }
                          }}
                        />
                        <Button
                          onClick={handleSocraticSubmit}
                          disabled={
                            !socraticInput.trim() || socraticMutation.isPending
                          }
                          className="h-auto"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* Step 11: Socratic exit button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground hover:text-foreground w-full"
                        onClick={() => setIsSocraticActive(false)}
                      >
                        <X className="w-3 h-3 mr-1" /> Close Tutor
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {lastScore.score < 0.7 &&
                    !isSocraticActive &&
                    lastScore.misconceptionType &&
                    lastScore.misconceptionType !== "NO_MISCONCEPTION" && (
                      <Button
                        variant="default"
                        onClick={handleStartSocratic}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none"
                        data-testid="button-socratic"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" /> Start
                        Socratic Review
                      </Button>
                    )}
                  {lastScore.score < 0.6 && (
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="flex-1"
                      data-testid="button-retry"
                    >
                      Try a Simpler Question
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                    data-testid="button-next"
                  >
                    {currentConceptIndex < totalConcepts - 1 ? (
                      lastScore.score < 0.4 ? (
                        <>
                          Review Again <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Next Concept <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )
                    ) : (
                      <>
                        Complete Session{" "}
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="border-border/60 bg-card/90 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> End Session?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to exit this learning session? Your progress
              on mastered concepts will be saved, but you'll lose the current
              momentum.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background/50">
              Keep Learning
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setLocation("/subjects")}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Exit Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
