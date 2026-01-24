import { User, Bot } from "lucide-react";
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
          "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
          isUser ? "bg-primary" : "bg-accent"
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-primary-foreground" />
        ) : (
          <Bot className="h-5 w-5 text-accent-foreground" />
        )}
      </div>

      <div className={cn("flex-1 max-w-[85%]", isUser && "flex flex-col items-end")}>
        {isUser ? (
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : message.answerData ? (
          <AnswerCard answer={message.answerData} />
        ) : (
          <div className="bg-card border border-card-border rounded-2xl rounded-tl-md px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
