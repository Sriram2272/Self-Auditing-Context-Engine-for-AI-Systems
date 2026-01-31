import { useState } from "react";
import { Brain, Loader2, Sparkles, Shield, Zap, Database } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function SignIn() {
  const [signingInWith, setSigningInWith] = useState<"google" | "microsoft" | null>(null);
  const { signInWithGoogle, signInWithMicrosoft } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setSigningInWith("google");
    try {
      await signInWithGoogle();
      toast({ title: "Welcome!", description: "You have signed in successfully." });
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign in failed", description: "Could not sign in with Google.", variant: "destructive" });
      }
    } finally {
      setSigningInWith(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setSigningInWith("microsoft");
    try {
      await signInWithMicrosoft();
      toast({ title: "Welcome!", description: "You have signed in successfully." });
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign in failed", description: "Could not sign in with Microsoft.", variant: "destructive" });
      }
    } finally {
      setSigningInWith(null);
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
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>Sign in to access your knowledge base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-3"
              onClick={handleGoogleSignIn}
              disabled={signingInWith !== null}
              data-testid="button-google-signin"
            >
              {signingInWith === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <SiGoogle className="h-5 w-5" />
              )}
              Continue with Google
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full gap-3"
              onClick={handleMicrosoftSignIn}
              disabled={signingInWith !== null}
              data-testid="button-microsoft-signin"
            >
              {signingInWith === "microsoft" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Grid2X2 className="h-5 w-5" />
              )}
              Continue with Microsoft
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Features</span>
              </div>
            </div>

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
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
