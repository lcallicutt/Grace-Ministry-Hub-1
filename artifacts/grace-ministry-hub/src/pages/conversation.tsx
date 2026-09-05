import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetConversation, useSendConversationMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConversationPage() {
  const { id } = useParams();
  const conversationId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { data: conversation, isLoading, refetch } = useGetConversation(conversationId);
  const sendMessage = useSendConversationMessage();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, sendMessage.isPending]);

  const handleSend = async () => {
    if (!input.trim() || sendMessage.isPending) return;
    const content = input;
    setInput("");
    
    await sendMessage.mutateAsync({
      conversationId,
      data: { content }
    });
    refetch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading && !conversation) {
    return (
      <div className="flex flex-col h-full bg-background animate-in fade-in">
        <div className="h-16 border-b border-border flex items-center px-6 gap-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-20 w-3/4 ml-auto rounded-2xl rounded-tr-sm" />
          <Skeleton className="h-32 w-3/4 rounded-2xl rounded-tl-sm" />
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-4 md:px-6 gap-4 bg-background/95 backdrop-blur shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="shrink-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex flex-col overflow-hidden">
          <h1 className="font-serif font-medium text-lg truncate text-foreground">{conversation.title}</h1>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {conversation.category}
          </span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {conversation.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground fade-in animate-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={32} />
            </div>
            <div>
              <p className="text-lg font-serif text-foreground">How can I help you today?</p>
              <p className="text-sm">I'm ready to draft, plan, or brainstorm.</p>
            </div>
          </div>
        )}

        {conversation.messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex gap-4 max-w-4xl mx-auto animate-in slide-in-from-bottom-2 fade-in duration-300",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className="shrink-0 mt-1">
                {isUser ? (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-sm">
                    <User size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm font-serif font-bold text-sm">
                    G
                  </div>
                )}
              </div>
              <div className={cn(
                "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                isUser 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-card border border-border text-card-foreground rounded-tl-sm"
              )}>
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {/* Optimistic loading state */}
        {sendMessage.isPending && (
          <div className="flex gap-4 max-w-4xl mx-auto flex-row animate-in fade-in">
             <div className="shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm font-serif font-bold text-sm">
                  G
                </div>
              </div>
              <div className="px-5 py-4 rounded-2xl bg-card border border-border text-card-foreground rounded-tl-sm flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-background/95 backdrop-blur border-t border-border shrink-0">
        <div className="max-w-4xl mx-auto relative flex items-end gap-3 bg-card border border-border rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell Grace what you need..."
            className="min-h-[44px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent py-3 px-3 overflow-y-auto"
            rows={1}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="shrink-0 h-10 w-10 rounded-lg mb-1 mr-1 shadow-none"
          >
            <Send size={18} className={cn(sendMessage.isPending && "animate-pulse")} />
          </Button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-3 font-medium">
          Grace is an AI assistant. Review content before publishing.
        </p>
      </div>
    </div>
  );
}
