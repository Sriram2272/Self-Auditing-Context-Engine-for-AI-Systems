import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceMeter } from "./confidence-meter";
import type { AnswerResponse } from "@shared/schema";

interface AnswerCardProps {
  answer: AnswerResponse;
}

export function AnswerCard({ answer }: AnswerCardProps) {
  return (
    <Card className="border-card-border" data-testid="card-answer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg">
            {answer.insufficientEvidence ? (
              <>
                <AlertTriangle className="h-5 w-5 text-chart-4" />
                Limited Evidence Available
              </>
            ) : answer.confidence >= 0.7 ? (
              <>
                <CheckCircle className="h-5 w-5 text-chart-2" />
                Answer Found
              </>
            ) : (
              <>
                <Info className="h-5 w-5 text-primary" />
                Possible Answer
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" data-testid="badge-sources">
              {answer.evidenceChunks.length} sources
            </Badge>
            {answer.graphFacts.length > 0 && (
              <Badge variant="outline" data-testid="badge-graph-facts">
                {answer.graphFacts.length} facts
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-answer">
            {answer.answer}
          </p>
        </div>

        <ConfidenceMeter confidence={answer.confidence} />

        {answer.contradictions && answer.contradictions.length > 0 && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Contradictions Detected
            </div>
            {answer.contradictions.map((c, i) => (
              <div key={i} className="text-sm text-muted-foreground pl-6">
                <p>"{c.claim1}" ({c.source1}) vs "{c.claim2}" ({c.source2})</p>
                <p className="text-xs mt-1 italic">{c.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
