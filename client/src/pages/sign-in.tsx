import { useState } from "react";
import { Brain, Loader2, Sparkles, Shield, Zap, Database, Mail, Eye, EyeOff } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"google" | "microsoft" | "email" | null>(null);
  const { signInWithGoogle, signInWithMicrosoft, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading("google");
    try {
      await signInWithGoogle();
      toast({ title: "Welcome!", description: "You have signed in successfully." });
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign in failed", description: "Could not sign in with Google.", variant: "destructive" });
      }
    } finally {
      setLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setLoading("microsoft");
    try {
      await signInWithMicrosoft();
      toast({ title: "Welcome!", description: "You have signed in successfully." });
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign in failed", description: "Could not sign in with Microsoft.", variant: "destructive" });
      }
    } finally {
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (isSignUp && !displayName) {
      toast({ title: "Missing name", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading("email");
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
        toast({ title: "Account created!", description: "Welcome to Evidence-Aware QA." });
      } else {
        await signInWithEmail(email, password);
        toast({ title: "Welcome back!", description: "You have signed in successfully." });
      }
    } catch (error: any) {
      let message = isSignUp ? "Could not create account." : "Could not sign in.";
      if (error?.code === "auth/email-already-in-use") {
        message = "This email is already registered. Try signing in.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      }
      toast({ title: isSignUp ? "Sign up failed" : "Sign in failed", description: message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-3/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-chart-3 mb-4 neon-glow">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Evidence-Aware QA</h1>
          <p className="text-muted-foreground">AI-powered answers backed by verifiable evidence</p>
        </div>

        <Card className="glass-card animated-border animated-border-glow">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isSignUp ? "Sign up to access your knowledge base" : "Sign in to access your knowledge base"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="glass-subtle"
                    data-testid="input-signup-name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-subtle"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative flex items-center">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-subtle pr-10"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full gap-3"
                disabled={loading !== null}
                data-testid="button-email-submit"
              >
                {loading === "email" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading !== null}
                data-testid="button-google-signin"
              >
                {loading === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SiGoogle className="h-4 w-4" />
                )}
                Google
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={handleMicrosoftSignIn}
                disabled={loading !== null}
                data-testid="button-microsoft-signin"
              >
                {loading === "microsoft" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Grid2X2 className="h-4 w-4" />
                )}
                Microsoft
              </Button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail("");
                  setPassword("");
                  setDisplayName("");
                }}
                data-testid="button-toggle-mode"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 glass-subtle rounded-lg p-4">
          <p className="text-xs text-muted-foreground text-center mb-3">Features</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="feature-rag-search">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>RAG Search</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="feature-knowledge-graph">
              <Database className="h-4 w-4 text-chart-2" />
              <span>Knowledge Graph</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="feature-source-verification">
              <Shield className="h-4 w-4 text-chart-3" />
              <span>Source Verification</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="feature-multi-hop-reasoning">
              <Zap className="h-4 w-4 text-chart-4" />
              <span>Multi-hop Reasoning</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
