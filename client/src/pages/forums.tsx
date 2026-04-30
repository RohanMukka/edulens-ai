import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, MessageCircle, ThumbsUp, Sparkles, User, Brain, Search, Plus, Loader2 } from "lucide-react";
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
      qc.invalidateQueries({ queryKey: ["/api/forums/threads"] }); // Update reply count
      setNewPostContent("");
      toast({ title: "Reply Posted!", description: "Your contribution has been saved." });
    }
  });

  const filteredThreads = threads?.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateThread = () => {
    if (!newThreadTitle.trim() || !newPostContent.trim()) return;
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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => {
              if (activeThread !== null) setActiveThread(null);
              else setLocation("/dashboard");
            }} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> {activeThread !== null ? "Back to Forums" : "Back to Dashboard"}
            </Button>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-500" />
              </div>
              Peer Collaboration Hub
            </h1>
            <p className="text-muted-foreground mt-1">Discuss concepts, ask questions, and learn together.</p>
          </div>
          
          {activeThread === null && !isCreating && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Discussion
            </Button>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            
            {/* Create Thread View */}
            {isCreating && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-border/50 shadow-md">
                  <CardHeader>
                    <CardTitle>Start a Discussion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-bold">Title</label>
                      <Input placeholder="What do you need help with?" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} className="mt-1 bg-muted/50" />
                    </div>
                    <div>
                      <label className="text-sm font-bold">Category</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["General", "Biology", "Math", "Computer Science", "History"].map(cat => (
                          <Badge 
                            key={cat} 
                            variant={newThreadCategory === cat ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1"
                            onClick={() => setNewThreadCategory(cat)}
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold">Details</label>
                      <Textarea 
                        placeholder="Explain your question in detail... The AI will verify the first correct answer!" 
                        value={newPostContent} 
                        onChange={e => setNewPostContent(e.target.value)} 
                        className="mt-1 bg-muted/50 min-h-[150px] resize-none focus:ring-blue-500/50" 
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3 border-t p-4 bg-muted/20">
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateThread}>Post Thread</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {/* List Threads View */}
            {activeThread === null && !isCreating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <Card key={i} className="border-border/20 animate-pulse">
                      <CardContent className="p-5 h-32 bg-muted/20" />
                    </Card>
                  ))
                ) : filteredThreads.map(thread => (
                  <Card 
                    key={thread.id} 
                    className="border-border/50 hover:border-blue-500/50 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden bg-card/50 backdrop-blur-sm"
                    onClick={() => setActiveThread(thread.id)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500/50 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                    <CardContent className="p-6">
                      <div className="flex gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center shrink-0 border border-blue-500/10">
                          <User className="w-6 h-6 text-blue-500/70" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl group-hover:text-blue-500 transition-colors tracking-tight">{thread.title}</h3>
                            <Badge variant="secondary" className="bg-blue-500/5 text-blue-600 border-blue-500/10 px-2.5 py-0.5">{thread.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{thread.content}</p>
                          <div className="flex items-center gap-5 text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-blue-400" /> {thread.replyCount} Replies</span>
                            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> {thread.authorName}</span>
                            <span>{new Date(thread.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredThreads.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No discussions found.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Active Thread View */}
            {activeThread !== null && !isCreating && (() => {
              const thread = threads?.find(t => t.id === activeThread);
              if (!thread) return null;
              
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Original Post */}
                  <Card className="border-border/50 shadow-sm border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{thread.authorName}</p>
                          <p className="text-xs text-muted-foreground">Original Poster</p>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold mb-3">{thread.title}</h2>
                      <p className="text-foreground/80 leading-relaxed mb-4">{thread.content}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{thread.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Replies */}
                  <h3 className="font-bold text-lg px-2">Replies ({posts?.length || 0})</h3>
                  <div className="space-y-4">
                    {postsLoading && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}
                    {posts?.map((reply, idx) => (
                      <Card key={reply.id} className={`border-border/50 shadow-sm ${reply.isAiVerified ? 'bg-violet-500/5 border-violet-500/30' : ''}`}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reply.isAiVerified ? 'bg-violet-500/20 text-violet-600' : 'bg-muted text-muted-foreground'}`}>
                                {reply.isAiVerified ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                              </div>
                              <p className={`font-bold text-sm ${reply.isAiVerified ? 'text-violet-600 dark:text-violet-400' : ''}`}>
                                {reply.authorName}
                              </p>
                            </div>
                            {reply.isAiVerified && (
                              <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
                                <Sparkles className="w-3 h-3 mr-1" /> AI Verified Solution
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{reply.content}</p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(reply.createdAt).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Add Reply */}
                  <Card className="border-border/50 shadow-sm mt-8">
                    <CardContent className="p-5">
                      <h4 className="font-bold text-sm mb-3">Add your perspective</h4>
                      <Textarea 
                        placeholder="Type your reply here..." 
                        className="bg-muted/30 min-h-[100px] mb-3"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleReply(thread.id)}>
                          Post Reply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}
          </div>

          {/* SIDEBAR */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search discussions..." 
                    className="pl-9 bg-muted/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3 pt-5">
                <CardTitle className="text-sm">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex flex-wrap gap-2">
                {["Biology", "Math", "Study Tips", "Photosynthesis", "Midterms"].map(tag => (
                  <Badge 
                    key={tag} 
                    variant={searchQuery.toLowerCase() === tag.toLowerCase() ? "default" : "outline"} 
                    className="cursor-pointer"
                    onClick={() => setSearchQuery(searchQuery.toLowerCase() === tag.toLowerCase() ? "" : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-violet-500/10 to-blue-500/10">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Sparkles className="w-6 h-6 text-violet-500" />
                </div>
                <h4 className="font-bold text-sm mb-1">AI Verified Answers</h4>
                <p className="text-xs text-muted-foreground">
                  Our EduLens AI monitors discussions and automatically verifies correct answers to prevent the spread of misconceptions!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
