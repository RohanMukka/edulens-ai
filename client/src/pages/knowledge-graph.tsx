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
import { ArrowLeft, Brain, Loader2 } from "lucide-react";
import type { Concept, MasteryScore } from "@shared/schema";

function ConceptNode({ data }: { data: { label: string; mastery: number; subject: string } }) {
  const masteryColor = data.mastery >= 0.7
    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
    : data.mastery >= 0.4
      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40"
      : data.mastery > 0
        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
        : "border-border bg-card";

  const masteryText = data.mastery >= 0.7
    ? "text-emerald-700 dark:text-emerald-300"
    : data.mastery >= 0.4
      ? "text-amber-700 dark:text-amber-300"
      : data.mastery > 0
        ? "text-rose-700 dark:text-rose-300"
        : "text-muted-foreground";

  return (
    <div className={`px-4 py-3 rounded-lg border-2 shadow-sm min-w-[140px] text-center ${masteryColor}`}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="font-semibold text-sm mb-1">{data.label}</div>
      <div className={`text-xs ${masteryText}`}>
        {data.mastery > 0 ? `${Math.round(data.mastery * 100)}% mastery` : "Not started"}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };

export default function KnowledgeGraph() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();

  if (!student) {
    setLocation("/");
    return null;
  }

  const subjects = ["Biology", "Math", "History"];

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
    const subjectOffsets: Record<string, number> = { Biology: 0, Math: 400, History: 800 };

    for (const concept of allConcepts) {
      const xOffset = subjectOffsets[concept.subject] || 0;
      const subjectConcepts = allConcepts.filter(c => c.subject === concept.subject);
      const idx = subjectConcepts.findIndex(c => c.id === concept.id);

      nodes.push({
        id: String(concept.id),
        type: "concept",
        position: { x: xOffset + (idx % 2) * 180, y: 80 + Math.floor(idx / 1) * 100 + idx * 20 },
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
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "hsl(239 84% 67%)", strokeWidth: 2 },
            animated: true,
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/60 bg-card/30 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
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
      <div className="px-6 py-3 flex gap-4">
        {subjects.map(subject => {
          const subjectConcepts = allConcepts.filter(c => c.subject === subject);
          const masteredCount = subjectConcepts.filter(c => (masteryMap[c.id] || 0) >= 0.7).length;
          return (
            <Card key={subject} className="flex-1 border border-border/60">
              <CardContent className="py-3 px-4">
                <div className="font-semibold text-sm">{subject}</div>
                <div className="text-xs text-muted-foreground">{masteredCount}/{subjectConcepts.length} mastered</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex-1 relative" data-testid="graph-container" style={{ minHeight: "500px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} />
          <Controls />
        </ReactFlow>
        </div>
      </div>
    </div>
  );
}
