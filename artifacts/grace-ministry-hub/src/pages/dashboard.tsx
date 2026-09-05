import { useGetDashboard, useCreateConversation, useSendConversationMessage } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, PenTool, Share2, Megaphone, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useState } from "react";

const QUICK_PROMPTS = [
  {
    title: "Draft an announcement",
    description: "For this Sunday's bulletin or stage",
    icon: Megaphone,
    category: "announcement",
    prompt: "I need to draft an announcement for this upcoming Sunday. Can you help me format it for the bulletin and for the stage announcer?"
  },
  {
    title: "Schedule volunteers",
    description: "Write a polite scheduling email",
    icon: Calendar,
    category: "scheduling",
    prompt: "Can you help me write a warm, polite email to our volunteer team asking them to sign up for serving slots next month?"
  },
  {
    title: "Social media post",
    description: "Create engaging Instagram copy",
    icon: Share2,
    category: "social",
    prompt: "I want to create an engaging social media post about our upcoming sermon series. What are some good captions?"
  },
  {
    title: "Creative brief",
    description: "Specs for design & Canva",
    icon: PenTool,
    category: "creative",
    prompt: "Let's create a design brief for our new sermon series graphics so I can hand it off to our designer."
  }
];

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: dashboard, isLoading } = useGetDashboard();
  const createConversation = useCreateConversation();
  const sendMessage = useSendConversationMessage();
  const [startingPrompt, setStartingPrompt] = useState<string | null>(null);

  const handleQuickPrompt = async (title: string, category: string, prompt: string) => {
    setStartingPrompt(title);
    try {
      const conv = await createConversation.mutateAsync({
        data: { title, category }
      });
      await sendMessage.mutateAsync({
        conversationId: conv.id,
        data: { content: prompt }
      });
      setLocation(`/conversations/${conv.id}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setStartingPrompt(null);
    }
  };

  const handleStartBlank = async () => {
    setStartingPrompt("blank");
    try {
      const conv = await createConversation.mutateAsync({
        data: { title: "New Conversation", category: "general" }
      });
      setLocation(`/conversations/${conv.id}`);
    } catch (error) {
      console.error(error);
      setStartingPrompt(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif text-foreground">
            Good morning, {dashboard?.church.split(' ')[0]} team.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Grace is your ministry assistant. What are we working on today?
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleStartBlank}
          disabled={startingPrompt !== null}
          className="gap-2 shadow-md hover:shadow-lg transition-all"
        >
          {startingPrompt === "blank" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Chat with Grace
        </Button>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif text-foreground/90">Quick Starts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_PROMPTS.map((qp, i) => {
            const Icon = qp.icon;
            const isStartingThis = startingPrompt === qp.title;
            return (
              <button
                key={i}
                onClick={() => handleQuickPrompt(qp.title, qp.category, qp.prompt)}
                disabled={startingPrompt !== null}
                className="text-left group relative p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-colors" />
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {isStartingThis ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{qp.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{qp.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Work */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif text-foreground/90">Recent Conversations</h2>
          </div>
          {dashboard?.recentConversations.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-card/50 text-muted-foreground">
              No recent conversations yet. Start one above!
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard?.recentConversations.map((conv) => (
                <Link key={conv.id} href={`/conversations/${conv.id}`} className="block p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground truncate">{conv.title}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium uppercase tracking-wider">
                            {conv.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.preview}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="text-xs">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats / Upcoming */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif text-foreground/90">Ministry Pulse</h2>
          <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Calendar className="w-32 h-32" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-primary-foreground">Next Service</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                {dashboard?.nextService 
                  ? new Date(dashboard.nextService).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : "No upcoming service planned"}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-serif mb-1">{dashboard?.servicePlanCount}</div>
                  <div className="text-sm text-primary-foreground/70">Service Plans</div>
                </div>
                <div>
                  <div className="text-3xl font-serif mb-1">{dashboard?.conversationCount}</div>
                  <div className="text-sm text-primary-foreground/70">Conversations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
