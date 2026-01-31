import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Settings, FileText, ToggleLeft, ToggleRight, Download, User, Mail, LogOut, ChevronDown, FolderOpen, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuestionInput } from "@/components/question-input";
import { ChatMessage } from "@/components/chat-message";
import { ChatSidebar } from "@/components/chat-sidebar";
import { EvidencePanel } from "@/components/evidence-panel";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { ReasoningSteps } from "@/components/reasoning-steps";
import { SourceCredibility } from "@/components/source-credibility";
import { DocumentUpload } from "@/components/document-upload";
import { AnswerSkeleton, EvidenceSkeleton, GraphSkeleton, MessageSkeleton } from "@/components/loading-skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  ChatSession,
  ChatMessage as ChatMessageType,
  AnswerResponse,
  Domain,
  GraphVisualization,
} from "@shared/schema";

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain>("general");
  const [explainabilityMode, setExplainabilityMode] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerResponse | null>(null);
  const [graphData, setGraphData] = useState<GraphVisualization>({ nodes: [], edges: [] });
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: documents = [] } = useQuery<{ id: string; name: string; domain: string }[]>({
    queryKey: ["/api/documents"],
  });

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sessions", { domain: selectedDomain });
      return res.json();
    },
    onSuccess: (data: ChatSession) => {
      setCurrentSessionId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: (_, id) => {
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setCurrentAnswer(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  const askQuestionMutation = useMutation({
    mutationFn: async ({ question, sessionId, domain, explainability }: { 
      question: string; 
      sessionId: string; 
      domain: Domain; 
      explainability: boolean 
    }) => {
      const res = await apiRequest("POST", "/api/ask", {
        question,
        domain,
        sessionId,
        explainabilityMode: explainability,
      });
      return res.json();
    },
    onSuccess: (data: { answer: AnswerResponse; graphData: GraphVisualization }) => {
      setCurrentAnswer(data.answer);
      setGraphData(data.graphData);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get an answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ name, content, domain }: { name: string; content: string; domain: Domain }) => {
      const res = await apiRequest("POST", "/api/documents", { name, content, domain });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
    },
  });

  const { data: graphDataQuery } = useQuery<GraphVisualization>({
    queryKey: ["/api/graph"],
    initialData: { nodes: [], edges: [] },
  });

  useEffect(() => {
    if (graphDataQuery && graphDataQuery.nodes.length > 0) {
      setGraphData(graphDataQuery);
    }
  }, [graphDataQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  const handleNewSession = useCallback(() => {
    createSessionMutation.mutate();
  }, [createSessionMutation]);

  const handleSelectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const lastMessage = session.messages.findLast((m) => m.role === "assistant");
      if (lastMessage?.answerData) {
        setCurrentAnswer(lastMessage.answerData);
      }
    }
  }, [sessions]);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSessionMutation.mutate(id);
  }, [deleteSessionMutation]);

  const handleAskQuestion = useCallback(
    async (question: string, domain: Domain) => {
      let sessionId = currentSessionId;
      const currentExplainabilityMode = explainabilityMode;
      
      if (!sessionId) {
        const res = await apiRequest("POST", "/api/sessions", { domain });
        const newSession: ChatSession = await res.json();
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      }

      askQuestionMutation.mutate({ 
        question, 
        sessionId, 
        domain, 
        explainability: currentExplainabilityMode 
      });
    },
    [currentSessionId, explainabilityMode, askQuestionMutation, queryClient]
  );

  const handleUploadDocument = useCallback(
    async (name: string, content: string, domain: Domain) => {
      await uploadDocumentMutation.mutateAsync({ name, content, domain });
    },
    [uploadDocumentMutation]
  );

  const handleExportPDF = useCallback(() => {
    if (!currentAnswer) return;
    
    const content = `
# Answer Report

## Question
${currentSession?.messages.findLast((m) => m.role === "user")?.content || ""}

## Answer
${currentAnswer.answer}

## Confidence: ${Math.round(currentAnswer.confidence * 100)}%

## Evidence Sources
${currentAnswer.evidenceChunks.map((e) => `- ${e.documentName}: ${e.section}`).join("\n")}

${currentAnswer.reasoningSteps?.length ? `
## Reasoning Steps
${currentAnswer.reasoningSteps.map((s) => `${s.step}. ${s.description}`).join("\n")}
` : ""}
    `.trim();

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "answer-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [currentAnswer, currentSession]);

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r border-sidebar-border glass-subtle">
          <SidebarHeader className="border-b border-sidebar-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/20 neon-glow pulse-glow">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-sm gradient-text-animated">RAG + KG</h1>
                <p className="text-xs text-muted-foreground">Evidence-Aware QA</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <ChatSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
            />
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/50 glass-subtle">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-glow" />
              <h2 className="font-medium text-sm hidden sm:block gradient-text">
                {currentSession?.title || "New Conversation"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="explainability"
                  checked={explainabilityMode}
                  onCheckedChange={setExplainabilityMode}
                  data-testid="switch-explainability"
                />
                <Label htmlFor="explainability" className="text-sm cursor-pointer hidden sm:inline">
                  Explainability Mode
                </Label>
              </div>

              <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="hover-glow" data-testid="button-documents">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="gradient-text">Knowledge Base Documents</DialogTitle>
                    <DialogDescription>
                      Documents used for evidence retrieval and knowledge graph extraction
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No documents uploaded yet</p>
                      ) : (
                        documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 glass-subtle rounded-lg hover-border-glow" data-testid={`doc-item-${doc.id}`}>
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{doc.domain}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <DocumentUpload onUpload={handleUploadDocument} />
              {currentAnswer && (
                <Button variant="outline" size="icon" onClick={handleExportPDF} data-testid="button-export">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <ThemeToggle />

              {authLoading ? (
                <Button variant="outline" disabled className="gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 hover-glow" data-testid="button-profile">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || "User"} 
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center">
                          <User className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <span className="hidden sm:inline text-sm">{user.displayName || "User"}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-card">
                    <DropdownMenuLabel className="gradient-text">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Dialog open={showSettings} onOpenChange={setShowSettings}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} data-testid="menu-settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="glass-card">
                        <DialogHeader>
                          <DialogTitle className="gradient-text">Account Settings</DialogTitle>
                          <DialogDescription>
                            Manage your profile and preferences
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center gap-4">
                            {user.photoURL ? (
                              <img 
                                src={user.photoURL} 
                                alt={user.displayName || "User"} 
                                className="h-16 w-16 rounded-full"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center">
                                <User className="h-8 w-8 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{user.displayName || "User"}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input
                              value={user.displayName || ""}
                              disabled
                              className="glass-subtle"
                              data-testid="input-name"
                            />
                            <p className="text-xs text-muted-foreground">Managed by Google</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              value={user.email || ""}
                              disabled
                              className="glass-subtle"
                              data-testid="input-email"
                            />
                            <p className="text-xs text-muted-foreground">Managed by Google</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => setShowSettings(false)}
                            className="neon-glow"
                            data-testid="button-close-settings"
                          >
                            Close
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <DropdownMenuItem data-testid="menu-email">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive cursor-pointer" 
                      data-testid="menu-logout"
                      onClick={async () => {
                        try {
                          await signOut();
                          toast({ title: "Signed out", description: "You have been signed out successfully." });
                        } catch (error) {
                          toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
                        }
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="outline" 
                  className="gap-2 hover-glow" 
                  onClick={async () => {
                    setSigningIn(true);
                    try {
                      await signInWithGoogle();
                      toast({ title: "Welcome!", description: "You have signed in successfully." });
                    } catch (error) {
                      toast({ title: "Sign in failed", description: "Could not sign in with Google.", variant: "destructive" });
                    } finally {
                      setSigningIn(false);
                    }
                  }}
                  disabled={signingIn}
                  data-testid="button-sign-in"
                >
                  {signingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SiGoogle className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Sign in with Google</span>
                </Button>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <div className="h-full flex">
              <div className="flex-1 flex flex-col min-w-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="max-w-3xl mx-auto space-y-6">
                    {!currentSession && !askQuestionMutation.isPending && (
                      <div className="text-center py-12 particle-bg">
                        <div className="relative inline-block mb-8">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary via-chart-3 to-chart-4 rounded-full blur-xl opacity-40 animate-pulse" />
                          <div className="relative inline-block p-8 rounded-full bg-gradient-to-br from-primary/20 to-chart-3/20 neon-glow-intense">
                            <Brain className="h-20 w-20 text-primary float-animation" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold mb-4 gradient-text-animated">
                          Evidence-Aware Question Answering
                        </h3>
                        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
                          Ask questions and get answers grounded in verifiable evidence 
                          from documents and knowledge graphs. Upload documents to build 
                          your knowledge base.
                        </p>
                        <div className="flex items-center justify-center gap-6 flex-wrap">
                          <div className="flex items-center gap-2 glass-subtle px-4 py-2 rounded-full text-sm" data-testid="text-status-rag">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-muted-foreground">RAG Pipeline Ready</span>
                          </div>
                          <div className="flex items-center gap-2 glass-subtle px-4 py-2 rounded-full text-sm" data-testid="text-status-kg">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-muted-foreground">Knowledge Graph Active</span>
                          </div>
                          <div className="flex items-center gap-2 glass-subtle px-4 py-2 rounded-full text-sm" data-testid="text-status-multihop">
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-muted-foreground">Multi-hop Reasoning</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentSession?.messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}

                    {askQuestionMutation.isPending && (
                      <div className="space-y-6">
                        <MessageSkeleton />
                        <AnswerSkeleton />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                  <div className="max-w-3xl mx-auto">
                    <QuestionInput
                      onSubmit={handleAskQuestion}
                      isLoading={askQuestionMutation.isPending}
                      selectedDomain={selectedDomain}
                      onDomainChange={setSelectedDomain}
                    />
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-[400px] border-l border-border overflow-hidden">
                <Tabs defaultValue="evidence" className="h-full flex flex-col">
                  <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-12 px-2">
                    <TabsTrigger value="evidence" className="gap-2" data-testid="tab-evidence">
                      <FileText className="h-4 w-4" />
                      Evidence
                    </TabsTrigger>
                    <TabsTrigger value="graph" className="gap-2" data-testid="tab-graph">
                      <Settings className="h-4 w-4" />
                      Graph
                    </TabsTrigger>
                  </TabsList>
                  <ScrollArea className="flex-1 p-4">
                    <TabsContent value="evidence" className="mt-0 space-y-4">
                      {askQuestionMutation.isPending ? (
                        <EvidenceSkeleton />
                      ) : (
                        <>
                          <EvidencePanel evidence={currentAnswer?.evidenceChunks || []} />
                          {explainabilityMode && currentAnswer?.reasoningSteps && (
                            <ReasoningSteps steps={currentAnswer.reasoningSteps} />
                          )}
                          {currentAnswer?.sourceCredibility && (
                            <SourceCredibility scores={currentAnswer.sourceCredibility} />
                          )}
                        </>
                      )}
                    </TabsContent>
                    <TabsContent value="graph" className="mt-0">
                      {askQuestionMutation.isPending ? (
                        <GraphSkeleton />
                      ) : (
                        <KnowledgeGraph
                          graphData={graphData}
                          facts={currentAnswer?.graphFacts || []}
                        />
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
