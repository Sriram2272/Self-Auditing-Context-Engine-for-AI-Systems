import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <Select value={selectedDomain} onValueChange={(v) => onDomainChange(v as Domain)}>
          <SelectTrigger className="w-48" data-testid="select-domain">
            <SelectValue placeholder="Select domain" />
          </SelectTrigger>
          <SelectContent>
            {domains.map((domain) => (
              <SelectItem key={domain.value} value={domain.value} data-testid={`select-domain-${domain.value}`}>
                {domain.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Press Enter to submit, Shift+Enter for new line)"
          className="min-h-[100px] pr-14 resize-none text-base"
          disabled={isLoading}
          data-testid="input-question"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute bottom-3 right-3"
          disabled={!question.trim() || isLoading}
          data-testid="button-submit-question"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
