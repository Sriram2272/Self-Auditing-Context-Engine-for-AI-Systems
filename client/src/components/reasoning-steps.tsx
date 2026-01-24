import { Lightbulb, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReasoningStep } from "@shared/schema";

interface ReasoningStepsProps {
  steps: ReasoningStep[];
}

export function ReasoningSteps({ steps }: ReasoningStepsProps) {
  if (steps.length === 0) {
    return (
      <div className="animated-border animated-border-subtle" data-testid="panel-reasoning">
        <Card className="border-0 glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-chart-4" />
              <span className="gradient-text">Multi-hop Reasoning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No detailed reasoning steps available for this answer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animated-border animated-border-subtle" data-testid="panel-reasoning">
      <Card className="border-0 glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-chart-4 pulse-glow" />
            <span className="gradient-text">Multi-hop Reasoning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step.step} className="flex gap-3" data-testid={`text-reason-step-${i}`}>
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-medium neon-glow pulse-glow">
                    {step.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-chart-3/50 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium mb-1">{step.description}</p>
                  <div className="text-xs text-muted-foreground glass-subtle rounded-lg p-3 mt-2">
                    <span className="font-medium gradient-text">Evidence:</span> {step.evidence}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs hover-glow">
                    Source: {step.source}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
