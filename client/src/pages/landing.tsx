import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  Brain,
  Sparkles,
  BarChart3,
  Network,
  ArrowRight,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Users,
  CheckCircle2,
  Target,
  Zap,
  GraduationCap,
  ArrowUpRight,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const stats = [
  {
    value: "2σ",
    label: "Improvement over traditional teaching",
    sub: "Bloom's 2-Sigma Problem",
  },
  {
    value: "258M",
    label: "Children without access to education",
    sub: "UNESCO 2023",
  },
  {
    value: "1:23",
    label: "Average student-to-teacher ratio",
    sub: "OECD Countries",
  },
  {
    value: "10%",
    label: "Students with access to personalized learning",
    sub: "World Bank",
  },
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
  {
    step: "01",
    title: "Read the Mini-Lesson",
    desc: "Every concept starts with a concise AI-generated lesson so you learn before you're assessed.",
  },
  {
    step: "02",
    title: "Explain in Your Own Words",
    desc: "No multiple choice. You type a free-text explanation of the concept as you understand it.",
  },
  {
    step: "03",
    title: "AI Scores Your Understanding",
    desc: "Our NLP pipeline scores your response, identifies strengths and gaps, and gives targeted feedback.",
  },
  {
    step: "04",
    title: "Adaptive Next Step",
    desc: "Master it? Advance. Struggling? Get a simpler question and remediation. Your path is truly yours.",
  },
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
        if (!email || !password) {
          setError("Email and password are required");
          setLoading(false);
          return;
        }
        const user = await login(email, password);
        if (user.role === "educator") setLocation("/teacher");
        else setLocation("/subjects");
      } else {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        if (role === "educator" && !educatorCode) {
          setError("Educator code is required");
          setLoading(false);
          return;
        }
        if (!password) {
          setError("Password is required");
          setLoading(false);
          return;
        }
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 premium-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-5 py-2.5 mb-6">
            <Brain className="w-5 h-5" />
            <span className="font-bold text-sm">
              Welcome back, {student.name}!
            </span>
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Ready to master more?
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick up where you left off in your learning journey.
          </p>
        </motion.div>
        <div className="flex gap-4 flex-wrap justify-center">
          {student.role === "educator" ? (
            <Button
              onClick={() => setLocation("/teacher")}
              size="lg"
              className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20"
            >
              Educator Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setLocation("/subjects")}
                size="lg"
                className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20"
              >
                Continue Learning <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                size="lg"
                className="h-14 px-8 rounded-2xl border-border/60"
              >
                <BarChart3 className="mr-2 w-5 h-5 text-primary" /> My Stats
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => logout()}
            size="lg"
            className="h-14 px-8 rounded-2xl text-muted-foreground"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 premium-gradient">
      {/* ── BACKGROUND ELEMENTS ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
      </div>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              EduLens AI
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogin(true)}
              className="font-semibold"
            >
              Sign in
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 mb-8 text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Nira Hackathon 2026 · Transforming Education
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-8"
            >
              The AI that reads{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                  how you think
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 h-1.5 bg-primary/20 rounded-full"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl"
            >
              EduLens doesn't ask you to pick A, B, or C. It asks you to{" "}
              <span className="text-foreground font-semibold underline decoration-primary/30 underline-offset-4">
                explain
              </span>{" "}
              — then uses advanced NLP to decode your mental models.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Button
                size="lg"
                className="text-base px-10 h-14 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                onClick={() =>
                  document
                    .getElementById("auth-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Start Learning Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-10 h-14 rounded-2xl border-border/60 hover:bg-muted/50 transition-all"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See the NLP Moat
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground font-medium"
            >
              {[
                { text: "No credit card required", icon: Lock },
                { text: "Groq-powered (< 2s)", icon: Zap },
                { text: "Worldwide access", icon: Globe },
              ].map((t, idx) => (
                <span key={idx} className="flex items-center gap-2 group">
                  <t.icon className="w-4 h-4 text-emerald-500 transition-transform group-hover:scale-110" />{" "}
                  {t.text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Auth Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            id="auth-form"
          >
            <Card className="glass-card relative overflow-hidden border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <CardContent className="relative z-10 pt-8 pb-8 px-8 sm:px-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? "login" : "signup"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        {isLogin ? (
                          <Users className="w-6 h-6 text-primary" />
                        ) : (
                          <GraduationCap className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        {isLogin ? "Welcome back" : "Join the future"}
                      </h2>
                    </div>
                    <p className="text-muted-foreground mb-8 text-sm sm:text-base">
                      {isLogin
                        ? "Continue your mastery journey where you left off."
                        : "Create your student or teacher profile to begin."}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {!isLogin && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              Full Name
                            </label>
                            <Input
                              data-testid="input-name"
                              placeholder="Alex Thompson"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="h-12 bg-muted/30 border-border/40 focus:bg-background transition-all"
                              disabled={loading}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                Role
                              </label>
                              <Select
                                value={role}
                                onValueChange={setRole}
                                disabled={loading}
                              >
                                <SelectTrigger className="h-12 bg-muted/30 border-border/40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="student">
                                    Student
                                  </SelectItem>
                                  <SelectItem value="educator">
                                    Educator
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {role === "educator" && (
                              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                  Secret Code
                                </label>
                                <Input
                                  type="password"
                                  placeholder="••••"
                                  value={educatorCode}
                                  onChange={(e) =>
                                    setEducatorCode(e.target.value)
                                  }
                                  className="h-12 bg-muted/30 border-border/40"
                                  disabled={loading}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                          Email Address
                        </label>
                        <Input
                          data-testid="input-email"
                          type="email"
                          placeholder="name@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 bg-muted/30 border-border/40 focus:bg-background transition-all"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 bg-muted/30 border-border/40 focus:bg-background transition-all"
                          required
                          disabled={loading}
                        />
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-sm font-semibold text-rose-500 bg-rose-500/10 p-3 rounded-lg flex items-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" /> {error}
                        </motion.p>
                      )}

                      <Button
                        data-testid="button-submit-auth"
                        type="submit"
                        className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/25 mt-4"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            {isLogin ? "Sign In" : "Start Mastering"}{" "}
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border/40 text-center">
                      <p className="text-sm text-muted-foreground">
                        {isLogin
                          ? "First time using EduLens?"
                          : "Already have a mastery profile?"}
                        <button
                          data-testid="button-toggle-auth"
                          type="button"
                          onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                          }}
                          className="ml-2 text-primary hover:text-primary/80 font-bold transition-colors"
                        >
                          {isLogin ? "Create an account" : "Sign in here"}
                        </button>
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section className="border-y border-border/40 bg-muted/30 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <motion.div
              key={s.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-black text-primary mb-2">
                {s.value}
              </div>
              <div className="text-sm font-bold mb-1 tracking-tight">
                {s.label}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {s.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ── */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full px-4 py-1.5 mb-8 text-xs font-bold uppercase tracking-widest"
        >
          The Problem
        </motion.div>
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-8 tracking-tight">
          Traditional ed-tech tests recall.
          <br />
          <span className="text-muted-foreground">Not understanding.</span>
        </h2>
        <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto mb-12">
          When a student picks the wrong answer on a multiple-choice quiz, the
          platform knows they got it wrong. But it doesn't know{" "}
          <em className="text-foreground">why</em> they're confused.
          <strong className="text-foreground"> EduLens fixes this.</strong>
        </p>
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <Card className="border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/[0.08] transition-colors">
            <CardContent className="pt-8 pb-8 px-8">
              <h3 className="font-bold text-lg text-rose-500 mb-4 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 rotate-90" /> Traditional
                Platforms
              </h3>
              <ul className="space-y-3 text-muted-foreground font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
                  Multiple choice — tests memorization
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
                  "Wrong answer" feedback with no "Why"
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
                  Same generic path for every student
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/[0.08] transition-colors shadow-xl shadow-emerald-500/5">
            <CardContent className="pt-8 pb-8 px-8">
              <h3 className="font-bold text-lg text-emerald-500 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> EduLens AI
              </h3>
              <ul className="space-y-3 text-muted-foreground font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                  Free-text — tests deep reasoning
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                  AI identifies exact gaps & misconceptions
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                  Adaptive path tailored to your brain
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        className="bg-muted/30 border-y border-border/40 backdrop-blur-sm relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest"
            >
              How It Works
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Four steps to genuine mastery
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%+24px)] w-[calc(100%-48px)] h-px bg-border/60 z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-card border border-border/50 shadow-xl flex items-center justify-center mb-6 hover:rotate-6 transition-transform">
                    <span className="text-3xl font-black text-primary">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest"
          >
            Features
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Everything built for impact
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border border-border/50 hover:border-primary/40 transition-all group h-full bg-card/40 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                <CardContent className="pt-8 pb-8 px-8">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${f.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-border/40 py-24 lg:py-32">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-black mb-8 tracking-tight leading-tight"
          >
            The future of learning
            <br />
            <span className="text-primary">is personal.</span>
          </motion.h2>
          <p className="text-muted-foreground text-xl mb-12 max-w-xl mx-auto font-medium">
            Join the Nira Hackathon beta and experience what it feels like when
            an AI truly understands how <em>you</em> think.
          </p>
          <Button
            size="lg"
            className="text-lg px-12 h-16 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:scale-105"
            onClick={() =>
              document
                .getElementById("auth-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Start Mastering Now <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 bg-muted/40 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                EduLens AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              © 2026 EduLens AI · Transforming the Future of Education
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex items-center gap-6">
              {["Platform", "NLP Technology", "For Educators", "Privacy"].map(
                (link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm font-bold hover:text-primary transition-colors"
                  >
                    {link}
                  </a>
                ),
              )}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-4">
              Powered by Groq & Llama 3.1
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
