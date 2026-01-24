import { Shield, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SourceCredibilityProps {
  scores: Record<string, number>;
}

export function SourceCredibility({ scores }: SourceCredibilityProps) {
  const entries = Object.entries(scores);
  
  if (entries.length === 0) return null;

  const getCredibilityIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-chart-2" />;
    if (score >= 0.5) return <Shield className="h-4 w-4 text-chart-4" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  };

  return (
    <Card className="border-card-border" data-testid="panel-credibility">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-chart-2" />
          Source Credibility
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map(([source, score]) => (
            <div key={source} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getCredibilityIcon(score)}
                  <span className="truncate max-w-[150px]">{source}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {getCredibilityLabel(score)}
                </span>
              </div>
              <Progress value={score * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
