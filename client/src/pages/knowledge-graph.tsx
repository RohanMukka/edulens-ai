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
  const masteryColor = data.mastery >= 0.7
    ? "border-emerald-500/50 bg-emerald-500/10"
    : data.mastery >= 0.4
      ? "border-amber-500/50 bg-amber-500/10"
      : data.mastery > 0
        ? "border-rose-500/50 bg-rose-500/10"
        : "border-border/40 bg-card/60";

  const glowColor = data.mastery >= 0.7
    ? "shadow-emerald-500/20"
    : data.mastery >= 0.4
      ? "shadow-amber-500/20"
      : data.mastery > 0
        ? "shadow-rose-500/20"
        : "shadow-none";

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-5 py-4 rounded-2xl border backdrop-blur-md shadow-xl min-w-[160px] text-center transition-all hover:scale-105 hover:border-primary/50 ${masteryColor} ${glowColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary/40 !w-2.5 !h-2.5 !border-0" />
      <div className="font-bold text-sm mb-1.5 tracking-tight">{data.label}</div>
      <div className="flex items-center justify-center gap-1.5">
        <div className={`text-[10px] font-black uppercase tracking-widest ${data.mastery > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          {data.mastery > 0 ? `${Math.round(data.mastery * 100)}% Mastery` : "Not Started"}
        </div>
        {data.mastery >= 0.7 && <CheckCheck className="w-3 h-3 text-emerald-500" />}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary/40 !w-2.5 !h-2.5 !border-0" />
    </motion.div>
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
      Biology: 0, Math: 450, History: 900, "Computer Science": 1350, 
      Physics: 1800, Chemistry: 2250, Economics: 2700 
    };

    for (const concept of allConcepts) {
      const xOffset = subjectOffsets[concept.subject] ?? 0;
      const subjectConcepts = allConcepts.filter(c => c.subject === concept.subject);
      const idx = subjectConcepts.findIndex(c => c.id === concept.id);

      nodes.push({
        id: String(concept.id),
        type: "concept",
        position: { x: xOffset + (idx % 2) * 200, y: 120 + Math.floor(idx / 2) * 140 },
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
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(239 84% 67%)" },
            style: { stroke: "hsl(239 84% 67% / 0.4)", strokeWidth: 3 },
            animated: (masteryMap[prereqConcept.id] || 0) >= 0.7,
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="border-b border-border/60 bg-card/30 backdrop-blur-sm px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/subjects")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h1 className="font-bold">Knowledge Graph</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Learning
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Needs Work
          </Badge>
          <Badge variant="secondary" className="gap-1">
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

      <div className="flex-1 relative" data-testid="graph-container">
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
          <Controls className="!bg-card !border-border !fill-foreground [&_button]:!border-border/40 [&_svg]:!fill-foreground" />
        </ReactFlow>
        </div>
      </div>
    </div>
  );
}
