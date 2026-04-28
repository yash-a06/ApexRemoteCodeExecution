import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { useUser } from "@/lib/user-context";
import { 
  useGetProblem, 
  useRunCode, 
  useCreateSubmission, 
  useListUserSubmissions,
  getGetProblemQueryKey,
  getListUserSubmissionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Editor, { useMonaco } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Send, CheckCircle2, XCircle, Clock, Database, ChevronLeft, ChevronDown, Check, Lock, TerminalSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Workspace() {
  const [, params] = useRoute("/problems/:slug");
  const slug = params?.slug || "";
  const { userId } = useUser();
  const queryClient = useQueryClient();
  const monaco = useMonaco();

  const { data: problem, isLoading: loadingProblem } = useGetProblem(slug, {
    query: { enabled: !!slug, queryKey: getGetProblemQueryKey(slug) }
  });

  const { data: submissions, isLoading: loadingSubmissions } = useListUserSubmissions(userId, {
    query: { enabled: !!userId, queryKey: getListUserSubmissionsQueryKey(userId) }
  });
  
  const problemSubmissions = submissions?.filter(s => s.problemSlug === slug) || [];

  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [resultTab, setResultTab] = useState("tests");
  
  const runCodeMut = useRunCode();
  const submitMut = useCreateSubmission();
  
  const [runResult, setRunResult] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [isSuccessCelebration, setIsSuccessCelebration] = useState(false);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('apex-arena-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6a9955' },
          { token: 'keyword', foreground: 'c586c0' },
          { token: 'string', foreground: 'ce9178' },
          { token: 'number', foreground: 'b5cea8' },
          { token: 'type', foreground: '4ec9b0' },
        ],
        colors: {
          'editor.background': '#0b0d12', // Match our --background roughly
          'editor.foreground': '#d4d4d4',
          'editor.lineHighlightBackground': '#00e5ff0a', // Cyan 5%
          'editorLineNumber.foreground': '#5c6370',
          'editorIndentGuide.background': '#ffffff0a',
          'editor.selectionBackground': '#00e5ff26', // Cyan 15%
          'editorCursor.foreground': '#00e5ff',
        }
      });
      monaco.editor.setTheme('apex-arena-dark');
    }
  }, [monaco]);

  const initialized = useRef(false);
  useEffect(() => {
    if (problem && !initialized.current) {
      initialized.current = true;
      const saved = localStorage.getItem(`apex_code_${slug}`);
      if (saved) {
        setCode(saved);
      } else {
        setCode(problem.starterCode);
      }
    }
  }, [problem, slug]);

  const handleCodeChange = (value: string | undefined) => {
    const val = value || "";
    setCode(val);
    localStorage.setItem(`apex_code_${slug}`, val);
  };

  const handleRun = () => {
    setIsSuccessCelebration(false);
    setResultTab("tests");
    runCodeMut.mutate({
      data: { problemSlug: slug, code }
    }, {
      onSuccess: (data) => {
        setRunResult(data);
        setSubmitResult(null);
      },
      onError: () => toast.error("Failed to run code")
    });
  };

  const handleSubmit = () => {
    setIsSuccessCelebration(false);
    setResultTab("tests");
    submitMut.mutate({
      data: { userId, problemSlug: slug, code }
    }, {
      onSuccess: (data) => {
        setSubmitResult(data);
        setRunResult(null);
        setActiveTab("submissions");
        queryClient.invalidateQueries({ queryKey: getListUserSubmissionsQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetProblemQueryKey(slug) });
        
        if (data.status === "accepted") {
          setIsSuccessCelebration(true);
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold text-success font-display tracking-tight">Accepted!</span>
              <span className="text-xs font-mono opacity-80">{data.passedCount}/{data.totalCount} tests passed in {data.results?.[0]?.executionTimeMs || 0}ms</span>
            </div>, 
            {
              className: "border-success/30 bg-success/10",
              icon: <CheckCircle2 className="w-5 h-5 text-success" />
            }
          );
          setTimeout(() => setIsSuccessCelebration(false), 2000);
        } else {
          toast.error("Submission failed. Check test results.", {
            className: "border-destructive/30 bg-destructive/10"
          });
        }
      },
      onError: () => toast.error("Failed to submit code")
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [code, slug]); // Re-bind when deps change to capture current state

  if (loadingProblem) {
    return <PageWrapper className="p-4"><Skeleton className="h-full w-full rounded-xl bg-card border-white/5" /></PageWrapper>;
  }

  if (!problem) {
    return <PageWrapper className="p-4 text-center py-20 font-display text-2xl text-muted-foreground">Problem not found</PageWrapper>;
  }

  const activeResult = submitResult || runResult;
  const isRunning = runCodeMut.isPending || submitMut.isPending;

  return (
    <PageWrapper className="h-screen max-h-screen overflow-hidden bg-background">
      <div className="h-full flex flex-col pt-[57px]"> {/* Account for sticky navbar */}
        
        {/* Editor Toolbar */}
        <div className="h-12 border-b border-white/5 bg-secondary/30 backdrop-blur-md flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/problems" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-white/5 rounded-md">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="font-semibold font-display tracking-tight text-lg">{problem.title}</div>
            <div className={cn(
              "text-[10px] uppercase tracking-widest font-mono font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
              problem.difficulty === "easy" ? "text-success border-success/20 bg-success/5" : 
              problem.difficulty === "medium" ? "text-warning border-warning/20 bg-warning/5" : 
              "text-destructive border-destructive/20 bg-destructive/5"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", 
                problem.difficulty === "easy" ? "bg-success shadow-[0_0_5px_hsl(var(--success))]" : 
                problem.difficulty === "medium" ? "bg-warning shadow-[0_0_5px_hsl(var(--warning))]" : 
                "bg-destructive shadow-[0_0_5px_hsl(var(--destructive))]"
              )}></span>
              {problem.difficulty}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 mr-4 opacity-50">
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono">⌘</kbd>
              <span className="text-[10px] font-mono">+</span >
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono">Enter</kbd>
              <span className="text-[10px] uppercase tracking-widest ml-1">to run</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-2 bg-secondary/50 border-white/10 hover:bg-secondary hover:border-white/20 font-semibold" 
              onClick={handleRun}
              disabled={isRunning}
              data-testid="btn-run"
            >
              {runCodeMut.isPending ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-primary" />}
              Run
            </Button>
            
            <div className="relative">
              {isSuccessCelebration && (
                <motion.div 
                  className="absolute inset-0 bg-primary rounded-md z-0"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}
              <Button 
                size="sm" 
                className="h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_hsl(var(--primary)/0.2)] relative z-10" 
                onClick={handleSubmit}
                disabled={isRunning}
                data-testid="btn-submit"
              >
                {submitMut.isPending ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit
              </Button>
            </div>
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* Left Panel: Description / Submissions */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col bg-card/30">
              <div className="border-b border-white/5 shrink-0 px-2 bg-secondary/20">
                <TabsList className="bg-transparent border-0 h-10 w-full justify-start gap-2">
                  <TabsTrigger value="description" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 h-full text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
                    <TerminalSquare className="w-3.5 h-3.5 mr-2" /> Description
                  </TabsTrigger>
                  <TabsTrigger value="submissions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 h-full text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
                    <Clock className="w-3.5 h-3.5 mr-2" /> Submissions
                    {problemSubmissions.length > 0 && <span className="ml-2 py-0.5 px-1.5 bg-white/5 rounded text-[10px] leading-none">{problemSubmissions.length}</span>}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="description" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full px-6 py-6 custom-scrollbar">
                  <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/5 prose-code:text-primary prose-a:text-primary">
                    <ReactMarkdown>{problem.statement}</ReactMarkdown>
                  </div>
                  
                  <div className="mt-10 space-y-4 not-prose">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2">Sample Tests</h3>
                    {problem.sampleTests.map((t, i) => (
                      <div key={i} className="bg-secondary/30 border border-white/5 rounded-lg p-4 font-mono">
                        <div className="font-semibold text-sm mb-2 text-foreground">{t.name}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed bg-black/20 p-3 rounded border border-white/5">{t.description}</div>
                      </div>
                    ))}
                    {problem.hiddenTestCount > 0 && (
                      <div className="bg-primary/5 border border-primary/20 border-dashed rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-primary font-medium">
                        <Lock className="w-4 h-4" /> + {problem.hiddenTestCount} hidden tests evaluated on submit
                      </div>
                    )}
                  </div>

                  {problem.hints && problem.hints.length > 0 && (
                    <div className="mt-10 space-y-2 not-prose mb-10">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2 mb-4">Hints</h3>
                      {problem.hints.map((hint, i) => (
                        <Collapsible key={i}>
                          <CollapsibleTrigger className="flex w-full items-center justify-between bg-secondary/30 hover:bg-secondary/50 p-3 rounded-lg border border-white/5 text-sm font-medium transition-colors group">
                            <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">Hint {i + 1}</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4 text-sm text-muted-foreground bg-secondary/10 border-x border-b border-white/5 rounded-b-lg -mt-1 pt-5 leading-relaxed">
                            {hint}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="submissions" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-4 custom-scrollbar">
                  {loadingSubmissions ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-lg bg-secondary/50" />
                      <Skeleton className="h-16 w-full rounded-lg bg-secondary/50" />
                    </div>
                  ) : problemSubmissions.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <Clock className="w-5 h-5 opacity-50" />
                      </div>
                      <p className="font-display font-medium text-lg text-foreground mb-1">No submissions yet</p>
                      <p className="text-sm">Write your solution and hit submit.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {problemSubmissions.map((s, i) => (
                        <motion.div 
                          key={s.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-card hover:bg-secondary/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              {s.status === "accepted" ? (
                                <span className="font-bold font-mono text-success text-sm flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" /> Accepted
                                </span>
                              ) : (
                                <span className="font-bold font-mono text-destructive text-sm flex items-center gap-1.5">
                                  <XCircle className="w-4 h-4" /> {s.status.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground">
                              {new Date(s.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-bold text-foreground">
                              {s.passedCount} <span className="text-muted-foreground font-normal">/ {s.totalCount}</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tests Passed</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          
          <ResizableHandle className="w-1 bg-border/40 hover:bg-primary transition-colors hover:w-1.5 hover:-ml-0.5 z-10" />

          {/* Right Panel: Editor + Console */}
          <ResizablePanel defaultSize={60} minSize={30} className="flex flex-col bg-[#0b0d12]">
            {/* Editor File Tab */}
            <div className="h-9 bg-[#0b0d12] flex items-center px-4 shrink-0 border-b border-white/5">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-t-md border-t border-x border-white/10 -mb-[1px] relative z-10 h-[calc(100%+1px)]">
                <div className="w-2 h-2 rounded-full bg-primary/80 shadow-[0_0_5px_hsl(var(--primary))]"></div>
                <span className="text-xs font-mono text-foreground font-medium">Solution.cls</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-mono border-white/10 text-muted-foreground bg-transparent px-1.5 py-0 rounded">Apex</Badge>
              </div>
            </div>
            
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={activeResult ? 60 : 100} minSize={30}>
                <div className="h-full relative">
                  <Editor
                    height="100%"
                    language="java" // close enough to Apex
                    theme="apex-arena-dark"
                    value={code}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "var(--font-mono)",
                      fontLigatures: true,
                      padding: { top: 16, bottom: 16 },
                      scrollBeyondLastLine: false,
                      roundedSelection: false,
                      renderLineHighlight: 'all',
                      smoothScrolling: true,
                      cursorSmoothCaretAnimation: 'on',
                      scrollbar: { useShadows: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
                    }}
                  />
                </div>
              </ResizablePanel>

              {activeResult && (
                <>
                  <ResizableHandle className="h-1 bg-border/40 hover:bg-primary transition-colors hover:h-1.5 hover:-mt-0.5 z-10" />
                  <ResizablePanel defaultSize={40} minSize={20}>
                    <Tabs value={resultTab} onValueChange={setResultTab} className="h-full flex flex-col bg-card/80 backdrop-blur">
                      <div className="border-b border-white/5 shrink-0 px-2 flex justify-between items-center bg-secondary/30 h-10">
                        <TabsList className="bg-transparent border-0 h-full gap-2">
                          <TabsTrigger value="tests" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 h-full text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
                            Test Results
                          </TabsTrigger>
                          <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 h-full text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
                            Console
                          </TabsTrigger>
                          <TabsTrigger value="limits" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-3 h-full text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
                            Limits
                          </TabsTrigger>
                        </TabsList>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full" onClick={() => {setRunResult(null); setSubmitResult(null)}}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      <TabsContent value="tests" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full p-4 custom-scrollbar">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeResult.status || "run"}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {activeResult.compileError ? (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3 items-start">
                                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                  <div className="text-destructive font-mono text-sm whitespace-pre-wrap leading-relaxed">
                                    {activeResult.compileError}
                                  </div>
                                </div>
                              ) : activeResult.runtimeError ? (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3 items-start">
                                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                  <div className="text-destructive font-mono text-sm whitespace-pre-wrap leading-relaxed">
                                    {activeResult.runtimeError}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="text-lg font-display font-semibold flex items-center gap-2 px-1">
                                    {submitResult?.status === "accepted" ? (
                                      <span className="text-success flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Accepted</span>
                                    ) : submitResult ? (
                                      <span className="text-destructive flex items-center gap-2"><XCircle className="w-5 h-5"/> {submitResult.status.replace(/_/g, ' ')}</span>
                                    ) : (
                                      <span>Execution Complete</span>
                                    )}
                                  </div>
                                  <div className="grid gap-2">
                                    {activeResult.results?.map((r: any, i: number) => (
                                      <div key={i} className={cn(
                                        "p-4 rounded-lg border",
                                        r.passed ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20 border-l-4 border-l-destructive"
                                      )}>
                                        <div className="flex items-center justify-between">
                                          <div className="font-semibold flex items-center gap-2 font-mono text-sm text-foreground">
                                            {r.passed ? <Check className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}
                                            {r.hidden ? (
                                              <span className="flex items-center gap-1.5 opacity-70"><Lock className="w-3.5 h-3.5"/> Hidden Test #{i+1}</span>
                                            ) : (
                                              r.name
                                            )}
                                          </div>
                                          <div className="text-xs font-mono text-muted-foreground bg-black/20 px-2 py-0.5 rounded">{r.executionTimeMs}ms</div>
                                        </div>
                                        {!r.passed && !r.hidden && (
                                          <div className="mt-3">
                                            <div className="text-xs font-semibold uppercase tracking-widest text-destructive mb-1 opacity-80">Error Output</div>
                                            <div className="font-mono text-xs text-destructive/90 bg-destructive/10 p-3 rounded border border-destructive/10 whitespace-pre-wrap break-all leading-relaxed">
                                              {r.message}
                                            </div>
                                          </div>
                                        )}
                                        {r.hidden && !r.passed && (
                                          <div className="text-xs text-muted-foreground/70 mt-2 font-mono italic">Hidden test case failed. Output not shown.</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="logs" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full p-4 bg-[#0b0d12] custom-scrollbar">
                          <div className="font-mono text-[13px] leading-relaxed">
                            {activeResult.debugLog?.length > 0 ? (
                              activeResult.debugLog.map((log: string, i: number) => (
                                <div key={i} className="mb-1 text-gray-300 hover:bg-white/5 px-2 -mx-2 rounded transition-colors break-all">
                                  <span className="text-muted-foreground mr-2 select-none">{String(i+1).padStart(2, '0')}</span>
                                  {log}
                                </div>
                              ))
                            ) : (
                              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <TerminalSquare className="w-8 h-8 opacity-20 mb-2" />
                                <span className="font-mono text-sm opacity-60">No debug logs. Use System.debug() to print output.</span>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="limits" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full p-4 custom-scrollbar">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {activeResult.governorLimits ? (
                              <>
                                <LimitBar label="SOQL Queries" value={activeResult.governorLimits.soqlQueries} max={100} />
                                <LimitBar label="DML Statements" value={activeResult.governorLimits.dmlStatements} max={150} />
                                <LimitBar label="CPU Time (ms)" value={activeResult.governorLimits.cpuTimeMs} max={10000} />
                                <LimitBar label="Heap Size (MB)" value={(activeResult.governorLimits.heapSizeBytes / 1024 / 1024).toFixed(2)} max={6} />
                              </>
                            ) : (
                              <div className="col-span-2 text-center py-10 text-muted-foreground font-mono text-sm">
                                Limits data not available for this run.
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </PageWrapper>
  );
}

function LimitBar({ label, value, max }: { label: string, value: number | string, max: number }) {
  const numVal = Number(value);
  const pct = Math.min(100, (numVal / max) * 100);
  const isDanger = pct > 90;
  const isWarning = pct > 70 && !isDanger;
  
  return (
    <div className="p-4 border border-white/5 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
      <div className="flex justify-between text-sm mb-3">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn(
          "font-mono font-bold", 
          isDanger ? "text-destructive" : isWarning ? "text-warning" : "text-muted-foreground"
        )}>
          {value} <span className="text-muted-foreground font-normal">/ {max}</span>
        </span>
      </div>
      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-out",
            isDanger ? "bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]" : 
            isWarning ? "bg-warning shadow-[0_0_10px_hsl(var(--warning))]" : 
            "bg-gradient-to-r from-primary to-teal-300 shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
