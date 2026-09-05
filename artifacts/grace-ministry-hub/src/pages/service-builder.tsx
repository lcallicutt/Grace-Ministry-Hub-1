import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetServicePlans, useCreateServicePlan } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, FileText, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ServiceBuilderPage() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading } = useGetServicePlans();
  const createPlan = useCreateServicePlan();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    serviceDate: "",
    serviceTime: "10:00 AM",
    sermonTitle: "",
    speaker: "",
    orderOfService: "",
    announcements: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createPlan.mutateAsync({
        data: {
          churchName: "Grace Ministry", // Normally from profile, but hardcoded fallback here
          serviceDate: formData.serviceDate,
          serviceTime: formData.serviceTime,
          sermonTitle: formData.sermonTitle,
          speaker: formData.speaker || null,
          orderOfService: formData.orderOfService || null,
          announcements: formData.announcements || null,
          notes: formData.notes || null
        }
      });
      setOpen(false);
      setLocation(`/service-builder/${result.id}`);
    } catch (error) {
      console.error("Failed to create plan", error);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif text-foreground">Service Builder</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Input your weekly details once. Grace will generate your bulletin, projection slides, and announcer sheet.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 shadow-md">
              <Plus size={20} />
              New Service Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-background">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Create Service Plan</DialogTitle>
              <DialogDescription>
                Fill in the details for your upcoming service. Grace will format everything automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Date</label>
                  <Input 
                    type="date" 
                    required
                    value={formData.serviceDate}
                    onChange={e => setFormData({ ...formData, serviceDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Time</label>
                  <Input 
                    type="text" 
                    required
                    placeholder="e.g. 10:00 AM"
                    value={formData.serviceTime}
                    onChange={e => setFormData({ ...formData, serviceTime: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sermon Title</label>
                  <Input 
                    required
                    placeholder="e.g. Walking in Faith"
                    value={formData.sermonTitle}
                    onChange={e => setFormData({ ...formData, sermonTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Speaker (Optional)</label>
                  <Input 
                    placeholder="e.g. Pastor John Doe"
                    value={formData.speaker}
                    onChange={e => setFormData({ ...formData, speaker: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Order of Service</label>
                <Textarea 
                  placeholder="Welcome, Worship (3 songs), Announcements, Sermon..."
                  rows={3}
                  value={formData.orderOfService}
                  onChange={e => setFormData({ ...formData, orderOfService: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Announcements</label>
                <Textarea 
                  placeholder="Youth group retreat on Friday, Potluck next Sunday..."
                  rows={3}
                  value={formData.announcements}
                  onChange={e => setFormData({ ...formData, announcements: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPlan.isPending} className="gap-2">
                  {createPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Assets
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))
        ) : plans?.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl bg-card/30 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground mb-1">No service plans yet</h3>
            <p>Create your first plan to let Grace generate your weekly assets.</p>
          </div>
        ) : (
          plans?.map(plan => (
            <Link key={plan.id} href={`/service-builder/${plan.id}`} className="block group">
                <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">{new Date(plan.serviceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{plan.serviceTime}</span>
                    </div>
                    <CardTitle className="line-clamp-1">{plan.sermonTitle}</CardTitle>
                    <CardDescription>{plan.speaker || "Guest Speaker"}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex items-center justify-between text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <span>View generated assets</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
