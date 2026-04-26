import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-border/50 shimmer">
            <CardContent className="pt-5 pb-4">
              <div className="w-9 h-9 rounded-lg bg-muted mb-3" />
              <div className="w-16 h-3 bg-muted rounded mb-2" />
              <div className="w-24 h-6 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shimmer">
          <CardHeader>
            <div className="w-48 h-5 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="w-full h-48 bg-muted rounded" />
          </CardContent>
        </Card>
        <Card className="border-border/50 shimmer">
          <CardHeader>
            <div className="w-32 h-5 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="w-full h-3 bg-muted rounded" />
                  <div className="w-2/3 h-2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SubjectSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <div className="w-64 h-8 bg-muted rounded" />
        <div className="w-96 h-4 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="border-border/50 shimmer">
            <CardContent className="p-0">
              <div className="w-full h-40 bg-muted rounded-t-xl" />
              <div className="p-5 space-y-3">
                <div className="w-32 h-5 bg-muted rounded" />
                <div className="w-full h-4 bg-muted rounded" />
                <div className="w-24 h-4 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
