import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Concept, Session, Interaction } from "@shared/schema";
  ArrowLeft, ArrowRight, Send, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Brain, Sparkles, BookOpen, Target, Lightbulb,
  Mic, MicOff
} from "lucide-react";

interface ScoreResult {
  interaction: Interaction;
  score: number;
  gaps: string[];
  strengths: string[];
  feedback: string;
  mastery: number;
}

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
  const [phase, setPhase] = useState<"intro" | "question" | "responding" | "feedback" | "complete">("intro");

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setResponse((prev) => prev + (prev && !prev.endsWith(" ") ? " " : "") + finalTranscript);
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
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
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
        colors: ['#10b981', '#34d399', '#059669', '#f59e0b', '#fbbf24']
      });
    }
  }, [phase, lastScore]);

  if (!student) {
    setLocation("/");
    return null;
  }

  const sessionId = Number(params.sessionId);

  const { data: session } = useQuery<Session & { interactions: Interaction[] }>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/sessions/${sessionId}`);
      return res.json();
    },
  });

  const { data: concepts } = useQuery<Concept[]>({
    queryKey: ["/api/concepts", session?.subject],
    enabled: !!session?.subject,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/concepts/${session!.subject}`);
      return res.json();
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { conceptId: number; studentResponse: string }) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/respond`, data);
      return res.json() as Promise<ScoreResult>;
    },
    onSuccess: (data) => {
      setLastScore(data);
      setPhase("feedback");
      qc.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      qc.invalidateQueries({ queryKey: ["/api/students", student.id, "mastery"] });
    },
  });

  const explainMutation = useMutation({
    mutationFn: async (data: { conceptName: string; subject: string; gaps?: string[] }) => {
      const res = await apiRequest("POST", "/api/ai/explain", data);
      return res.json();
    },
    onSuccess: (data) => setExplanation(data.explanation),
  });

  const questionMutation = useMutation({
    mutationFn: async (data: { conceptName: string; subject: string; difficulty?: string }) => {
      const res = await apiRequest("POST", "/api/ai/question", data);
      return res.json();
    },
    onSuccess: (data) => {
      setQuestion(data.question);
      setPhase("question");
    },
  });

  const currentConcept = concepts?.[currentConceptIndex];
  const totalConcepts = concepts?.length || 0;
  const progressPercent = totalConcepts > 0 ? ((currentConceptIndex) / totalConcepts) * 100 : 0;

  const handleGetQuestion = () => {
    if (!currentConcept || !session) return;
    const difficulty = lastScore && lastScore.score < 0.5 ? "easy" : lastScore && lastScore.score > 0.8 ? "hard" : "medium";
    questionMutation.mutate({ conceptName: currentConcept.name, subject: session.subject, difficulty });
  };

  const handleStartConcept = () => {
    if (!currentConcept || !session) return;
    handleGetQuestion();
  };

  const handleSubmitResponse = () => {
    if (!currentConcept || !response.trim()) return;
    respondMutation.mutate({ conceptId: currentConcept.id, studentResponse: response });
  };

  const handleNext = () => {
    if (currentConceptIndex < totalConcepts - 1) {
      // If score was low, stay on same concept
      if (lastScore && lastScore.score < 0.4) {
        setPhase("intro");
        setResponse("");
        setLastScore(null);
        setExplanation("");
        setQuestion("");
        return;
      }
      setCurrentConceptIndex(prev => prev + 1);
      setPhase("intro");
      setResponse("");
      setLastScore(null);
      setExplanation("");
      setQuestion("");
    } else {
      setPhase("complete");
      apiRequest("POST", `/api/sessions/${sessionId}/end`);
    }
  };

  const handleRetry = () => {
    setResponse("");
    setLastScore(null);
    setPhase("question");
    // Optionally get a new question
    if (currentConcept && session) {
      questionMutation.mutate({ conceptName: currentConcept.name, subject: session.subject, difficulty: "easy" });
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
    if (score >= 0.7) return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    if (score >= 0.4) return <AlertTriangle className="w-6 h-6 text-amber-500" />;
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
              Great job studying {session.subject}! You covered {totalConcepts} concepts.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setLocation("/subjects")} data-testid="button-new-session">
                New Session
              </Button>
              <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-view-progress">
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
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/subjects")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{session.subject}</Badge>
                <span className="text-sm text-muted-foreground">
                  {currentConceptIndex + 1} of {totalConcepts}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/graph")} data-testid="button-view-graph">
            <Brain className="w-4 h-4 mr-1" /> Graph
          </Button>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-2">
          <Progress value={progressPercent} className="h-1.5" data-testid="progress-session" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {currentConcept && (
          <>
            {/* Concept Introduction */}
            {phase === "intro" && (
              <Card className="border border-border/60" data-testid="card-concept-intro">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{currentConcept.name}</h2>
                      <p className="text-muted-foreground text-sm mt-1">{currentConcept.description}</p>
                    </div>
                  </div>
                  {JSON.parse(currentConcept.prerequisites).length > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Target className="w-4 h-4" />
                      Prerequisites: {JSON.parse(currentConcept.prerequisites).join(", ")}
                    </div>
                  )}
                  <Button onClick={handleStartConcept} className="w-full" data-testid="button-start-concept">
                    {questionMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating question...</>
                    ) : (
                      <>Ready to Practice <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Question & Response */}
            {(phase === "question" || phase === "responding") && (
              <Card className="border border-border/60" data-testid="card-question">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{currentConcept.name}</h3>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none" data-testid="text-question">
                        <ReactMarkdown>{question || `Explain the key concepts of ${currentConcept.name} in your own words.`}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Textarea
                      data-testid="input-response"
                      placeholder="Type your explanation here... Be as detailed as you can!"
                      value={response}
                      onChange={e => setResponse(e.target.value)}
                      rows={5}
                      className="resize-none"
                      disabled={respondMutation.isPending}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {response.length > 0 ? `${response.split(/\s+/).filter(Boolean).length} words` : "Start typing or speaking..."}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant={isRecording ? "destructive" : "secondary"}
                          onClick={toggleRecording}
                          title={isRecording ? "Stop recording" : "Start recording"}
                        >
                          {isRecording ? <><MicOff className="w-4 h-4 mr-2" /> Stop</> : <><Mic className="w-4 h-4 mr-2" /> Speak</>}
                        </Button>
                        <Button
                          data-testid="button-submit-response"
                          onClick={handleSubmitResponse}
                          disabled={!response.trim() || respondMutation.isPending}
                        >
                          {respondMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring...</>
                          ) : (
                            <><Send className="w-4 h-4 mr-2" /> Submit</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {phase === "feedback" && lastScore && (
              <div className="space-y-4">
                {/* Score Card */}
                <Card className="border border-border/60" data-testid="card-score">
                  <CardContent className="pt-6 pb-5">
                    <div className="flex items-center gap-4 mb-4">
                      {scoreIcon(lastScore.score)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-2xl font-bold ${scoreColor(lastScore.score)}`} data-testid="text-score">
                            {Math.round(lastScore.score * 100)}%
                          </span>
                          <span className="text-sm text-muted-foreground">understanding</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${scoreBg(lastScore.score)}`}
                            style={{ width: `${lastScore.score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-sm mb-4 prose prose-sm dark:prose-invert max-w-none" data-testid="text-feedback">
                      <ReactMarkdown>{lastScore.feedback}</ReactMarkdown>
                    </div>

                    {lastScore.strengths.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 mb-1.5">
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {lastScore.strengths.map((s, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
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
                            <li key={i} className="text-sm flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Explanation (optional) */}
                {!explanation && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={getExplanation}
                    disabled={explainMutation.isPending}
                    data-testid="button-get-explanation"
                  >
                    {explainMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Get AI Explanation</>
                    )}
                  </Button>
                )}

                {explanation && (
                  <Card className="border border-primary/20 bg-primary/5" data-testid="card-explanation">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm">AI Explanation</h4>
                      </div>
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{explanation}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {lastScore.score < 0.6 && (
                    <Button variant="outline" onClick={handleRetry} className="flex-1" data-testid="button-retry">
                      Try Again
                    </Button>
                  )}
                  <Button onClick={handleNext} className="flex-1" data-testid="button-next">
                    {currentConceptIndex < totalConcepts - 1 ? (
                      lastScore.score < 0.4 ? (
                        <>Review Again <ArrowRight className="w-4 h-4 ml-2" /></>
                      ) : (
                        <>Next Concept <ArrowRight className="w-4 h-4 ml-2" /></>
                      )
                    ) : (
                      <>Complete Session <CheckCircle2 className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
