import { Plus, MessageSquare, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@shared/schema";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border/50">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2 futuristic-button neon-glow"
          data-testid="button-new-chat"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3 custom-scrollbar">
        <div className="space-y-1">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50 float-animation" />
              <p className="text-sm">No chat history</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-300",
                  "hover:bg-sidebar-accent/50 hover-border-glow",
                  currentSessionId === session.id && "bg-sidebar-accent sidebar-item-active neon-glow"
                )}
                onClick={() => onSelectSession(session.id)}
                data-testid={`button-session-${session.id}`}
              >
                <MessageSquare className={cn(
                  "h-4 w-4 mt-0.5 shrink-0 transition-colors",
                  currentSessionId === session.id ? "text-primary" : "text-sidebar-foreground/70"
                )} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium truncate",
                    currentSessionId === session.id ? "gradient-text" : "text-sidebar-foreground"
                  )}>
                    {session.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(session.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover-glow"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  data-testid={`button-delete-session-${session.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
