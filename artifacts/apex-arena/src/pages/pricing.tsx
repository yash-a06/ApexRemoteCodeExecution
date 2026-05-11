import { Link } from "wouter";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { useUser } from "@/lib/user-context";
import { useSubscribeUser } from "@workspace/api-client-react";
import { CheckCircle2, Lock, Sparkles, Code2, Zap, BookOpen, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useClerk } from "@clerk/react";

const FREE_FEATURES = [
  "12 free problems (Easy & some Medium)",
  "Simulated Apex execution engine",
  "Governor limit analysis",
  "Full roadmap access",
  "Submission history",
];

const PRO_FEATURES = [
  "All 20 problems including 8 Pro-only",
  "Advanced design pattern challenges",
  "Security & injection problems",
  "Schedulable & complex async problems",
  "Hard-difficulty problems unlocked",
  "Pro badge on profile",
];

export default function Pricing() {
  const { userId, isSubscribed, setIsSubscribed } = useUser();
  const { user } = useClerk();
  const subscribeUser = useSubscribeUser();

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Sign in to activate Pro");
      return;
    }
    if (isSubscribed) return;

    subscribeUser.mutate(
      { userId },
      {
        onSuccess: () => {
          setIsSubscribed(true);
          toast.success("Pro activated! All problems are now unlocked.");
        },
        onError: () => {
          toast.error("Something went wrong. Please try again.");
        },
      },
    );
  };

  return (
    <PageWrapper className="container max-w-screen-lg px-4 md:px-6 py-10 sm:py-16 mx-auto">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3 h-3" /> Apex Arena Pro
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display mb-3">
          Level up your Apex skills
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Unlock advanced problems and design challenges that prepare you for senior-level Salesforce roles.
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="rounded-2xl border border-white/8 bg-card/50 p-6 sm:p-8 flex flex-col">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Free</div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold font-mono">$0</span>
              <span className="text-muted-foreground text-sm mb-1">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Start practicing with no commitment</p>
          </div>

          <ul className="space-y-2.5 mb-8 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
            <li className="flex items-start gap-2.5 text-sm">
              <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
              <span className="text-muted-foreground/50">Pro problems locked</span>
            </li>
          </ul>

          <Link
            href="/problems"
            className="block text-center py-2.5 px-4 rounded-lg border border-white/10 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
          >
            {isSubscribed ? "Downgrade" : "Current plan"}
          </Link>
        </div>

        {/* Pro Plan */}
        <div className={cn(
          "rounded-2xl border-2 p-6 sm:p-8 flex flex-col relative overflow-hidden",
          isSubscribed
            ? "border-yellow-500/50 bg-yellow-500/5"
            : "border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-card/50",
        )}>
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

          {isSubscribed && (
            <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Active
            </div>
          )}

          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Pro
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold font-mono">$0</span>
              <span className="text-muted-foreground text-sm mb-1">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? "You have full access to all Pro problems"
                : "Demo mode — activate instantly, no payment needed"}
            </p>
          </div>

          <ul className="space-y-2.5 mb-8 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {isSubscribed ? (
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" /> Pro is active
            </div>
          ) : user ? (
            <button
              onClick={handleSubscribe}
              disabled={subscribeUser.isPending}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-yellow-950 text-sm font-bold transition-all shadow-[0_0_20px_hsl(48,96%,53%,0.25)] hover:shadow-[0_0_30px_hsl(48,96%,53%,0.4)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Sparkles className="w-4 h-4" />
              {subscribeUser.isPending ? "Activating..." : "Activate Pro — Free"}
            </button>
          ) : (
            <Link
              href="/sign-up"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-yellow-950 text-sm font-bold transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Sign up to activate
            </Link>
          )}
        </div>
      </div>

      {/* Feature comparison */}
      <div className="mt-12 sm:mt-16 max-w-3xl mx-auto">
        <h2 className="text-center text-base sm:text-xl font-bold font-display mb-6 text-muted-foreground uppercase tracking-widest text-sm">
          What you get
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Code2, label: "20 Problems", sub: "vs 12 on Free" },
            { icon: Zap, label: "Hard tier", sub: "All 4 unlocked" },
            { icon: BookOpen, label: "Advanced patterns", sub: "Interfaces, handlers" },
            { icon: Map, label: "Full roadmap", sub: "All 6 phases" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center p-4 rounded-xl border border-white/5 bg-card/30 text-center">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-sm font-bold mb-0.5">{label}</div>
              <div className="text-[11px] text-muted-foreground">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12 sm:mt-16 max-w-2xl mx-auto space-y-4">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
          Common Questions
        </h2>
        {[
          {
            q: "Is Pro really free?",
            a: "Yes — Apex Arena is a practice platform, not a SaaS product. Pro is free and activates instantly without any payment details.",
          },
          {
            q: "What makes a problem 'Pro'?",
            a: "Pro problems involve advanced patterns (trigger frameworks, interfaces, dynamic SOQL) and require deeper architectural thinking. They're marked with a Pro badge in the problem list.",
          },
          {
            q: "Will my progress be saved?",
            a: "Submission history is tied to your account. Roadmap completion is stored locally in your browser.",
          },
        ].map(({ q, a }) => (
          <div key={q} className="rounded-xl border border-white/5 bg-card/30 p-5">
            <h3 className="font-semibold text-sm mb-2">{q}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
