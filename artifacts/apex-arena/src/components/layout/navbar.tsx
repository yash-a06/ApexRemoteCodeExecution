import { Link, useLocation } from "wouter";
import { Code2, Trophy, BookOpen, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import { useClerk, useUser as useClerkUser } from "@clerk/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { username } = useUser();
  const { user, isLoaded } = useClerkUser();
  const { signOut } = useClerk();

  const isSignedIn = isLoaded && !!user;

  const navItems = [
    { href: "/problems", label: "Problems", icon: BookOpen },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-background/70 backdrop-blur-xl transition-all">
      <div className="container flex h-14 max-w-screen-2xl items-center px-3 sm:px-4 gap-2">
        <Link href="/" className="flex items-center space-x-2 group shrink-0 mr-2 sm:mr-6">
          <div className="bg-primary/10 p-1.5 rounded-md group-hover:bg-primary/20 transition-colors">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight font-display">
            Apex <span className="hidden xs:inline">Arena</span>
          </span>
          <span className="hidden md:inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground font-mono ml-2 border border-white/5">
            v1.0
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <nav className="flex items-center space-x-0.5 sm:space-x-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md transition-colors hover:bg-muted/50 group",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center pl-2 sm:pl-4 ml-1 sm:ml-2 border-l border-white/[0.08]">
            {!isLoaded ? null : isSignedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 group"
                  data-testid="nav-link-profile"
                >
                  <div className="hidden md:flex flex-col items-end mr-1 max-w-[140px]">
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate w-full text-right">
                      {username || user.firstName || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Pro
                    </span>
                  </div>
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={username || "Avatar"}
                      className="w-8 h-8 rounded-full border border-primary/20 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {(username || user.firstName || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign in</span>
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Sign up</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
