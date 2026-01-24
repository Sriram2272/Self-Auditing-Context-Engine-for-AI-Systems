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
      <Card className="border-card-border" data-testid="panel-reasoning">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-chart-4" />
            Multi-hop Reasoning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No detailed reasoning steps available for this answer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-card-border" data-testid="panel-reasoning">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-chart-4" />
          Multi-hop Reasoning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {step.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium mb-1">{step.description}</p>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                  <span className="font-medium">Evidence:</span> {step.evidence}
                </div>
                <Badge variant="outline" className="mt-2 text-xs">
                  Source: {step.source}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
