import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/lib/user-context";

import Home from "@/pages/home";
import Problems from "@/pages/problems";
import Workspace from "@/pages/workspace";
import Profile from "@/pages/profile";
import Roadmap from "@/pages/roadmap";
import Pricing from "@/pages/pricing";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: "iconButton" as const,
  },
  variables: {
    colorPrimary: "#00E5FF",
    colorForeground: "hsl(210, 40%, 98%)",
    colorMutedForeground: "hsl(215, 20%, 65%)",
    colorDanger: "hsl(350, 89%, 60%)",
    colorBackground: "hsl(230, 28%, 4%)",
    colorInput: "hsl(230, 28%, 12%)",
    colorInputForeground: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(230, 28%, 20%)",
    fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[hsl(230,28%,6%)] border border-white/[0.08] rounded-xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold tracking-tight",
    headerSubtitle: "text-[hsl(215,20%,65%)]",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-[hsl(210,40%,90%)] font-medium",
    footerActionLink: "text-[#00E5FF] hover:text-[#00E5FF]/80 font-medium",
    footerActionText: "text-[hsl(215,20%,65%)]",
    dividerText: "text-[hsl(215,20%,65%)]",
    identityPreviewEditButton: "text-[#00E5FF]",
    formFieldSuccessText: "text-[hsl(152,69%,41%)]",
    alertText: "text-white",
    logoBox: "flex justify-center mb-1",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton:
      "border-white/[0.08] bg-white/5 hover:bg-white/10 text-white transition-colors",
    formButtonPrimary:
      "bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[hsl(230,28%,4%)] font-semibold transition-colors",
    formFieldInput:
      "bg-[hsl(230,28%,12%)] border-white/[0.08] text-white focus:border-[#00E5FF]/50",
    footerAction: "border-t border-white/[0.08]",
    dividerLine: "bg-white/[0.08]",
    alert: "border-white/[0.08] bg-white/5",
    otpCodeFieldInput: "bg-[hsl(230,28%,12%)] border-white/[0.08] text-white",
    formFieldRow: "",
    main: "",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function Router() {
  return (
    <UserProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/problems" component={Problems} />
        <Route path="/problems/:slug" component={Workspace} />
        <Route path="/profile" component={Profile} />
        <Route path="/roadmap" component={Roadmap} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    </UserProvider>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your Apex Arena account",
          },
        },
        signUp: {
          start: {
            title: "Join Apex Arena",
            subtitle: "Start mastering Salesforce Apex today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster theme="dark" position="bottom-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
