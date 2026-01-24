import { useState } from "react";
import { Sparkles, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { domains, type Domain } from "@shared/schema";

interface QuestionInputProps {
  onSubmit: (question: string, domain: Domain) => void;
  isLoading: boolean;
  selectedDomain: Domain;
  onDomainChange: (domain: Domain) => void;
}

export function QuestionInput({
  onSubmit,
  isLoading,
  selectedDomain,
  onDomainChange,
}: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question.trim(), selectedDomain);
      setQuestion("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={selectedDomain} onValueChange={(v) => onDomainChange(v as Domain)}>
            <SelectTrigger className="w-52 glass-card hover-border-glow transition-all border-primary/20" data-testid="select-domain">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Select domain" />
              </div>
            </SelectTrigger>
            <SelectContent className="glass-card border border-primary/20">
              {domains.map((domain) => (
                <SelectItem 
                  key={domain.value} 
                  value={domain.value} 
                  className="hover-border-glow"
                  data-testid={`select-domain-${domain.value}`}
                >
                  {domain.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="text-xs glass-subtle border-primary/30" data-testid="badge-press-enter">
          Press Enter to send
        </Badge>
      </div>

      <div className={`relative rounded-xl transition-all duration-300 ${isFocused ? 'animated-border animated-border-glow' : 'animated-border animated-border-subtle'}`}>
        <div className="relative glass-card rounded-xl overflow-hidden">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything... What would you like to know?"
            className="min-h-[120px] pr-16 resize-none text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            disabled={isLoading}
            data-testid="input-question"
          />
          <div className="absolute bottom-3 right-3">
            <Button
              type="submit"
              size="icon"
              variant={question.trim() ? "default" : "secondary"}
              className={`
                rounded-full transition-all duration-300
                ${question.trim() 
                  ? 'bg-gradient-to-r from-primary to-chart-3 neon-glow-intense shadow-lg shadow-primary/30' 
                  : ''
                }
              `}
              disabled={!question.trim() || isLoading}
              data-testid="button-submit-question"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className={`h-4 w-4 ${question.trim() ? 'animate-pulse' : ''}`} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
