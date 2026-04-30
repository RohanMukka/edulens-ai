import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, MessageCircle, ThumbsUp, Sparkles, User, Brain, Search, Plus, Loader2, Send, Filter, Hash, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Forums() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const { toast } = useToast();
  
  const qc = useQueryClient();
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadCategory, setNewThreadCategory] = useState("General");

  const { data: threads, isLoading } = useQuery<any[]>({
    queryKey: ["/api/forums/threads"],
    queryFn: async () => (await apiRequest("GET", "/api/forums/threads")).json(),
  });

  const { data: posts, isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/forums/threads", activeThread, "posts"],
    queryFn: async () => (await apiRequest("GET", `/api/forums/threads/${activeThread}/posts`)).json(),
    enabled: activeThread !== null
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: { title: string, content: string, category: string }) => {
      const res = await apiRequest("POST", "/api/forums/threads", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/forums/threads"] });
      setIsCreating(false);
      setNewThreadTitle("");
      setNewPostContent("");
      toast({ title: "Thread Created!", description: "Your peers can now see your question." });
    }
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { threadId: number, content: string }) => {
      const res = await apiRequest("POST", `/api/forums/threads/${data.threadId}/posts`, { content: data.content });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/forums/threads", activeThread, "posts"] });
      qc.invalidateQueries({ queryKey: ["/api/forums/threads"] }); 
      setNewPostContent("");
      toast({ title: "Reply Posted!", description: "Your contribution has been saved." });
    }
  });

  const filteredThreads = threads?.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateThread = () => {
    if (!newThreadTitle.trim() || !newPostContent.trim()) {
      toast({ title: "Missing Fields", description: "Please provide a title and content.", variant: "destructive" });
      return;
    }
    createThreadMutation.mutate({ 
      title: newThreadTitle, 
      content: newPostContent, 
      category: newThreadCategory
    });
  };

  const handleReply = (threadId: number) => {
    if (!newPostContent.trim()) return;
    replyMutation.mutate({ threadId, content: newPostContent });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (activeThread !== null) setActiveThread(null);
                else if (isCreating) setIsCreating(false);
                else setLocation("/subjects");
              }} 
              className="mb-4 hover:bg-blue-500/10 hover:text-blue-500 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
              {activeThread !== null || isCreating ? "Back to Hub" : "Back to Learning"}
            </Button>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Collaborative <span className="text-blue-500">Hub</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Exchange insights, solve blockers, and get AI-verified answers from the community.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Search topics..." 
                className="pl-10 bg-card/50 backdrop-blur-md border-border/50 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {!isCreating && activeThread === null && (
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6" onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" /> Start Discussion
              </Button>
            )}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CONTENT AREA */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {/* CREATE THREAD FORM */}
              {isCreating && (
                <motion.div 
                  key="create" 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <Card className="glass-card border-border/40 overflow-hidden">
                    <CardHeader className="bg-blue-500/5 border-b border-border/40 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold">New Discussion</CardTitle>
                          <p className="text-muted-foreground text-sm">Ask a question or share an insight.</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground ml-1">Topic Title</label>
                        <Input 
                          placeholder="What would you like to discuss?" 
                          value={newThreadTitle} 
                          onChange={e => setNewThreadTitle(e.target.value)} 
                          className="text-lg font-medium bg-muted/20 border-border/40 h-14"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground ml-1">Category</label>
                        <div className="flex flex-wrap gap-2">
                          {["General", "Biology", "Math", "Computer Science", "History", "Physics"].map(cat => (
                            <button 
                              key={cat} 
                              onClick={() => setNewThreadCategory(cat)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                                newThreadCategory === cat 
                                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" 
                                  : "bg-card/50 text-muted-foreground border-border/40 hover:border-blue-500/50"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground ml-1">Content</label>
                        <Textarea 
                          placeholder="Describe your question or idea in detail. Be as specific as possible!" 
                          value={newPostContent} 
                          onChange={e => setNewPostContent(e.target.value)} 
                          className="min-h-[200px] bg-muted/20 border-border/40 text-base leading-relaxed resize-none focus:ring-blue-500/20" 
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 p-8 bg-muted/10 border-t border-border/40">
                      <Button variant="ghost" onClick={() => setIsCreating(false)} className="px-6 h-12">Cancel</Button>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 px-8 h-12 text-base font-bold shadow-xl shadow-blue-600/20" 
                        onClick={handleCreateThread}
                        disabled={createThreadMutation.isPending}
                      >
                        {createThreadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Post Thread
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}

              {/* LIST THREADS */}
              {activeThread === null && !isCreating && (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <Card key={i} className="border-border/30 overflow-hidden">
                        <CardContent className="p-0 h-40 bg-card/30 backdrop-blur-sm animate-pulse" />
                      </Card>
                    ))
                  ) : filteredThreads.map((thread, idx) => (
                    <motion.div 
                      key={thread.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card 
                        className="glass-card group cursor-pointer border-border/40 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/5 transition-all overflow-hidden relative"
                        onClick={() => setActiveThread(thread.id)}
                      >
                        <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                        <CardContent className="p-8">
                          <div className="flex gap-6">
                            <div className="hidden sm:flex flex-col items-center gap-2">
                              <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center border border-blue-500/10 group-hover:scale-110 transition-transform">
                                <User className="w-7 h-7 text-blue-500" />
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{thread.replyCount} Posts</span>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between items-start">
                                <Badge className="bg-blue-500/10 text-blue-500 border-none px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
                                  {thread.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {new Date(thread.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <h3 className="text-2xl font-bold group-hover:text-blue-500 transition-colors leading-tight tracking-tight">
                                {thread.title}
                              </h3>
                              <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                                {thread.content}
                              </p>
                              <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm font-semibold text-foreground/70">{thread.authorName}</span>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground">
                                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"><MessageCircle className="w-4 h-4 text-blue-400" /> View Discussion</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {filteredThreads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card/20 rounded-[2rem] border border-dashed border-border/50">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                        <Search className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">No discussions found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or start a new topic!</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ACTIVE THREAD VIEW */}
              {activeThread !== null && !isCreating && (() => {
                const thread = threads?.find(t => t.id === activeThread);
                if (!thread) return null;
                
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
                    {/* ORIGINAL POST */}
                    <Card className="glass-card border-l-[6px] border-l-blue-600 border-border/40 overflow-hidden shadow-2xl">
                      <CardContent className="p-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-lg tracking-tight leading-none">{thread.authorName}</p>
                              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">Topic Starter</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-border/60 px-3 py-1 font-bold text-xs uppercase tracking-widest">
                            {thread.category}
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-3xl font-black tracking-tighter leading-tight">{thread.title}</h2>
                          <div className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                            {thread.content}
                          </div>
                        </div>
                        <div className="pt-6 border-t border-border/40 flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(thread.createdAt).toLocaleString()}</span>
                          <span className="flex items-center gap-2"><Hash className="w-4 h-4" /> Thread ID: {thread.id}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* REPLIES SECTION */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-blue-500" />
                          Discussion Flow <span className="text-muted-foreground/50 ml-1">({posts?.length || 0})</span>
                        </h3>
                      </div>
                      
                      <div className="space-y-6">
                        {postsLoading && (
                          <div className="flex flex-col items-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Conversation...</p>
                          </div>
                        )}
                        
                        {posts?.map((reply, idx) => (
                          <motion.div 
                            key={reply.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <Card className={`glass-card border-border/40 overflow-hidden relative transition-all ${reply.isAiVerified ? 'ring-2 ring-violet-500/50 shadow-2xl shadow-violet-500/10' : ''}`}>
                              {reply.isAiVerified && (
                                <div className="absolute top-0 right-0 p-1 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-lg">
                                  AI Verified Solution
                                </div>
                              )}
                              <CardContent className="p-8">
                                <div className="flex gap-5">
                                  <div className="shrink-0 flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                      reply.isAiVerified 
                                        ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/30' 
                                        : 'bg-muted/50 text-muted-foreground border border-border/50'
                                    }`}>
                                      {reply.isAiVerified ? <Brain className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                    </div>
                                    <div className="h-full w-px bg-gradient-to-b from-border/50 to-transparent" />
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <span className={`font-black tracking-tight ${reply.isAiVerified ? 'text-violet-600 dark:text-violet-400 text-lg' : 'text-foreground'}`}>
                                        {reply.authorName}
                                      </span>
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-0.5">
                                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    
                                    <p className={`text-base leading-relaxed ${reply.isAiVerified ? 'text-foreground font-semibold' : 'text-foreground/80 font-medium'}`}>
                                      {reply.content}
                                    </p>
                                    
                                    {reply.isAiVerified && (
                                      <div className="mt-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 flex items-start gap-3">
                                        <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-1" />
                                        <p className="text-[11px] font-bold text-violet-600/80 uppercase tracking-wider leading-relaxed">
                                          This response has been cross-referenced with educational standards and verified by the EduLens AI Engine for conceptual accuracy.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* REPLY COMPOSER */}
                    <Card className="glass-card border-t-4 border-t-blue-600 border-border/40 shadow-2xl overflow-hidden mt-12 mb-20">
                      <CardContent className="p-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-black text-lg tracking-tight">Contribute to discussion</h4>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Share your perspective or solution</p>
                          </div>
                        </div>
                        <Textarea 
                          placeholder="Type your thoughtful reply here..." 
                          className="bg-muted/20 border-border/40 min-h-[160px] mb-6 text-base leading-relaxed p-6 focus:ring-blue-500/20"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                        />
                        <div className="flex justify-end items-center gap-6">
                          <p className="text-xs font-bold text-muted-foreground hidden sm:block">
                            <Sparkles className="w-3 h-3 inline mr-1 text-violet-500" /> AI verified badge awarded for high-quality solutions
                          </p>
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700 px-10 h-14 text-lg font-black tracking-tight shadow-xl shadow-blue-600/20" 
                            onClick={() => handleReply(thread.id)}
                            disabled={replyMutation.isPending || !newPostContent.trim()}
                          >
                            {replyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Post Reply <Send className="w-4 h-4 ml-2" /></>}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* SIDEBAR NAVIGATION */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card border-border/40 overflow-hidden sticky top-24">
              <CardHeader className="pb-4 pt-8 px-8 border-b border-border/40">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Discover Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Search in sidebar for mobile/alternate view */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Search Keywords</h4>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. Mitochondria" 
                      className="pl-10 bg-muted/20 border-border/40 h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Academic Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Biology", "Math", "Physics", "Chemistry", "History", "CS"].map(tag => (
                      <Badge 
                        key={tag} 
                        variant={searchQuery.toLowerCase() === tag.toLowerCase() ? "default" : "outline"} 
                        className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          searchQuery.toLowerCase() === tag.toLowerCase() 
                            ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20' 
                            : 'bg-card/50 border-border/40 hover:border-blue-500/50'
                        }`}
                        onClick={() => setSearchQuery(searchQuery.toLowerCase() === tag.toLowerCase() ? "" : tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-violet-600/10 via-blue-600/10 to-transparent border border-blue-500/20 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                  <div className="relative z-10 text-center space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-background flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/10 border border-blue-500/10">
                      <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight mb-2 italic">AI-Verified Accuracy</h4>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Our EduLens AI engine monitors all discussions to verify correct answers and prevent academic misconceptions.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-blue-500/30 text-blue-500 font-bold uppercase tracking-widest text-[10px] h-10 hover:bg-blue-500 hover:text-white">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
