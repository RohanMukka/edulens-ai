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
import { useTheme } from "@/lib/theme";
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
  Eye,
  EyeOff,
  Sun,
  Moon,
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
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [educatorCode, setEducatorCode] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[140px] animate-pulse-slow" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[140px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

        {/* Floating background shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] opacity-20"
        >
          <Brain className="w-24 h-24 text-primary blur-sm" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[15%] opacity-20"
        >
          <Sparkles className="w-32 h-32 text-purple-500 blur-sm" />
        </motion.div>
      </div>

      {/* ── NAV ── */}
      <nav className="nav-glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-black text-2xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
              EduLens <span className="text-primary">AI</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="hidden md:flex items-center gap-8 mr-4">
              {["Features", "Methodology", "Showcase"].map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    document
                      .getElementById(item.toLowerCase().replace(" ", "-"))
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/demo")}
              className="hidden sm:flex font-bold border-primary/20 text-primary hover:bg-primary/5 rounded-full px-6"
            >
              See It Work
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full hover:bg-white/5 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogin(true)}
              className="font-bold rounded-full px-6"
            >
              Sign in
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-32 xl:gap-40 items-center">
          {/* Left: Copy */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-5 py-2 mb-8 text-xs font-black uppercase tracking-[0.2em]"
            >
              <Sparkles className="w-4 h-4" />
              Agentic EdTech · Transforming Education
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl sm:text-7xl lg:text-[4rem] xl:text-[5.5rem] 2xl:text-8xl font-black tracking-tight leading-[0.95] mb-10"
            >
              Mastery through <br />
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-400 bg-clip-text text-transparent text-glow">
                  Understanding
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="absolute -bottom-3 left-0 h-2 bg-primary/20 rounded-full"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-xl font-medium"
            >
              EduLens analyzes your free-text explanations — not just multiple
              choice — to decode your{" "}
              <span className="text-foreground font-bold">mental models</span>{" "}
              in real time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:row gap-6 mb-16"
            >
              <Button
                size="lg"
                className="text-lg px-12 h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 shadow-[0_20px_40px_rgba(var(--primary),0.3)] hover:shadow-[0_20px_50px_rgba(var(--primary),0.4)] transition-all hover:-translate-y-1 group"
                onClick={() =>
                  document
                    .getElementById("auth-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Start Learning Free
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-16 rounded-[1.5rem] border-white/10 hover:bg-white/5 transition-all"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Our Methodology
                </Button>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-muted-foreground font-bold"
            >
              {[
                { text: "Secure Auth", icon: Lock },
                { text: "Inference < 2s", icon: Zap },
                { text: "Global Scale", icon: Globe },
              ].map((t, idx) => (
                <span key={idx} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <t.icon className="w-4 h-4 text-primary transition-transform group-hover:scale-110" />
                  </div>
                  {t.text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Auth Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
            id="auth-form"
            className="relative"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-[100px] rounded-full opacity-50" />
            <Card className="glass-card relative overflow-hidden border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
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
                        <div className="relative group/pass">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 bg-muted/30 border-border/40 focus:bg-background transition-all pr-12"
                            required
                            disabled={loading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
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
      <section className="border-y border-white/5 bg-white/[0.02] backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((s, idx) => (
            <motion.div
              key={s.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center group"
            >
              <div className="text-5xl font-black text-primary mb-3 group-hover:scale-110 transition-transform duration-500 font-display">
                {s.value}
              </div>
              <div className="text-sm font-bold mb-1.5 tracking-tight uppercase text-foreground/80">
                {s.label}
              </div>
              <div className="text-xs text-muted-foreground font-semibold">
                {s.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── AI PIPELINE EVIDENCE ── */}
      <section
        id="showcase"
        className="max-w-7xl mx-auto px-6 py-32 relative z-10"
      >
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-500 border border-violet-500/20 rounded-full px-5 py-2 mb-8 text-xs font-black uppercase tracking-widest"
          >
            <Brain className="w-4 h-4" /> Live AI Pipeline
          </motion.div>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-6 font-display">
            The engine behind the <br />
            <span className="bg-gradient-to-r from-violet-400 to-primary bg-clip-text text-transparent">
              reasoning diagnosis
            </span>
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium">
            Not just "right or wrong" — our multi-agent pipeline decodes{" "}
            <em>why</em> a student is confused and prescribes the exact next
            step.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-16">
          {[
            {
              step: "01",
              title: "Student Explains",
              desc: "Free-text response — no MCQ, no guessing",
              icon: "✍️",
              color:
                "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
            },
            {
              step: "02",
              title: "Gatekeeper Agent",
              desc: "Anti-plagiarism & jailbreak detection",
              icon: "🛡️",
              color:
                "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400",
            },
            {
              step: "03",
              title: "Diagnostic Agent",
              desc: "6-type misconception taxonomy + NLP scoring",
              icon: "🧠",
              color:
                "from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400",
            },
            {
              step: "04",
              title: "Bloom's Classifier",
              desc: "Cognitive depth: Remembering → Creating",
              icon: "📊",
              color:
                "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
            },
            {
              step: "05",
              title: "Adaptive Engine",
              desc: "SM-2 spaced repetition + Socratic tutoring",
              icon: "🎯",
              color:
                "from-primary/20 to-primary/5 border-primary/20 text-primary",
            },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-[2rem] border p-8 text-center bg-gradient-to-br ${s.color} backdrop-blur-sm transition-all hover:-translate-y-2 hover:shadow-2xl shadow-primary/5 group`}
            >
              <div className="text-4xl mb-6 group-hover:scale-125 transition-transform duration-500">
                {s.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">
                Step {s.step}
              </p>
              <p className="font-bold text-lg mb-2 font-display leading-tight">
                {s.title}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full h-16 px-12 text-lg border-primary/30 text-primary hover:bg-primary/5 shadow-2xl shadow-primary/10 group font-bold"
            onClick={() => setLocation("/demo")}
          >
            <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />{" "}
            Try the Live Demo
          </Button>
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ── */}
      <section className="max-w-5xl mx-auto px-6 py-32 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full px-5 py-2 mb-10 text-xs font-black uppercase tracking-widest"
        >
          The Problem
        </motion.div>
        <h2 className="text-5xl sm:text-6xl font-black mb-10 tracking-tight font-display leading-tight">
          Traditional ed-tech tests recall. <br />
          <span className="text-muted-foreground/60">Not understanding.</span>
        </h2>
        <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto mb-16 font-medium">
          When a student picks the wrong answer on a multiple-choice quiz, the
          platform knows they got it wrong. But it doesn't know{" "}
          <em className="text-foreground">why</em> they're confused.
          <strong className="text-foreground"> EduLens fixes this.</strong>
        </p>
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] hover:bg-white/[0.04] transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <CardContent className="pt-10 pb-10 px-10 relative z-10">
              <h3 className="font-display font-bold text-2xl text-rose-500 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10">
                  <ArrowUpRight className="w-6 h-6 rotate-90" />
                </div>
                Legacy Platforms
              </h3>
              <ul className="space-y-4 text-muted-foreground font-bold">
                <li className="flex items-center gap-4 group/item">
                  <div className="w-2 h-2 rounded-full bg-rose-500/40 group-hover/item:scale-150 transition-transform" />
                  Multiple choice — tests memorization
                </li>
                <li className="flex items-center gap-4 group/item">
                  <div className="w-2 h-2 rounded-full bg-rose-500/40 group-hover/item:scale-150 transition-transform" />
                  "Wrong answer" feedback with no "Why"
                </li>
                <li className="flex items-center gap-4 group/item">
                  <div className="w-2 h-2 rounded-full bg-rose-500/40 group-hover/item:scale-150 transition-transform" />
                  Same generic path for every student
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl rounded-[2.5rem] hover:bg-primary/[0.08] transition-all group overflow-hidden shadow-2xl shadow-primary/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <CardContent className="pt-10 pb-10 px-10 relative z-10">
              <h3 className="font-display font-bold text-2xl text-emerald-400 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                EduLens <span className="text-primary ml-1">AI</span>
              </h3>
              <ul className="space-y-4 text-muted-foreground font-bold">
                <li className="flex items-center gap-4 group/item">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 group-hover/item:scale-150 transition-transform" />
                  Free-text — tests deep reasoning
                </li>
                <li className="flex items-center gap-4 group/item">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 group-hover/item:scale-150 transition-transform" />
                  AI identifies exact gaps & misconceptions
                </li>
                <li className="flex items-center gap-4 group/item">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 group-hover/item:scale-150 transition-transform" />
                  Adaptive path tailored to your brain
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── METHODOLOGY ── */}
      <section
        id="methodology"
        className="bg-white/[0.02] border-y border-white/5 backdrop-blur-md relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-5 py-2 mb-8 text-xs font-black uppercase tracking-widest"
            >
              The Methodology
            </motion.div>
            <h2 className="text-5xl sm:text-6xl font-black tracking-tight font-display">
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
                className="relative group"
              >
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(100%+24px)] w-[calc(100%-48px)] h-px bg-white/10 z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-2xl flex items-center justify-center mb-8 group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-primary/20">
                    <span className="text-4xl font-black text-primary font-display">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-display">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-bold text-sm">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-6 py-32 relative z-10"
      >
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-5 py-2 mb-8 text-xs font-black uppercase tracking-widest"
          >
            Core Features
          </motion.div>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight font-display">
            Built for maximum impact
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="premium-card h-full group bg-white/[0.01] hover:bg-white/[0.03] border-white/5 hover:border-primary/30 transition-all duration-500">
                <CardContent className="pt-10 pb-10 px-10">
                  <div
                    className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}
                  >
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-display leading-tight group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-bold text-sm">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-white/5 py-32 lg:py-48">
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-6xl sm:text-7xl font-black mb-10 tracking-tight leading-tight font-display"
          >
            The future of learning <br />
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent text-glow">
              is personal.
            </span>
          </motion.h2>
          <p className="text-muted-foreground text-xl mb-16 max-w-xl mx-auto font-bold">
            Join the EduLens Alpha and experience what it feels like when an AI
            truly understands how <em>you</em> think.
          </p>
          <Button
            size="lg"
            className="text-xl px-16 h-20 rounded-[2rem] bg-primary hover:bg-primary/90 shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:shadow-[0_20px_60px_rgba(var(--primary),0.5)] transition-all hover:-translate-y-2 group font-black"
            onClick={() =>
              document
                .getElementById("auth-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Start Mastering Now
            <ArrowRight className="ml-4 w-7 h-7 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-24 relative z-10 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[150px] -z-10 rounded-full" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div
            className="flex items-center gap-4 group cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display font-black text-3xl tracking-tight">
              EduLens <span className="text-primary">AI</span>
            </span>
          </div>
          <div className="flex gap-12 text-sm font-black text-muted-foreground">
            {["Privacy", "Terms", "Contact", "Showcase"].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-primary transition-colors uppercase tracking-widest"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="text-sm text-muted-foreground/40 font-bold">
            &copy; {new Date().getFullYear()} EduLens AI.{" "}
            <br className="md:hidden" /> Crafted for the Next Generation.
          </p>
        </div>
      </footer>
    </div>
  );
}
