import { useParams, useLocation } from "wouter";
import { useGetServicePlan } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, FileText, MonitorPlay, Mic, Calendar } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ServicePlanPage() {
  const { id } = useParams();
  const planId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { data: plan, isLoading } = useGetServicePlan(planId);
  
  const [activeTab, setActiveTab] = useState<"bulletin" | "projection" | "announcer">("bulletin");

  if (isLoading || !plan) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in">
        <Skeleton className="h-8 w-24 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-96 w-full mt-8" />
      </div>
    );
  }

  const tabs = [
    { id: "bulletin", label: "Sunday Bulletin", icon: FileText, content: plan.bulletin },
    { id: "projection", label: "Projection Slides", icon: MonitorPlay, content: plan.projection },
    { id: "announcer", label: "Announcer Sheet", icon: Mic, content: plan.announcerSheet },
  ] as const;

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="flex flex-col h-full bg-background relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="px-6 py-8 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => setLocation("/service-builder")} className="gap-2 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to Service Plans
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-primary mb-3">
                <Calendar size={18} />
                <span className="font-medium tracking-wide uppercase text-sm">
                  {new Date(plan.serviceDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {plan.serviceTime}
                </span>
              </div>
              <h1 className="text-4xl font-serif text-foreground mb-2">{plan.sermonTitle}</h1>
              <p className="text-lg text-muted-foreground">{plan.speaker || "Guest Speaker"}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-card text-foreground hover:bg-card/80 border border-border"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Document Display */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h2 className="font-medium text-foreground flex items-center gap-2">
                {currentTab?.icon && <currentTab.icon size={18} className="text-primary" />}
                {currentTab?.label}
              </h2>
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Download size={14} /> Export
              </Button>
            </div>
            <div className="p-8 md:p-12 prose prose-slate dark:prose-invert max-w-none font-sans bg-white dark:bg-card">
              {/* Note: The API returns markdown or plain text, we'll render it as pre-wrap for now, 
                  ideally would use a markdown renderer, but keeping it simple and stable. */}
              <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                {currentTab?.content}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
