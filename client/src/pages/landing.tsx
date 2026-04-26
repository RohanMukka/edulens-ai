import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  Brain, Sparkles, BarChart3, Network, ArrowRight,
  BookOpen, Lightbulb, TrendingUp, Users, CheckCircle2,
  Target, Zap, GraduationCap
} from "lucide-react";

const stats = [
  { value: "2σ", label: "Improvement over traditional teaching", sub: "Bloom's 2-Sigma Problem" },
  { value: "258M", label: "Children without access to education", sub: "UNESCO 2023" },
  { value: "1:23", label: "Average student-to-teacher ratio", sub: "OECD Countries" },
  { value: "10%", label: "Students with access to personalized learning", sub: "World Bank" },
];

const features = [
  {
    icon: Brain,
    title: "Reads How You Think",
    desc: "EduLens analyzes free-text explanations — not multiple choice — to understand the depth of your reasoning, not just what you clicked.",
    color: "bg-violet-500/10 text-violet-500",
  },
  {
    icon: Target,
    title: "Identifies Your Gaps",
    desc: "Our NLP engine pinpoints the exact concepts you're missing and builds a personalized remediation path, right now, in real time.",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: TrendingUp,
    title: "Adapts to Your Level",
    desc: "Scored too low? The system automatically steps down to an easier question. Excelling? It advances you. Truly adaptive, truly personal.",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    desc: "Visualize your entire learning journey as an interactive concept map. See mastery levels, prerequisites, and what to conquer next.",
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    icon: GraduationCap,
    title: "Classroom Management",
    desc: "Educators create classrooms with a shareable code. Students join instantly. Teachers see real-time mastery data across their roster.",
    color: "bg-rose-500/10 text-rose-500",
  },
  {
    icon: Zap,
    title: "Instant AI Feedback",
    desc: "Powered by Llama 3.1 via Groq — one of the fastest inference engines available — feedback arrives in under 2 seconds.",
    color: "bg-cyan-500/10 text-cyan-500",
  },
];

