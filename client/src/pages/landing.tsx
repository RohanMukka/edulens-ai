import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { Brain, Sparkles, BarChart3, Network, ArrowRight, BookOpen, Lightbulb, TrendingUp } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { student, login, register, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const user = await login(email);
        if (user.role === "educator") setLocation("/teacher");
        else setLocation("/subjects");
      } else {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        
        if (role === "educator") {
          const code = prompt("Please enter the Educator Verification Code (Hint: 1234):");
          if (code !== "1234") {
            setError("Invalid Educator Code. Please try again.");
            setLoading(false);
            return;
          }
        }

        const user = await register(name, email, role);
        if (user.role === "educator") setLocation("/teacher");
        else setLocation("/subjects");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  if (student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-4">
            <Brain className="w-5 h-5" />
            <span className="font-semibold text-sm">Welcome back, {student.name}!</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Ready to learn?</h1>
        </div>
        <div className="flex gap-3">
          {student.role === "educator" ? (
            <Button onClick={() => setLocation("/teacher")} size="lg">
              Educator Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button data-testid="button-start-learning" onClick={() => setLocation("/subjects")} size="lg">
                Start Learning <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button data-testid="button-dashboard" variant="outline" onClick={() => setLocation("/dashboard")} size="lg">
                <BarChart3 className="mr-2 w-4 h-4" /> Dashboard
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => logout()} size="lg" className="text-muted-foreground">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Adaptive Learning</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight mb-4">
              Learn Smarter with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EduLens AI
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
              An adaptive learning companion that uses NLP to analyze your understanding,
              identify knowledge gaps, and create personalized learning paths in real time.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Lightbulb, title: "Adaptive Learning", desc: "AI analyzes your responses and adapts to your level" },
              { icon: Network, title: "Knowledge Graph", desc: "Visualize concept connections and track mastery" },
              { icon: TrendingUp, title: "Real-time Feedback", desc: "Get instant scoring and personalized explanations" },
            ].map((f) => (
              <Card key={f.title} className="border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Auth Form */}
          <div className="max-w-sm mx-auto">
            <Card className="border border-border/60">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">{isLogin ? "Welcome Back" : "Get Started"}</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  {!isLogin && (
                    <>
                      <Input
                        data-testid="input-name"
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                      />
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="educator">Educator</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  <Input
                    data-testid="input-email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  {error && <p className="text-sm text-destructive" data-testid="text-error">{error}</p>}
                  <Button data-testid="button-submit-auth" type="submit" className="w-full" disabled={loading}>
                    {loading ? "Loading..." : isLogin ? "Sign In" : "Start Learning"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {isLogin ? "New here? " : "Already have an account? "}
                  <button
                    data-testid="button-toggle-auth"
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(""); }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Create account" : "Sign in"}
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
