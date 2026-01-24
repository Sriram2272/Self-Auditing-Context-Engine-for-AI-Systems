import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnswerCard } from "./answer-card";
import type { ChatMessage as ChatMessageType } from "@shared/schema";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      data-testid={`message-${message.id}`}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-lg",
          isUser 
            ? "bg-gradient-to-br from-primary to-chart-3 neon-glow" 
            : "bg-gradient-to-br from-chart-4 to-chart-5 neon-glow"
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Sparkles className="h-5 w-5 text-white" />
        )}
      </div>

      <div className={cn("flex-1 max-w-[85%]", isUser && "flex flex-col items-end")}>
        {isUser ? (
          <div className="bg-gradient-to-r from-primary to-chart-3 text-white rounded-2xl rounded-tr-md px-5 py-3 shadow-lg shadow-primary/20">
            <p className="text-sm whitespace-pre-wrap font-medium">{message.content}</p>
          </div>
        ) : message.answerData ? (
          <AnswerCard answer={message.answerData} />
        ) : (
          <div className="glass-card rounded-2xl rounded-tl-md px-5 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        <div className="text-xs text-muted-foreground/70 mt-2 px-1 font-medium">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
