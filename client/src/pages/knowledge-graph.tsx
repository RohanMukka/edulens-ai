import { useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Loader2, Sparkles, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { useState } from "react";
import { GraphSkeleton } from "@/components/ui/skeleton-screen";
import type { Concept, MasteryScore } from "@shared/schema";
import { Lock, Unlock, ArrowRight, Activity, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function ConceptNode({ data }: { data: { label: string; mastery: number; subject: string } }) {
  const pct = Math.round(data.mastery * 100);
  const color = data.mastery >= 0.7 ? "#10b981" : data.mastery >= 0.4 ? "#f59e0b" : data.mastery > 0 ? "#f43f5e" : "#64748b";
  
  return (
    <div className="relative group">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-20 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />
      
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-24 h-24 rounded-full bg-card/60 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center p-2 text-center shadow-2xl hover:scale-110 transition-transform cursor-pointer overflow-visible"
      >
        <Handle type="target" position={Position.Top} className="!opacity-0 !top-0" />
        
        {/* Progress Circle SVG */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
          <motion.circle 
            cx="48" cy="48" r="44" fill="none" stroke={color} strokeWidth="3" 
            strokeDasharray={2 * Math.PI * 44}
            initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - data.mastery) }}
            transition={{ duration: 1.5, delay: 0.5 }}
            strokeLinecap="round"
          />
        </svg>

        <div className="relative z-10 px-1">
          <div className="text-[9px] font-black leading-tight uppercase tracking-tighter line-clamp-2 mb-0.5">{data.label}</div>
          <div className="text-[10px] font-bold" style={{ color }}>{pct}%</div>
        </div>

        <Handle type="source" position={Position.Bottom} className="!opacity-0 !bottom-0" />
      </motion.div>
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };

export default function KnowledgeGraph() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const { theme } = useTheme();

  if (!student) {
    setLocation("/");
    return null;
  }

  const subjects = ["Biology", "Math", "History", "Computer Science", "Physics", "Chemistry", "Economics"];

  const conceptQueries = subjects.map(subject =>
    useQuery<Concept[]>({
      queryKey: ["/api/concepts", subject],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/concepts/${subject}`);
        return res.json();
      },
    })
  );

  const { data: mastery } = useQuery<MasteryScore[]>({
    queryKey: ["/api/students", student.id, "mastery"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/students/${student.id}/mastery`);
      return res.json();
    },
  });

  const allConcepts = conceptQueries.flatMap(q => q.data || []);
  const isLoading = conceptQueries.some(q => q.isLoading);

  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const masteryMap = useMemo(() => {
    const map: Record<number, number> = {};
    if (mastery) {
      for (const m of mastery) {
        map[m.conceptId] = m.score;
      }
    }
    return map;
  }, [mastery]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const subjectOffsets: Record<string, number> = { 
      Biology: 0, Math: 550, History: 1100, "Computer Science": 1650, 
      Physics: 2200, Chemistry: 2750, Economics: 3300 
    };

    for (const concept of allConcepts) {
      const xOffset = subjectOffsets[concept.subject] ?? 0;
      const subjectConcepts = allConcepts.filter(c => c.subject === concept.subject);
      const idx = subjectConcepts.findIndex(c => c.id === concept.id);

      nodes.push({
        id: String(concept.id),
        type: "concept",
        position: { 
          x: xOffset + (idx % 2) * 280 + Math.sin(idx) * 40, 
          y: 120 + Math.floor(idx / 2) * 220 + (idx % 2 === 0 ? 0 : 60) 
        },
        data: {
          label: concept.name,
          mastery: masteryMap[concept.id] || 0,
          subject: concept.subject,
        },
      });

      let prereqs: string[] = [];
      try {
        prereqs = JSON.parse(concept.prerequisites) as string[];
      } catch (e) {
        console.error("Failed to parse prerequisites for concept", concept.id);
      }
      for (const prereqName of prereqs) {
        const prereqConcept = allConcepts.find(c => c.name === prereqName && c.subject === concept.subject);
        if (prereqConcept) {
          edges.push({
            id: `${prereqConcept.id}-${concept.id}`,
            source: String(prereqConcept.id),
            target: String(concept.id),
            markerEnd: { type: MarkerType.ArrowClosed, color: "currentColor", width: 10, height: 10 },
            style: { stroke: "currentColor", strokeWidth: 1.5, opacity: 0.2 },
            animated: (masteryMap[prereqConcept.id] || 0) >= 0.7,
            type: "smoothstep",
          });
        }
      }
    }

    return { nodes, edges };
  }, [allConcepts, masteryMap]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const concept = allConcepts.find(c => String(c.id) === node.id);
    if (concept) {
      setSelectedConcept(concept);
    }
  }, [allConcepts]);

  const isUnlocked = (concept: Concept) => {
    let prereqs: string[] = [];
    try {
      prereqs = JSON.parse(concept.prerequisites) as string[];
    } catch (e) {}
    if (prereqs.length === 0) return true;
    
    return prereqs.every(pName => {
      const pConcept = allConcepts.find(c => c.name === pName && c.subject === concept.subject);
      if (!pConcept) return true;
      return (masteryMap[pConcept.id] || 0) >= 0.7;
    });
  };

  if (isLoading) {
    return <GraphSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden pb-12 sm:pb-0">
      <div className="border-b border-border/60 bg-card/30 backdrop-blur-sm px-6 py-3 flex flex-wrap items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/subjects")} data-testid="button-back" aria-label="Back to subjects">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h1 className="font-bold">Knowledge Graph</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered
          </Badge>
          <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Learning
          </Badge>
          <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Needs Work
          </Badge>
          <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" /> Not Started
          </Badge>
        </div>
      </div>

      {/* Subject headers */}
      <div className="px-6 py-4 flex gap-4 shrink-0 overflow-x-auto no-scrollbar">
        {subjects.map((subject, idx) => {
          const subjectConcepts = allConcepts.filter(c => c.subject === subject);
          const masteredCount = subjectConcepts.filter(c => (masteryMap[c.id] || 0) >= 0.7).length;
          const progress = subjectConcepts.length > 0 ? (masteredCount / subjectConcepts.length) * 100 : 0;
          
          return (
            <motion.div
              key={subject}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="min-w-[200px]"
            >
              <Card className="glass-card border border-border/40 hover:border-primary/40 transition-all overflow-hidden">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm tracking-tight">{subject}</div>
                    <Badge variant="outline" className="text-[10px] font-black">{Math.round(progress)}%</Badge>
                  </div>
                  <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">{masteredCount}/{subjectConcepts.length} Concepts Mastered</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="flex-1 relative mb-16 sm:mb-0" data-testid="graph-container">
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          colorMode={theme}
        >
          <Background gap={20} size={1} />
          <Controls 
            position="bottom-right"
            className="!bg-card !border-border !fill-foreground [&_button]:!border-border/40 [&_svg]:!fill-foreground mb-4" 
          />
        </ReactFlow>
        </div>

        {/* ── SELECTION PANEL ── */}
        <AnimatePresence>
          {selectedConcept && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="absolute top-[20%] sm:top-4 right-0 sm:right-4 bottom-0 sm:bottom-4 w-full max-w-none sm:max-w-[360px] bg-card/95 sm:bg-card/80 backdrop-blur-xl border-t sm:border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] sm:shadow-2xl z-[1000] overflow-hidden flex flex-col"
            >
              <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{selectedConcept.subject}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedConcept(null)} className="h-8 w-8 p-0 rounded-full" aria-label="Close concept panel">✕</Button>
                </div>

                <h2 className="text-2xl font-black mb-2 leading-tight">{selectedConcept.name}</h2>
                <p className="text-sm text-muted-foreground mb-6">{selectedConcept.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mastery</span>
                    </div>
                    <p className="text-xl font-black">{Math.round((masteryMap[selectedConcept.id] || 0) * 100)}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                    </div>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      {isUnlocked(selectedConcept) ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                          Unlocked
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-500" />
                          Locked
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <Separator className="mb-6 opacity-40" />

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Prerequisites</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {JSON.parse(selectedConcept.prerequisites).length > 0 ? (
                        JSON.parse(selectedConcept.prerequisites).map((p: string) => {
                          const pConcept = allConcepts.find(c => c.name === p && c.subject === selectedConcept.subject);
                          const mastered = pConcept && (masteryMap[pConcept.id] || 0) >= 0.7;
                          return (
                            <Badge key={p} variant="secondary" className={`text-[10px] gap-1 px-2 ${mastered ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                              {mastered ? <CheckCheck className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              {p}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None — This is a foundational concept.</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isUnlocked(selectedConcept) && (
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400 mb-6">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5" /> Concept Locked
                    </p>
                    <p className="opacity-80">Master all prerequisites (≥70%) to unlock this learning module.</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-muted/20 border-t border-border/40 mt-auto backdrop-blur-md">
                <Button 
                  className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
                  disabled={!isUnlocked(selectedConcept)}
                  onClick={() => {
                    // Navigate to learning session with this concept pre-selected if possible
                    // For now, go to subjects page as per existing flow or subjects list
                    setLocation("/subjects");
                  }}
                >
                  {isUnlocked(selectedConcept) ? (
                    <>
                      Start Learning <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Prerequisites Required
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
