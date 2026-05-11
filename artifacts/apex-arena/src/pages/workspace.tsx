import { useState, useEffect, useRef, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
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
import { Play, Send, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronDown, Check, Lock, TerminalSquare, AlertCircle, FlaskConical, Info, Lightbulb, BookOpen, Code2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function describeError(status: string | undefined): { title: string; hint: string } {
  switch (status) {
    case "compile_error":
      return {
        title: "Compile Error",
        hint: "Your Apex code didn't parse correctly. Check braces, parentheses, semicolons and the class/trigger header.",
      };
    case "runtime_error":
      return {
        title: "Runtime Error",
        hint: "Your code compiled but threw an exception while executing. Look at the message below to see what went wrong.",
      };
    case "governor_limit_exceeded":
      return {
        title: "Governor Limit Exceeded",
        hint: "Your code ran past a Salesforce governor limit. Move SOQL/DML out of loops and bulkify your logic.",
      };
    case "wrong_answer":
      return {
        title: "Wrong Answer",
        hint: "Your code ran but didn't satisfy every requirement. Review the failing tests below.",
      };
    default:
      return {
        title: "Submission Failed",
        hint: "Some tests didn't pass. See the details below.",
      };
  }
}

export default function Workspace() {
  const [, params] = useRoute("/problems/:slug");
  const slug = params?.slug || "";
  const { userId, isSubscribed } = useUser();
  const queryClient = useQueryClient();
  const monaco = useMonaco();
  const isDesktop = useIsDesktop();

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
  const [mobileView, setMobileView] = useState<"info" | "code" | "output">("info");
  
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
          'editor.background': '#0b0d12',
          'editor.foreground': '#d4d4d4',
          'editor.lineHighlightBackground': '#00e5ff0a',
          'editorLineNumber.foreground': '#5c6370',
          'editorIndentGuide.background': '#ffffff0a',
          'editor.selectionBackground': '#00e5ff26',
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
        if (!isDesktop) setMobileView("output");
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
        if (isDesktop) {
          setActiveTab("submissions");
        } else {
          setMobileView("output");
        }
        queryClient.invalidateQueries({ queryKey: getListUserSubmissionsQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getGetProblemQueryKey(slug) });
        
        if (data.status === "accepted") {
          setIsSuccessCelebration(true);
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold text-success font-display tracking-tight">Accepted!</span>
              <span className="text-xs font-mono opacity-80">{data.passedCount}/{data.totalCount} tests passed</span>
            </div>, 
            {
              className: "border-success/30 bg-success/10",
              icon: <CheckCircle2 className="w-5 h-5 text-success" />
            }
          );
          setTimeout(() => setIsSuccessCelebration(false), 2000);
        } else {
          const { title } = describeError(data.status);
          toast.error(`${title} — ${data.passedCount}/${data.totalCount} passed`, {
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
  }, [code, slug]);

  const activeResult = submitResult || runResult;
  const isRunning = runCodeMut.isPending || submitMut.isPending;

  // Map results back to test specs by name for the Tests tab
  const testStatusByName = useMemo(() => {
    const map = new Map<string, { passed: boolean; message: string; executionTimeMs: number }>();
    activeResult?.results?.forEach((r: any) => {
      if (!r.hidden && r.name) map.set(r.name, r);
    });
    return map;
  }, [activeResult]);

  if (loadingProblem) {
    return <><Navbar /><div className="fixed inset-x-0 top-14 bottom-0 p-4 bg-background"><Skeleton className="h-full w-full rounded-xl bg-card border-white/5" /></div></>;
  }

  if (!problem) {
    return <><Navbar /><div className="fixed inset-x-0 top-14 bottom-0 flex items-center justify-center font-display text-2xl text-muted-foreground bg-background">Problem not found</div></>;
  }

  if (problem.isPremium && !isSubscribed) {
    return (
      <>
        <Navbar />
        <div className="fixed inset-x-0 top-14 bottom-0 flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full mb-3">
                <Sparkles className="w-3 h-3" /> Pro Problem
              </div>
              <h1 className="text-2xl font-bold font-display mb-2">{problem.title}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                This is an advanced problem available to Pro members. Upgrade to access all {8} Pro problems including this one.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-6 text-sm font-bold shadow-[0_0_20px_hsl(48,96%,53%,0.2)] transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                Unlock with Pro
              </Link>
              <Link
                href="/problems"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 bg-secondary/50 px-6 text-sm font-semibold transition-all hover:bg-secondary"
              >
                Browse free problems
              </Link>
            </div>
            <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-yellow-400 font-semibold">Pro is free.</span> Apex Arena is a practice platform — no payment required. Activate instantly on the pricing page.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ---------- Reusable panes ----------
  const LeftPane = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col bg-card/30 min-h-0">
      <div className="border-b border-white/5 shrink-0 px-1 sm:px-2 bg-secondary/20 overflow-x-auto">
        <TabsList className="bg-transparent border-0 h-10 w-max justify-start gap-1 sm:gap-2">
          <TabsTrigger value="description" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 sm:px-4 h-full text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
            <TerminalSquare className="w-3.5 h-3.5 mr-1.5 sm:mr-2" /> Description
          </TabsTrigger>
          <TabsTrigger value="tests" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 sm:px-4 h-full text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
            <FlaskConical className="w-3.5 h-3.5 mr-1.5 sm:mr-2" /> Tests
            <span className="ml-1.5 sm:ml-2 py-0.5 px-1.5 bg-white/5 rounded text-[10px] leading-none">{problem.sampleTests.length + (problem.hiddenTestCount > 0 ? `+${problem.hiddenTestCount}` : "")}</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 sm:px-4 h-full text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
            <Clock className="w-3.5 h-3.5 mr-1.5 sm:mr-2" /> Submissions
            {problemSubmissions.length > 0 && <span className="ml-1.5 sm:ml-2 py-0.5 px-1.5 bg-white/5 rounded text-[10px] leading-none">{problemSubmissions.length}</span>}
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="description" className="flex-1 overflow-hidden m-0 min-h-0">
        <ScrollArea className="h-full px-4 sm:px-6 py-6">
          <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/5 prose-code:text-primary prose-a:text-primary">
            <ReactMarkdown>{problem.statement}</ReactMarkdown>
          </div>

          {problem.hints && problem.hints.length > 0 && (
            <div className="mt-10 space-y-2 not-prose mb-10">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" /> Hints
              </h3>
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

      <TabsContent value="tests" className="flex-1 overflow-hidden m-0 min-h-0">
        <ScrollArea className="h-full">
          <div className="px-3 sm:px-5 py-4 space-y-2.5">
            <div className="text-[11px] sm:text-xs text-muted-foreground font-mono leading-relaxed mb-3">
              Visible tests show full failure details — hidden tests count toward your score on submit.
            </div>
            {problem.sampleTests.map((t, i) => {
              const r = testStatusByName.get(t.name);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "rounded-lg border p-3 sm:p-4",
                    !r
                      ? "bg-secondary/20 border-white/5"
                      : r.passed
                      ? "bg-success/5 border-success/20"
                      : "bg-destructive/5 border-destructive/20 border-l-[3px] border-l-destructive"
                  )}
                  data-testid={`test-case-${i}`}
                >
                  {/* Name row */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm font-mono text-foreground min-w-0">
                      {!r ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                      ) : r.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      )}
                      <span className="truncate">{t.name}</span>
                    </div>
                    {r && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-black/30 px-1.5 py-0.5 rounded shrink-0">{r.executionTimeMs}ms</span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed pl-5 mt-1.5">
                    {t.description}
                  </div>

                  {/* Failure detail */}
                  {r && !r.passed && (
                    <div className="mt-2.5 pl-5">
                      <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-destructive mb-1 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Why it failed
                      </div>
                      <div className="font-mono text-[11px] sm:text-xs text-destructive/90 bg-destructive/10 p-2 sm:p-3 rounded border border-destructive/10 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                        {r.message}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
            {problem.hiddenTestCount > 0 && (
              <div className="bg-primary/5 border border-primary/20 border-dashed rounded-lg p-3 sm:p-4 flex items-center gap-2.5 text-xs sm:text-sm text-primary font-medium">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>+{problem.hiddenTestCount} hidden tests on submit. Bulkify your code to pass them.</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="submissions" className="flex-1 overflow-hidden m-0 min-h-0">
        <ScrollArea className="h-full p-4">
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
                  className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-card hover:bg-secondary/40 transition-colors gap-3"
                  data-testid={`submission-${i}`}
                >
                  <div className="min-w-0">
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
                  <div className="text-right shrink-0">
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
  );

  const EditorPane = (
    <div className="h-full flex flex-col bg-[#0b0d12] min-h-0">
      <div className="h-9 bg-[#0b0d12] flex items-center px-3 sm:px-4 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-t-md border-t border-x border-white/10 -mb-[1px] relative z-10 h-[calc(100%+1px)]">
          <div className="w-2 h-2 rounded-full bg-primary/80 shadow-[0_0_5px_hsl(var(--primary))]"></div>
          <span className="text-xs font-mono text-foreground font-medium">Solution.cls</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-mono border-white/10 text-muted-foreground bg-transparent px-1.5 py-0 rounded">Apex</Badge>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language="java"
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
    </div>
  );

  return (
    <>
      <Navbar />
      {/* Fixed content area: top-14 = exactly below the sticky navbar, fills rest of viewport */}
      <div className="fixed inset-x-0 top-14 bottom-0 flex flex-col bg-background overflow-hidden">
        
        {/* Editor Toolbar */}
        <div className="min-h-12 border-b border-white/5 bg-secondary/30 backdrop-blur-md flex items-center px-2 sm:px-4 justify-between shrink-0 gap-2 py-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href="/problems" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-white/5 rounded-md shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="font-semibold font-display tracking-tight text-sm sm:text-lg truncate min-w-0">{problem.title}</div>
            <div className={cn(
              "shrink-0 text-[10px] uppercase tracking-widest font-mono font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
              problem.difficulty === "easy" ? "text-success border-success/20 bg-success/5" : 
              problem.difficulty === "medium" ? "text-warning border-warning/20 bg-warning/5" : 
              "text-destructive border-destructive/20 bg-destructive/5"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", 
                problem.difficulty === "easy" ? "bg-success shadow-[0_0_5px_hsl(var(--success))]" : 
                problem.difficulty === "medium" ? "bg-warning shadow-[0_0_5px_hsl(var(--warning))]" : 
                "bg-destructive shadow-[0_0_5px_hsl(var(--destructive))]"
              )}></span>
              <span className="hidden xs:inline">{problem.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-2 mr-4 opacity-50">
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono">⌘</kbd>
              <span className="text-[10px] font-mono">+</span>
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono">Enter</kbd>
              <span className="text-[10px] uppercase tracking-widest ml-1">to run</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 sm:gap-2 px-2.5 sm:px-3 bg-secondary/50 border-white/10 hover:bg-secondary hover:border-white/20 font-semibold" 
              onClick={handleRun}
              disabled={isRunning}
              data-testid="btn-run"
            >
              {runCodeMut.isPending ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-primary" />}
              <span className="hidden xs:inline">Run</span>
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
                className="h-8 gap-1.5 sm:gap-2 px-2.5 sm:px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_hsl(var(--primary)/0.2)] relative z-10" 
                onClick={handleSubmit}
                disabled={isRunning}
                data-testid="btn-submit"
              >
                {submitMut.isPending ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">Submit</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Body: side-by-side on desktop, stacked on mobile */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isDesktop ? (
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={40} minSize={25}>
                {LeftPane}
              </ResizablePanel>
              <ResizableHandle className="w-1 bg-border/40 hover:bg-primary transition-colors hover:w-1.5 hover:-ml-0.5 z-10" />
              <ResizablePanel defaultSize={60} minSize={30} className="bg-[#0b0d12]">
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={activeResult ? 50 : 100} minSize={20}>
                    {EditorPane}
                  </ResizablePanel>
                  {activeResult && (
                    <>
                      <ResizableHandle className="h-1 bg-border/40 hover:bg-primary transition-colors hover:h-1.5 hover:-mt-0.5 z-10" />
                      <ResizablePanel defaultSize={50} minSize={25}>
                        <ResultsPanel
                          activeResult={activeResult}
                          submitResult={submitResult}
                          problem={problem}
                          resultTab={resultTab}
                          setResultTab={setResultTab}
                          onClose={() => { setRunResult(null); setSubmitResult(null); }}
                        />
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            /* Mobile: full-screen single pane with bottom navigation */
            <div className="h-full flex flex-col">
              {/* Content area — fills all space above the nav bar */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  {mobileView === "info" && (
                    <motion.div key="info" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                      {LeftPane}
                    </motion.div>
                  )}
                  {mobileView === "code" && (
                    <motion.div key="code" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                      {EditorPane}
                    </motion.div>
                  )}
                  {mobileView === "output" && (
                    <motion.div key="output" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                      <ResultsPanel
                        activeResult={activeResult}
                        submitResult={submitResult}
                        problem={problem}
                        resultTab={resultTab}
                        setResultTab={setResultTab}
                        onClose={() => { setRunResult(null); setSubmitResult(null); setMobileView("info"); }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom navigation bar */}
              <div className="shrink-0 border-t border-white/10 bg-secondary/40 grid grid-cols-3 h-12" data-testid="mobile-nav">
                <button
                  onClick={() => setMobileView("info")}
                  className={cn("flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    mobileView === "info" ? "text-primary" : "text-muted-foreground")}
                >
                  <BookOpen className="w-4 h-4" />
                  Info
                </button>
                <button
                  onClick={() => setMobileView("code")}
                  className={cn("flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors border-x border-white/5",
                    mobileView === "code" ? "text-primary" : "text-muted-foreground")}
                >
                  <Code2 className="w-4 h-4" />
                  Code
                </button>
                <button
                  onClick={() => setMobileView("output")}
                  className={cn("flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors relative",
                    mobileView === "output" ? "text-primary" : "text-muted-foreground")}
                >
                  <span className="relative">
                    <TerminalSquare className="w-4 h-4" />
                    {activeResult && (
                      <span className={cn("absolute -top-0.5 -right-1 w-2 h-2 rounded-full border border-background",
                        activeResult.compileError || activeResult.runtimeError || (submitResult && submitResult.status !== "accepted") ? "bg-destructive" : "bg-success"
                      )} />
                    )}
                  </span>
                  Output
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ResultsPanel({ activeResult, submitResult, problem, resultTab, setResultTab, onClose }: {
  activeResult: any;
  submitResult: any;
  problem: any;
  resultTab: string;
  setResultTab: (s: string) => void;
  onClose: () => void;
}) {
  if (!activeResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 bg-card/40">
        <TerminalSquare className="w-10 h-10 opacity-20 mb-3" />
        <p className="font-display font-medium text-foreground mb-1">No output yet</p>
        <p className="text-xs font-mono">Hit Run to see test results, console logs, and governor limits.</p>
      </div>
    );
  }

  const errInfo = activeResult.compileError ? describeError("compile_error")
    : activeResult.runtimeError ? describeError("runtime_error")
    : (submitResult && submitResult.status !== "accepted") ? describeError(submitResult.status)
    : null;

  // Index sample tests by name to enrich result rows with descriptions
  const descByName = new Map<string, string>();
  problem.sampleTests.forEach((t: any) => descByName.set(t.name, t.description));

  const passedCount = activeResult.results?.filter((r: any) => r.passed).length ?? 0;
  const totalCount = activeResult.results?.length ?? 0;

  return (
    <Tabs value={resultTab} onValueChange={setResultTab} className="h-full flex flex-col bg-card/80 backdrop-blur min-h-0">
      {/* Tab bar */}
      <div className="border-b border-white/5 shrink-0 px-2 flex items-center justify-between bg-secondary/30 h-10 gap-1">
        <TabsList className="bg-transparent border-0 h-full flex-1 min-w-0 gap-0 sm:gap-1">
          <TabsTrigger value="tests" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 sm:px-3 h-full text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors flex items-center gap-1.5">
            <span className="sm:hidden">Results</span>
            <span className="hidden sm:inline">Test Results</span>
            {totalCount > 0 && (
              <span className={cn(
                "text-[9px] font-mono font-bold px-1 py-0.5 rounded",
                passedCount === totalCount ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {passedCount}/{totalCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 sm:px-3 h-full text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
            Console
            {activeResult.debugLog?.length > 0 && (
              <span className="ml-1.5 text-[9px] font-mono bg-white/10 px-1 py-0.5 rounded">{activeResult.debugLog.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="limits" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 sm:px-3 h-full text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-muted-foreground transition-colors">
            Limits
          </TabsTrigger>
        </TabsList>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full shrink-0" onClick={onClose} data-testid="btn-close-results">
          <XCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Test Results tab */}
      <TabsContent value="tests" className="flex-1 overflow-hidden m-0 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-3 sm:p-4 space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeResult.status || (activeResult.compileError ? "compile" : activeResult.runtimeError ? "runtime" : "run")}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Status banner */}
                {errInfo ? (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 sm:p-4 flex gap-2.5 items-start" data-testid="error-banner">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold text-destructive text-sm sm:text-base mb-1">{errInfo.title}</div>
                      <div className="text-xs text-destructive/80 leading-relaxed mb-2">{errInfo.hint}</div>
                      {(activeResult.compileError || activeResult.runtimeError) && (
                        <div className="font-mono text-[11px] sm:text-xs text-destructive/90 bg-destructive/10 p-2.5 rounded border border-destructive/20 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                          {activeResult.compileError || activeResult.runtimeError}
                        </div>
                      )}
                      {submitResult && !activeResult.compileError && !activeResult.runtimeError && (
                        <div className="text-xs font-mono text-muted-foreground">
                          Passed <span className="text-foreground font-bold">{submitResult.passedCount}</span> of <span className="text-foreground font-bold">{submitResult.totalCount}</span> tests
                        </div>
                      )}
                    </div>
                  </div>
                ) : submitResult?.status === "accepted" ? (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3 sm:p-4 flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <div className="font-display font-semibold text-success text-sm sm:text-base mb-1">Accepted</div>
                      <div className="text-xs text-success/80 leading-relaxed">
                        All {submitResult.totalCount} tests passed. Nice work!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex gap-2.5 items-center">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <div className="text-xs text-foreground/80 leading-relaxed">
                      Code executed. Review individual test results below.
                    </div>
                  </div>
                )}

                {/* Per-test breakdown */}
                {!activeResult.compileError && !activeResult.runtimeError && (
                  <div className="grid gap-2">
                    {activeResult.results?.map((r: any, i: number) => (
                      <div key={i} className={cn(
                        "p-3 sm:p-4 rounded-lg border",
                        r.passed
                          ? "bg-success/5 border-success/20"
                          : "bg-destructive/5 border-destructive/20 border-l-[3px] border-l-destructive",
                      )} data-testid={`result-${i}`}>
                        {/* Test name row */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="font-semibold flex items-center gap-1.5 font-mono text-xs sm:text-sm text-foreground min-w-0">
                            {r.passed
                              ? <Check className="w-3.5 h-3.5 text-success shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                            {r.hidden ? (
                              <span className="flex items-center gap-1 opacity-70 min-w-0">
                                <Lock className="w-3 h-3 shrink-0" />
                                <span className="truncate">Hidden Test #{i + 1}</span>
                              </span>
                            ) : (
                              <span className="truncate">{r.name}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded shrink-0">{r.executionTimeMs}ms</span>
                        </div>

                        {/* Test description */}
                        {!r.hidden && descByName.get(r.name) && (
                          <div className="mt-1.5 pl-5 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                            {descByName.get(r.name)}
                          </div>
                        )}

                        {/* Failure detail */}
                        {!r.passed && !r.hidden && (
                          <div className="mt-2 pl-5">
                            <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-destructive mb-1 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Why it failed
                            </div>
                            <div className="font-mono text-[11px] sm:text-xs text-destructive/90 bg-destructive/10 p-2 sm:p-3 rounded border border-destructive/10 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                              {r.message}
                            </div>
                          </div>
                        )}

                        {/* Hidden failure hint */}
                        {r.hidden && !r.passed && (
                          <div className="text-[11px] text-muted-foreground/70 mt-1.5 pl-5 font-mono italic leading-relaxed">
                            Hidden test failed — bulkify your code and check edge cases.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </TabsContent>

      {/* Console tab */}
      <TabsContent value="logs" className="flex-1 overflow-hidden m-0 min-h-0">
        <ScrollArea className="h-full p-3 sm:p-4 bg-[#0b0d12]">
          <div className="font-mono text-[12px] sm:text-[13px] leading-relaxed">
            {activeResult.debugLog?.length > 0 ? (
              activeResult.debugLog.map((log: string, i: number) => (
                <div key={i} className="mb-1 text-gray-300 hover:bg-white/5 px-2 -mx-2 rounded transition-colors break-all">
                  <span className="text-muted-foreground mr-2 select-none">{String(i + 1).padStart(2, "0")}</span>
                  {log}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <TerminalSquare className="w-8 h-8 opacity-20 mb-2" />
                <span className="font-mono text-xs sm:text-sm opacity-60 text-center px-4">
                  No debug logs. Use System.debug() to print output.
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* Governor Limits tab */}
      <TabsContent value="limits" className="flex-1 overflow-hidden m-0 min-h-0">
        <ScrollArea className="h-full p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
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
  );
}

function LimitBar({ label, value, max }: { label: string, value: number | string, max: number }) {
  const numVal = Number(value);
  const pct = Math.min(100, (numVal / max) * 100);
  const isDanger = pct > 90;
  const isWarning = pct > 70 && !isDanger;
  
  return (
    <div className="p-2.5 sm:p-4 border border-white/5 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-2 mb-2 sm:mb-3">
        <span className="font-medium text-foreground text-[11px] sm:text-sm truncate">{label}</span>
        <span className={cn(
          "font-mono font-bold text-[11px] sm:text-sm shrink-0",
          isDanger ? "text-destructive" : isWarning ? "text-warning" : "text-muted-foreground"
        )}>
          {value}<span className="text-muted-foreground font-normal text-[10px] sm:text-xs">/{max}</span>
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
