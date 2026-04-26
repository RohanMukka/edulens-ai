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
import type { Concept, MasteryScore } from "@shared/schema";

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

      const prereqs = JSON.parse(concept.prerequisites) as string[];
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden pb-12 sm:pb-0">
      <div className="border-b border-border/60 bg-card/30 backdrop-blur-sm px-6 py-3 flex flex-wrap items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/subjects")} data-testid="button-back">
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
      </div>
    </div>
  );
}