const howItWorks = [
  { step: "01", title: "Read the Mini-Lesson", desc: "Every concept starts with a concise AI-generated lesson so you learn before you're assessed." },
  { step: "02", title: "Explain in Your Own Words", desc: "No multiple choice. You type a free-text explanation of the concept as you understand it." },
  { step: "03", title: "AI Scores Your Understanding", desc: "Our NLP pipeline scores your response, identifies strengths and gaps, and gives targeted feedback." },
  { step: "04", title: "Adaptive Next Step", desc: "Master it? Advance. Struggling? Get a simpler question and remediation. Your path is truly yours." },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { student, login, register, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [educatorCode, setEducatorCode] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        if (!email || !password) { setError("Email and password are required"); setLoading(false); return; }
        const user = await login(email, password);
        if (user.role === "educator") setLocation("/teacher");
        else setLocation("/subjects");
      } else {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (role === "educator" && !educatorCode) {
          setError("Educator code is required");
          setLoading(false);
          return;
        }
        if (!password) { setError("Password is required"); setLoading(false); return; }
        const user = await register(name, email, password, role, educatorCode);
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
          <h1 className="text-2xl font-bold mb-2">Ready to learn?</h1>
          <p className="text-muted-foreground">Pick up where you left off.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          {student.role === "educator" ? (
            <Button onClick={() => setLocation("/teacher")} size="lg">
              Educator Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button data-testid="button-start-learning" onClick={() => setLocation("/subjects")} size="lg">
                Continue Learning <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button data-testid="button-dashboard" variant="outline" onClick={() => setLocation("/dashboard")} size="lg">
                <BarChart3 className="mr-2 w-4 h-4" /> My Dashboard
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

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight">EduLens AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsLogin(true)}>Sign in</Button>
            <Button size="sm" className="hidden sm:flex" onClick={() => setIsLogin(false)}>Get Started Free</Button>
            <Button size="sm" className="sm:hidden" onClick={() => setIsLogin(false)}>Join</Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-violet-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 mb-6 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Nira Hackathon 2026 · Transforming Education
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5">
              The AI that reads{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                  how you think
                </span>
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              EduLens doesn't ask you to pick A, B, or C. It asks you to <strong className="text-foreground">explain</strong> — then uses AI to understand your reasoning, pinpoint your gaps, and personally guide what you study next.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button size="lg" className="text-base px-8" onClick={() => document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth" })}>
                Start Learning Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                See How It Works
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {["No credit card required", "Free to use", "Groq-powered (< 2s responses)"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Auth Form */}
          <div id="auth-form">
            <Card className="border border-border/60 shadow-2xl shadow-primary/5 backdrop-blur-sm">
              <CardContent className="pt-6 pb-6 px-7">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-lg">{isLogin ? "Welcome back" : "Create your account"}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {isLogin ? "Sign in to continue your learning journey." : "Join thousands of students learning smarter with AI."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {!isLogin && (
                    <>
                      <Input
                        data-testid="input-name"
                        placeholder="Your full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={loading}
                      />
                      <Select value={role} onValueChange={setRole} disabled={loading}>
                        <SelectTrigger>
                          <SelectValue placeholder="I am a..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">
                            <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Student</span>
                          </SelectItem>
                          <SelectItem value="educator">
                            <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Educator</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {role === "educator" && (
                        <Input
                          type="password"
                          placeholder="Educator access code"
                          value={educatorCode}
                          onChange={e => setEducatorCode(e.target.value)}
                          disabled={loading}
                        />
                      )}
                    </>
                  )}
                  <Input
                    data-testid="input-email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  {error && <p className="text-sm text-destructive" data-testid="text-error">{error}</p>}
                  <Button data-testid="button-submit-auth" type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
                    ) : isLogin ? "Sign In" : "Start Learning Free"}
                    {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
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
      </section>

      {/* ── STATS BANNER ── */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.value} className="text-center">
              <div className="text-4xl font-black text-primary mb-1">{s.value}</div>
              <div className="text-sm font-medium mb-0.5">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive rounded-full px-3 py-1.5 mb-6 text-xs font-semibold uppercase tracking-wider">
          The Problem
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Traditional ed-tech tests recall.<br />
          <span className="text-muted-foreground">Not understanding.</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto mb-8">
          When a student picks the wrong answer on a multiple-choice quiz, the platform knows they got it wrong. But it doesn't know <em>why</em> they're confused — and neither does the student.
          <strong className="text-foreground"> EduLens fixes this.</strong>
        </p>
        <div className="grid md:grid-cols-2 gap-4 text-left">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-5 pb-5">
              <h3 className="font-semibold text-sm text-destructive mb-3">❌ Traditional Platforms</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multiple choice only — tests memorization</li>
                <li>• "Wrong answer" feedback with no explanation</li>
                <li>• Same content for every student</li>
                <li>• Teacher has no visibility into confusion</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-5 pb-5">
              <h3 className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 mb-3">✅ EduLens AI</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Free-text explanations — tests deep understanding</li>
                <li>• AI identifies exact knowledge gaps with feedback</li>
                <li>• Adaptive path tailored to each student's mastery</li>
                <li>• Real-time classroom dashboard for educators</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-muted/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 mb-4 text-xs font-semibold uppercase tracking-wider">
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Four steps to genuine mastery</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%-0px)] w-full h-px bg-border z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-black text-primary">{step.step}</span>
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 mb-4 text-xs font-semibold uppercase tracking-wider">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to learn — and teach — better</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <Card key={f.title} className="border border-border/50 hover:border-primary/30 transition-colors group">
              <CardContent className="pt-6 pb-5 px-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-violet-500/10 to-cyan-500/10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            The future of learning is personal.<br />Start today — it's free.
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join EduLens and experience what it feels like when an AI truly understands how <em>you</em> think.
          </p>
          <Button size="lg" className="text-base px-10 h-12" onClick={() => document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth" })}>
            Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-bold">EduLens AI</span>
            <span className="text-muted-foreground">· Nira Hackathon 2026</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built with React, TypeScript, Groq (Llama 3.1), Drizzle ORM & PostgreSQL
          </p>
        </div>
      </footer>

    </div>
  );
}
