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
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Send, CheckCircle2, XCircle, Clock, Database, FileText, ChevronLeft, ChevronDown, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function Workspace() {
  const [, params] = useRoute("/problems/:slug");
  const slug = params?.slug || "";
  const { userId } = useUser();
  const queryClient = useQueryClient();

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

  // Load saved code or starter code
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
    setResultTab("tests");
    runCodeMut.mutate({
      data: { problemSlug: slug, code }
    }, {
      onSuccess: (data) => {
        setRunResult(data);
        setSubmitResult(null);
        toast.success("Run completed");
      },
      onError: () => toast.error("Failed to run code")
    });
  };

  const handleSubmit = () => {
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
          toast.success("Accepted!", {
            icon: <CheckCircle2 className="w-5 h-5 text-success" />
          });
        } else {
          toast.error("Submission failed. Check test results.");
        }
      },
      onError: () => toast.error("Failed to submit code")
    });
  };

  if (loadingProblem) {
    return <PageWrapper className="p-4"><Skeleton className="h-full w-full" /></PageWrapper>;
  }

  if (!problem) {
    return <PageWrapper className="p-4 text-center py-20">Problem not found</PageWrapper>;
  }

  const activeResult = submitResult || runResult;
  const isRunning = runCodeMut.isPending || submitMut.isPending;

  return (
    <PageWrapper className="h-screen max-h-screen overflow-hidden bg-background">
      <div className="h-full flex flex-col pt-14">
        {/* Top toolbar */}
        <div className="h-12 border-b border-border/40 bg-muted/10 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/problems" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="font-semibold">{problem.title}</div>
            <Badge 
              variant="outline" 
              className={cn(
                problem.difficulty === "easy" ? "text-success border-success/30" : 
                problem.difficulty === "medium" ? "text-warning border-warning/30" : 
                "text-destructive border-destructive/30"
              )}
            >
              {problem.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2" 
              onClick={handleRun}
              disabled={isRunning}
              data-testid="btn-run"
            >
              {runCodeMut.isPending ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-primary" />}
              Run
            </Button>
            <Button 
              size="sm" 
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" 
              onClick={handleSubmit}
              disabled={isRunning}
              data-testid="btn-submit"
            >
              {submitMut.isPending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit
            </Button>
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel: Description / Submissions */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b border-border/40 shrink-0 px-4">
                <TabsList className="bg-transparent border-0 h-10 w-full justify-start">
                  <TabsTrigger value="description" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="submissions" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">
                    Submissions ({problemSubmissions.length})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="description" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full px-6 py-6 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{problem.statement}</ReactMarkdown>
                  
                  <div className="mt-8 space-y-4 not-prose">
                    <h3 className="font-semibold text-lg border-b pb-2">Sample Tests</h3>
                    {problem.sampleTests.map((t, i) => (
                      <div key={i} className="bg-muted/30 border border-border/50 rounded-md p-4">
                        <div className="font-medium text-sm mb-1">{t.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{t.description}</div>
                      </div>
                    ))}
                    {problem.hiddenTestCount > 0 && (
                      <div className="bg-muted/10 border border-dashed border-border/50 rounded-md p-4 text-center text-sm text-muted-foreground">
                        + {problem.hiddenTestCount} hidden tests evaluated on submit
                      </div>
                    )}
                  </div>

                  {problem.hints && problem.hints.length > 0 && (
                    <div className="mt-8 space-y-2 not-prose">
                      {problem.hints.map((hint, i) => (
                        <Collapsible key={i}>
                          <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted/20 hover:bg-muted/40 p-3 rounded-md border border-border/30 text-sm font-medium transition-colors">
                            Hint {i + 1}
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-3 text-sm text-muted-foreground bg-muted/10 border-x border-b border-border/30 rounded-b-md -mt-1 pt-4">
                            {hint}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="submissions" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full p-4">
                  {loadingSubmissions ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : problemSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No submissions yet. Write some code and hit Submit!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {problemSubmissions.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {s.status === "accepted" ? (
                                <span className="font-medium text-success text-sm flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Accepted
                                </span>
                              ) : (
                                <span className="font-medium text-destructive text-sm flex items-center gap-1">
                                  <XCircle className="w-4 h-4" /> {s.status.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(s.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {s.passedCount} / {s.totalCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          
          <ResizableHandle className="w-1 bg-border/50 hover:bg-primary transition-colors" />

          {/* Right Panel: Editor + Console */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={activeResult ? 60 : 100} minSize={30}>
                <div className="h-full bg-[#1e1e1e]">
                  <Editor
                    height="100%"
                    language="java" // close enough to Apex
                    theme="vs-dark"
                    value={code}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "var(--font-mono)",
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                      roundedSelection: false,
                    }}
                  />
                </div>
              </ResizablePanel>

              {activeResult && (
                <>
                  <ResizableHandle className="h-1 bg-border/50 hover:bg-primary transition-colors" />
                  <ResizablePanel defaultSize={40} minSize={20}>
                    <Tabs value={resultTab} onValueChange={setResultTab} className="h-full flex flex-col bg-card">
                      <div className="border-b border-border/40 shrink-0 px-2 flex justify-between items-center bg-muted/10">
                        <TabsList className="bg-transparent border-0 h-9">
                          <TabsTrigger value="tests" className="text-xs data-[state=active]:bg-background">Test Results</TabsTrigger>
                          <TabsTrigger value="logs" className="text-xs data-[state=active]:bg-background">Debug Log</TabsTrigger>
                          <TabsTrigger value="limits" className="text-xs data-[state=active]:bg-background">Governor Limits</TabsTrigger>
                        </TabsList>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => {setRunResult(null); setSubmitResult(null)}}>
                          Close
                        </Button>
                      </div>

                      <TabsContent value="tests" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full p-4">
                          {activeResult.compileError ? (
                            <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive font-mono text-sm whitespace-pre-wrap">
                              {activeResult.compileError}
                            </div>
                          ) : activeResult.runtimeError ? (
                            <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive font-mono text-sm whitespace-pre-wrap">
                              {activeResult.runtimeError}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-lg font-semibold flex items-center gap-2">
                                {submitResult?.status === "accepted" ? (
                                  <span className="text-success flex items-center gap-2"><CheckCircle2/> Accepted</span>
                                ) : submitResult ? (
                                  <span className="text-destructive flex items-center gap-2"><XCircle/> {submitResult.status.replace(/_/g, ' ')}</span>
                                ) : (
                                  <span>Run Results</span>
                                )}
                              </div>
                              <div className="grid gap-2">
                                {activeResult.results?.map((r: any, i: number) => (
                                  <div key={i} className={cn("p-3 rounded-md border text-sm", r.passed ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="font-semibold flex items-center gap-2">
                                        {r.passed ? <Check className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}
                                        {r.hidden ? `Hidden test #${i+1}` : r.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{r.executionTimeMs}ms</div>
                                    </div>
                                    {!r.passed && !r.hidden && (
                                      <div className="font-mono text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">
                                        {r.message}
                                      </div>
                                    )}
                                    {r.hidden && !r.passed && (
                                      <div className="text-xs text-muted-foreground mt-1">Hidden test case failed. Output not shown.</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="logs" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full p-4 bg-[#1e1e1e] font-mono text-sm text-gray-300">
                          {activeResult.debugLog?.length > 0 ? (
                            activeResult.debugLog.map((log: string, i: number) => (
                              <div key={i} className="mb-1">{log}</div>
                            ))
                          ) : (
                            <div className="text-gray-500 italic">No debug logs. Use System.debug() to print output.</div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="limits" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full p-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {activeResult.governorLimits && (
                              <>
                                <LimitBar label="SOQL Queries" value={activeResult.governorLimits.soqlQueries} max={100} />
                                <LimitBar label="DML Statements" value={activeResult.governorLimits.dmlStatements} max={150} />
                                <LimitBar label="CPU Time (ms)" value={activeResult.governorLimits.cpuTimeMs} max={10000} />
                                <LimitBar label="Heap Size (MB)" value={(activeResult.governorLimits.heapSizeBytes / 1024 / 1024).toFixed(2)} max={6} />
                              </>
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
  const isHigh = pct > 80;
  return (
    <div className="p-3 border border-border/50 rounded-lg bg-background">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium">{label}</span>
        <span className={cn("font-mono", isHigh ? "text-destructive" : "text-muted-foreground")}>
          {value} / {max}
        </span>
      </div>
      <Progress value={pct} className={cn("h-2", isHigh && "bg-destructive/20 [&>div]:bg-destructive")} />
    </div>
  );
}
