import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border border-border/60">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This page doesn't exist. Let's get you back to learning!
          </p>
          <Button onClick={() => setLocation("/")} className="mt-4" data-testid="button-go-home">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
