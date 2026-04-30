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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { TutorialOverlay } from "@/components/tutorial-overlay";
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
  Quote,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

mermaid.initialize({ startOnLoad: false, theme: "default", suppressErrorRendering: true });

const MermaidChart = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>("");
  const id = useMemo(
    () => `mermaid-${Math.random().toString(36).substring(7)}`,
    [],
  );

  useEffect(() => {
    if (!chart) return;

    // Sanitize Mermaid chart text
    let sanitizedChart = chart.trim();
    
    // 1. Ensure it starts with a valid graph type if missing
    if (!sanitizedChart.startsWith("graph") && 
        !sanitizedChart.startsWith("flowchart") && 
        !sanitizedChart.startsWith("sequenceDiagram") && 
        !sanitizedChart.startsWith("classDiagram") && 
        !sanitizedChart.startsWith("stateDiagram") && 
        !sanitizedChart.startsWith("erDiagram") && 
        !sanitizedChart.startsWith("gantt") && 
        !sanitizedChart.startsWith("pie")) {
      sanitizedChart = "graph TD\n" + sanitizedChart;
    }

    // 2. Try to fix unquoted labels that contain common special chars but spaces
    // This is a naive attempt to wrap node labels in quotes if the AI forgot
    // e.g. A[Label with space] -> A["Label with space"]
    sanitizedChart = sanitizedChart.replace(/\[([^"\]\n]+)\]/g, '["$1"]');
    sanitizedChart = sanitizedChart.replace(/\(([^" \)\n]+)\)/g, '("$1")');

    mermaid
      .render(id, sanitizedChart)
      .then(({ svg }) => setSvg(svg))
      .catch((err) => {
        console.error("Mermaid error:", err);
        setSvg(
          `<div class="text-rose-500/80 text-xs bg-rose-500/5 border border-rose-500/10 rounded-lg p-6 flex flex-col items-center justify-center gap-3">
             <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
             <span class="font-black uppercase tracking-widest opacity-60">Visualization Render Error</span>
           </div>`,
        );
      });
  }, [chart, id]);

  return (
    <div
      className="flex justify-center my-6 overflow-x-auto p-4 bg-white/5 rounded-2xl border border-white/10"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

function ProgressRing({ pct, size = 120, stroke = 8, color = "hsl(var(--primary))" }: { pct: number, size?: number, stroke?: number, color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <motion.circle
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
}

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
  const { toast } = useToast();

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

  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [prevMastery, setPrevMastery] = useState<number | null>(null);

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
    onMutate: async (variables) => {
      const currentMastery = studentMastery?.find(m => m.conceptId === variables.conceptId)?.score || 0;
      setPrevMastery(currentMastery);
    },
    onSuccess: (data) => {
      setLastScore(data);
      setPhase("feedback");
      setPrerequisiteRedirect(null);

      if (prevMastery !== null && prevMastery < 0.5 && data.score >= 0.7) {
        setShowReflection(true);
        badgeMutation.mutate({ badgeType: "COMEBACK_KID", conceptId: currentConcept?.id });
      }

      if (data.score >= 0.8) {
        badgeMutation.mutate({ badgeType: "CONCEPT_MASTER", conceptId: currentConcept?.id });
      }

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
    onError: (error: any) => {
      toast({
        title: "Evaluation Failed",
        description: error.message || "Something went wrong evaluating your response. Please try again.",
        variant: "destructive",
      });
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
    onError: (error: any) => {
      toast({
        title: "Failed to load explanation",
        description: error.message || "Could not connect to AI service. Please try again.",
        variant: "destructive",
      });
    },
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
    onError: (error: any) => {
      toast({
        title: "Tutor Error",
        description: error.message || "The tutor ran into an issue responding.",
        variant: "destructive",
      });
    },
  });

  const badgeMutation = useMutation({
    mutationFn: async (data: { badgeType: string; conceptId?: number }) => {
      const res = await apiRequest("POST", "/api/badges", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.earned) {
        const names: Record<string, string> = {
          "CONCEPT_MASTER": "Concept Master 👑",
          "COMEBACK_KID": "Comeback Kid 🔥",
          "SOCRATES": "Socratic Thinker 🦉"
        };
        toast({
          title: "🏆 Badge Unlocked!",
          description: `You earned: ${names[data.badge.badgeType] || data.badge.badgeType}`,
        });
        qc.invalidateQueries({ queryKey: ["/api/students", student.id, "badges"] });
      }
    }
  });

  const handleStartSocratic = () => {
    if (!currentConcept || !lastScore?.misconceptionType) return;
    setIsSocraticActive(true);
    setSocraticHistory([]);
    badgeMutation.mutate({ badgeType: "SOCRATES" });
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

  const reflectionMutation = useMutation({
    mutationFn: async (data: { conceptId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/reflections", data);
      return res.json();
    },
    onSuccess: () => {
      setShowReflection(false);
      setReflectionText("");
      qc.invalidateQueries({ queryKey: ["/api/students", student.id, "reflections"] });
      toast({
        title: "Reflection Saved",
        description: "Your insights have been added to your learning artifacts.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save reflection",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-background premium-gradient selection:bg-primary/20 overflow-hidden flex flex-col">
      <TutorialOverlay role="student" />

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: phase === "feedback" && lastScore?.score && lastScore.score < 0.4 ? [1, 1.2, 1] : 1,
            opacity: phase === "feedback" && lastScore?.score && lastScore.score < 0.4 ? [0.05, 0.1, 0.05] : 0.05
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" 
        />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      {/* ── TOP NAV ── */}
      <nav className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-3xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowExitDialog(true)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-black font-display uppercase tracking-widest text-primary mb-0.5">Session: {session.subject}</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
              Concept {currentConceptIndex + 1} of {totalConcepts}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {activeClassroomCode && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Connected</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/graph")}
            className="h-10 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black text-xs"
          >
            <Brain className="w-4 h-4 mr-2 text-primary" /> Analysis
          </Button>
        </div>
      </nav>

      {/* ── PROGRESS BAR ── */}
      <div className="relative z-40 h-1.5 w-full bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary-foreground shadow-[0_0_20px_rgba(99,102,241,0.5)]"
        />
      </div>

      <div className="flex-1 relative z-10 flex overflow-hidden">
        {/* ── SIDEBAR NAV ── */}
        <aside className="hidden lg:flex w-80 border-r border-white/5 bg-black/10 backdrop-blur-2xl flex-col p-6 overflow-y-auto no-scrollbar">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 opacity-50">Curriculum Path</h3>
          <div className="space-y-3">
            {concepts.map((c, i) => {
              const isPast = i < currentConceptIndex;
              const isCurrent = i === currentConceptIndex;
              const mastery = studentMastery?.find(m => m.conceptId === c.id)?.score || 0;
              
              return (
                <div 
                  key={c.id} 
                  className={`p-4 rounded-[1.25rem] border transition-all duration-300 ${
                    isCurrent 
                      ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5" 
                      : isPast 
                        ? "bg-emerald-500/5 border-emerald-500/10 opacity-60" 
                        : "bg-white/[0.02] border-white/5 opacity-40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? "text-primary" : isPast ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {isPast ? "Mastered" : isCurrent ? "Active" : "Locked"}
                    </span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <h4 className={`text-sm font-bold font-display leading-tight ${isCurrent ? "text-white" : "text-white/60"}`}>{c.name}</h4>
                  {mastery > 0 && (
                    <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${mastery * 100}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 pt-10">
          <div className="max-w-4xl mx-auto px-6">
            <AnimatePresence mode="wait">
              {currentConcept && (
                <motion.div
                  key={`${currentConcept.id}-${phase}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Phase: INTRO */}
                  {phase === "intro" && (
                    <div className="space-y-8">
                      {prerequisiteRedirect && (
                        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Target className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-amber-400 uppercase tracking-widest mb-1">Adaptive Redirect</p>
                            <p className="text-sm text-white/80 leading-relaxed">
                              You're struggling with a concept that builds on <strong>{prerequisiteRedirect}</strong>. 
                              Let's strengthen that foundation first.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="text-center max-w-2xl mx-auto mb-12">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 ring-1 ring-primary/30">
                          <BookOpen className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-5xl font-black font-display tracking-tighter mb-4">{currentConcept.name}</h1>
                        <p className="text-lg text-muted-foreground font-medium">{currentConcept.description}</p>
                      </div>

                      <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-2xl">
                        <CardContent className="p-10">
                          <div className="prose dark:prose-invert prose-lg max-w-none mb-10">
                            <ReactMarkdown components={markdownComponents}>
                              {currentConcept.idealExplanation}
                            </ReactMarkdown>
                          </div>
                          
                          <Button
                            onClick={handleStartConcept}
                            className="w-full h-16 rounded-2xl bg-primary text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            {questionMutation.isPending ? (
                              <div className="flex items-center gap-3">
                                <Loader2 className="w-6 h-6 animate-spin" /> 
                                Synthesizing Diagnostic Question...
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                Begin Active Practice <ArrowRight className="w-6 h-6" />
                              </div>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Phase: QUESTION */}
                  {(phase === "question" || phase === "responding") && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-black font-display uppercase tracking-widest text-white/50">Diagnostic Challenge</h2>
                      </div>

                      <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-2xl">
                        <CardContent className="p-10">
                          <div className="prose dark:prose-invert prose-xl max-w-none mb-10 font-medium leading-relaxed">
                            <ReactMarkdown components={markdownComponents}>
                              {question || `Explain the core mechanism of ${currentConcept.name} in your own words.`}
                            </ReactMarkdown>
                          </div>

                          <div className="relative group">
                            <VoiceVisualizer isActive={isRecording} />
                            <Textarea
                              placeholder="Describe your reasoning here..."
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              rows={6}
                              className="text-lg bg-black/40 border-white/10 rounded-[1.5rem] p-8 focus:ring-primary/40 focus:border-primary/50 transition-all resize-none font-medium leading-relaxed"
                              disabled={respondMutation.isPending}
                            />
                            
                            <div className="absolute bottom-6 right-6 flex gap-3">
                              <Button
                                variant={isRecording ? "destructive" : "secondary"}
                                onClick={toggleRecording}
                                className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border-white/10"
                              >
                                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                              </Button>
                              <Button
                                onClick={handleSubmitResponse}
                                disabled={!response.trim() || respondMutation.isPending || isRecording}
                                className="h-12 px-8 rounded-xl bg-primary font-black shadow-lg shadow-primary/20"
                              >
                                {respondMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                                {respondMutation.isPending ? "Analyzing..." : "Submit Analysis"}
                              </Button>
                            </div>
                          </div>

                          <div className="mt-8 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-40">
                              {response.length > 0 ? `${response.split(/\s+/).filter(Boolean).length} words recorded` : "Ready for input"}
                            </p>
                            <Button
                              variant="ghost"
                              onClick={handleIDontKnow}
                              className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white"
                            >
                              Unsure? Request Guided Explanation <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Phase: FEEDBACK */}
                  {phase === "feedback" && lastScore && (
                    <div className="space-y-8">
                      {/* Diagnostic Summary */}
                      <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                        <CardContent className="p-10">
                          <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                            <div className="relative shrink-0">
                              <div className={`absolute inset-0 blur-3xl opacity-20 rounded-full ${lastScore.score >= 0.7 ? "bg-emerald-500" : lastScore.score >= 0.4 ? "bg-amber-500" : "bg-rose-500"}`} />
                              <div className="relative bg-black/40 rounded-full p-2">
                                <ProgressRing pct={Math.round(lastScore.score * 100)} size={160} stroke={12} color={lastScore.score >= 0.7 ? "#10b981" : lastScore.score >= 0.4 ? "#f59e0b" : "#f43f5e"} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-5xl font-black font-display tracking-tighter">{Math.round(lastScore.score * 100)}%</span>
                                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Mastery</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                                {lastScore.bloomLevel && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest py-1 px-3">
                                    Cognitive Level: {lastScore.bloomLevel}
                                  </Badge>
                                )}
                                <Badge className="bg-white/5 text-white/50 border-white/10 text-[10px] font-black uppercase tracking-widest py-1 px-3">
                                  Session #{sessionId}
                                </Badge>
                              </div>
                              <div className="prose dark:prose-invert prose-lg max-w-none text-white/90 font-medium">
                                <ReactMarkdown components={markdownComponents}>
                                  {lastScore.feedback}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>

                          {/* 4-Panel Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400">Strengths</h4>
                              </div>
                              <ul className="space-y-3">
                                {lastScore.strengths.map((s, i) => (
                                  <li key={i} className="text-sm text-white/80 font-medium flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400"><XCircle className="w-5 h-5" /></div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-rose-400">Conceptual Gaps</h4>
                              </div>
                              <ul className="space-y-3">
                                {lastScore.gaps.map((g, i) => (
                                  <li key={i} className="text-sm text-white/80 font-medium flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                                    {g}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Misconception Diagnosis */}
                            {(() => {
                              const mc = lastScore.misconceptionType && lastScore.misconceptionType !== "NO_MISCONCEPTION"
                                ? (MISCONCEPTION_META[lastScore.misconceptionType] || MISCONCEPTION_META.INCOMPLETE_UNDERSTANDING)
                                : MISCONCEPTION_META.NO_MISCONCEPTION;
                              return (
                                <div className={`p-8 rounded-[2rem] border ${mc.border} ${mc.bg} backdrop-blur-3xl`}>
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className={`p-2 rounded-lg ${mc.bg} ${mc.color}`}><Target className="w-5 h-5" /></div>
                                    <h4 className={`text-sm font-black uppercase tracking-widest ${mc.color}`}>AI Diagnosis</h4>
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <span className="text-4xl">{mc.emoji}</span>
                                    <div>
                                      <p className={`text-lg font-black font-display mb-2 ${mc.color}`}>{mc.label}</p>
                                      <p className="text-sm text-white/70 font-medium leading-relaxed">{lastScore.misconceptionDetail || "Accurate reasoning path identified."}</p>
                                      {mc.remediation && <p className="text-xs text-muted-foreground mt-4 italic font-medium opacity-60">💡 {mc.remediation}</p>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="p-8 rounded-[2rem] bg-primary/[0.03] border border-primary/10">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Sparkles className="w-5 h-5" /></div>
                                <h4 className="font-black uppercase tracking-widest text-primary text-[10px]">Prescribed Action</h4>
                              </div>
                              <p className="text-sm text-white/80 font-medium leading-relaxed">
                                {lastScore.score >= 0.7
                                  ? "🎯 Concept Mastered. The system will advance you to the next challenge phase."
                                  : lastScore.score >= 0.4
                                  ? "🔄 Partial Gap detected. Engage the Socratic Tutor for a guided conceptual rebuild."
                                  : "📖 Re-establishing Foundations. Requesting an in-depth AI explanation to resolve core confusion."}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ── SECONDARY ACTIONS ── */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Explanation Card */}
                        <AnimatePresence>
                          {explanation && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                              <Card className="rounded-[2.5rem] border-white/5 bg-white/[0.01] backdrop-blur-3xl overflow-hidden shadow-xl">
                                <CardHeader className="p-8 pb-0 flex flex-row items-center gap-3">
                                  <div className="p-2 rounded-xl bg-primary/10 text-primary"><Sparkles className="w-5 h-5" /></div>
                                  <CardTitle className="text-lg font-black font-display">Deep-Dive Explanation</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                  <div className="prose dark:prose-invert prose-sm max-w-none text-white/70 leading-relaxed font-medium">
                                    <ReactMarkdown components={markdownComponents}>
                                      {explanation}
                                    </ReactMarkdown>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Socratic Chat */}
                        {isSocraticActive ? (
                          <Card className="rounded-[2.5rem] border-blue-500/20 bg-blue-500/[0.02] backdrop-blur-3xl overflow-hidden flex flex-col h-[500px] shadow-2xl">
                            <CardHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><MessageSquare className="w-5 h-5" /></div>
                                <h4 className="font-black font-display text-blue-400 uppercase tracking-widest text-xs">Socratic Tutor</h4>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => setIsSocraticActive(false)} className="rounded-full"><X className="w-4 h-4" /></Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                              {socraticHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm font-medium leading-relaxed ${msg.role === "user" ? "bg-primary text-white shadow-lg shadow-primary/10" : "bg-white/5 text-white/80 border border-white/5"}`}>
                                    <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                                  </div>
                                </div>
                              ))}
                              {socraticMutation.isPending && (
                                <div className="flex justify-start">
                                  <div className="bg-white/5 rounded-2xl px-5 py-3 flex items-center gap-3">
                                    <div className="flex gap-1">
                                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-blue-400/50">Analyzing response...</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                            <div className="p-6 border-t border-white/5 bg-black/20">
                              <div className="relative">
                                <Textarea 
                                  value={socraticInput}
                                  onChange={(e) => setSocraticInput(e.target.value)}
                                  placeholder="Respond to your tutor..."
                                  className="pr-14 min-h-[80px] bg-white/[0.03] border-white/10 rounded-2xl p-4 focus:ring-blue-500/30"
                                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSocraticSubmit(); }}}
                                />
                                <Button onClick={handleSocraticSubmit} disabled={!socraticInput.trim() || socraticMutation.isPending} className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20">
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {!explanation && (
                              <Button 
                                variant="outline" 
                                onClick={getExplanation} 
                                disabled={explainMutation.isPending}
                                className="h-20 rounded-[1.5rem] border-white/10 bg-white/[0.02] hover:bg-white/5 flex flex-col items-center justify-center gap-1 group transition-all"
                              >
                                <div className="flex items-center gap-2 text-primary group-hover:scale-110 transition-transform">
                                  <Sparkles className="w-5 h-5" />
                                  <span className="font-black uppercase tracking-widest text-xs">Deep-Dive Explanation</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-50">Generate comprehensive conceptual overview</span>
                              </Button>
                            )}
                            
                            {lastScore.score < 0.7 && lastScore.misconceptionType && lastScore.misconceptionType !== "NO_MISCONCEPTION" && (
                              <Button 
                                onClick={handleStartSocratic}
                                className="h-20 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/10 flex flex-col items-center justify-center gap-1 group transition-all"
                              >
                                <div className="flex items-center gap-2 text-white group-hover:scale-110 transition-transform">
                                  <MessageSquare className="w-5 h-5" />
                                  <span className="font-black uppercase tracking-widest text-xs">Socratic Review Session</span>
                                </div>
                                <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">Fix conceptual gaps through guided reasoning</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Main Action Bar */}
                      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
                        <div className="p-4 rounded-[2rem] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl flex gap-4">
                          {lastScore.score < 0.6 && (
                            <Button 
                              variant="outline" 
                              onClick={handleRetry} 
                              className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 font-black uppercase tracking-widest text-xs"
                            >
                              Retry Concept
                            </Button>
                          )}
                          <Button 
                            onClick={handleNext} 
                            className="flex-[2] h-14 rounded-2xl bg-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                          >
                            {currentConceptIndex < totalConcepts - 1 ? "Advance to Next Concept" : "Complete Study Session"}
                            <ArrowRight className="w-5 h-5 ml-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Exit Confirmation */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-[2.5rem] border-white/10 bg-black/90 backdrop-blur-3xl overflow-hidden ring-1 ring-white/10">
          <AlertDialogHeader className="p-6">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 ring-1 ring-rose-500/30">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-3xl font-black font-display tracking-tighter">End Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-white/60 font-medium">
              Your current progress in this concept will be lost, but your overall mastery points will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 bg-white/[0.02] border-t border-white/5">
            <AlertDialogCancel className="h-14 rounded-2xl bg-transparent border-white/10 font-black uppercase tracking-widest text-xs">Stay Focused</AlertDialogCancel>
            <AlertDialogAction onClick={() => setLocation("/subjects")} className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20">End Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reflection Portal */}
      <AnimatePresence>
        {showReflection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl">
              <Card className="rounded-[3rem] border-primary/30 bg-black/40 backdrop-blur-3xl shadow-3xl ring-1 ring-primary/20 overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 ring-1 ring-primary/30">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-4xl font-black font-display tracking-tighter mb-4 text-white">Breakthrough Moment!</h3>
                  <p className="text-lg text-white/60 font-medium mb-10 leading-relaxed">
                    You've shown a massive jump in understanding. What was the "Aha!" moment? Reflecting on this helps lock it into long-term memory.
                  </p>
                  <Textarea 
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Describe your breakthrough..."
                    className="mb-10 min-h-[160px] text-lg bg-white/5 border-white/10 rounded-[2rem] p-8 focus:ring-primary/40 text-white"
                  />
                  <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setShowReflection(false)}>Skip</Button>
                    <Button 
                      className="flex-[2] h-14 rounded-2xl bg-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                      onClick={() => { if (currentConcept) reflectionMutation.mutate({ conceptId: currentConcept.id, content: reflectionText }); }}
                      disabled={!reflectionText.trim() || reflectionMutation.isPending}
                    >
                      {reflectionMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Capture Breakthrough"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
