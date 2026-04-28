import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, MessageCircle, ThumbsUp, Sparkles, User, Brain, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock Data for Hackathon
const MOCK_THREADS = [
  {
    id: 1,
    author: "Alex Chen",
    title: "Help with Calvin Cycle Carbon counting?",
    content: "I'm struggling to understand how the 3 RuBP molecules end up making exactly one G3P that exits the cycle. Where do the carbons go?",
    tags: ["Biology", "Photosynthesis"],
    likes: 12,
    replies: [
      {
        author: "Sarah Jenkins",
        content: "Think of it like currency. 3 RuBP (15 carbons) + 3 CO2 (3 carbons) = 18 carbons total. That splits into 6 G3P (18 carbons). One leaves (3 carbons), and 5 stay (15 carbons) to remake the 3 RuBP!",
        isAiVerified: false,
        likes: 5
      },
      {
        author: "EduLens AI Assistant",
        content: "Sarah's explanation is completely correct! To visualize it: 5 G3P molecules (each with 3 carbons) are rearranged through a complex series of reactions using ATP to form 3 molecules of RuBP (each with 5 carbons).",
        isAiVerified: true,
        likes: 24
      }
    ]
  },
  {
    id: 2,
    author: "Marcus Johnson",
    title: "What's the best way to memorize the steps of Mitosis?",
    content: "I keep mixing up Metaphase and Anaphase. Any good mnemonic devices?",
    tags: ["Biology", "Study Tips"],
    likes: 8,
    replies: [
      {
        author: "Emma Watson",
        content: "I use PMAT! Prophase (Prepare), Metaphase (Middle), Anaphase (Apart), Telophase (Two).",
        isAiVerified: false,
        likes: 15
      }
    ]
  }
];

export default function Forums() {
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const { toast } = useToast();
  
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateThread = () => {
    if (!newThreadTitle.trim() || !newPostContent.trim()) return;
    
    const newThread = {
      id: threads.length + 1,
      author: student?.name || "Student",
      title: newThreadTitle,
      content: newPostContent,
      tags: ["General"],
      likes: 0,
      replies: []
    };
    
    setThreads([newThread, ...threads]);
    setIsCreating(false);
    setNewThreadTitle("");
    setNewPostContent("");
    toast({ title: "Thread Created!", description: "Your peers can now see your question." });
  };

  const handleReply = (threadId: number) => {
    if (!newPostContent.trim()) return;
    
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          replies: [...t.replies, {
            author: student?.name || "Student",
            content: newPostContent,
            isAiVerified: false,
            likes: 0
          }]
        };
      }
      return t;
    }));
    
    setNewPostContent("");
    toast({ title: "Reply sent!", description: "Thanks for helping out your peers." });
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
                      <label className="text-sm font-bold">Details</label>
                      <Textarea placeholder="Explain your question in detail..." value={newPostContent} onChange={e => setNewPostContent(e.target.value)} className="mt-1 bg-muted/50 min-h-[150px] resize-none" />
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
                {filteredThreads.map(thread => (
                  <Card 
                    key={thread.id} 
                    className="border-border/50 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => setActiveThread(thread.id)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors">{thread.title}</h3>
                            <div className="flex gap-1">
                              {thread.tags.map(t => (
                                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{thread.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {thread.replies.length} Replies</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {thread.likes} Likes</span>
                            <span>By {thread.author}</span>
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
              const thread = threads.find(t => t.id === activeThread);
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
                          <p className="font-bold text-sm">{thread.author}</p>
                          <p className="text-xs text-muted-foreground">Original Poster</p>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold mb-3">{thread.title}</h2>
                      <p className="text-foreground/80 leading-relaxed mb-4">{thread.content}</p>
                      <div className="flex gap-2">
                        {thread.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Replies */}
                  <h3 className="font-bold text-lg px-2">Replies ({thread.replies.length})</h3>
                  <div className="space-y-4">
                    {thread.replies.map((reply, idx) => (
                      <Card key={idx} className={`border-border/50 shadow-sm ${reply.isAiVerified ? 'bg-violet-500/5 border-violet-500/30' : ''}`}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reply.isAiVerified ? 'bg-violet-500/20 text-violet-600' : 'bg-muted text-muted-foreground'}`}>
                                {reply.isAiVerified ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                              </div>
                              <p className={`font-bold text-sm ${reply.isAiVerified ? 'text-violet-600 dark:text-violet-400' : ''}`}>
                                {reply.author}
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
                            <Button variant="ghost" size="sm" className="h-6 px-2"><ThumbsUp className="w-3 h-3 mr-1" /> {reply.likes}</Button>
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
