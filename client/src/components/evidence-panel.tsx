import { FileText, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfidenceMeter } from "./confidence-meter";
import type { Evidence } from "@shared/schema";

interface EvidencePanelProps {
  evidence: Evidence[];
}

function EvidenceItem({ evidence, index }: { evidence: Evidence; index: number }) {
  const [isOpen, setIsOpen] = useState(index < 2);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg glass-card hover-border-glow transition-all overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto rounded-none"
            data-testid={`button-evidence-${index}`}
          >
            <div className="flex items-start gap-3 text-left">
              <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="font-medium text-sm">{evidence.documentName}</div>
                <div className="text-xs text-muted-foreground">{evidence.section}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-dance">
                {Math.round(evidence.relevanceScore * 100)}% match
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-primary" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <div 
              className="text-sm evidence-highlight rounded-lg p-3"
              dangerouslySetInnerHTML={{ __html: evidence.highlightedContent }}
              data-testid={`text-evidence-content-${index}`}
            />
            
            {evidence.sentenceEvidence && evidence.sentenceEvidence.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Key sentences:
                </div>
                {evidence.sentenceEvidence.map((se, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs glass-subtle rounded p-2">
                    <div className="shrink-0 mt-0.5">
                      <ConfidenceMeter confidence={se.relevance} showLabel={false} size="sm" />
                    </div>
                    <span className="text-muted-foreground">{se.sentence}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  if (evidence.length === 0) {
    return (
      <Card className="border-card-border">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No evidence retrieved yet</p>
            <p className="text-xs">Ask a question to see relevant documents</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animated-border animated-border-subtle" data-testid="panel-evidence">
      <Card className="border-0 glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            <span className="gradient-text">Retrieved Evidence</span>
            <Badge variant="secondary" className="ml-auto neon-glow">
              {evidence.length} chunks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4 custom-scrollbar">
            <div className="space-y-3">
              {evidence.map((e, i) => (
                <EvidenceItem key={e.chunkId} evidence={e} index={i} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
