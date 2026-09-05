import { useEffect, useRef, useState } from "react";
import { useGetChurchProfile, useUpdateChurchProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, MapPin, Clock, MessageSquareHeart, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChurchProfilePage() {
  const { data: profile, isLoading } = useGetChurchProfile();
  const updateProfile = useUpdateChurchProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    churchName: "",
    pastorName: "",
    address: "",
    serviceTime: "",
    welcomeNote: ""
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setFormData({
        churchName: profile.churchName,
        pastorName: profile.pastorName,
        address: profile.address,
        serviceTime: profile.serviceTime,
        welcomeNote: profile.welcomeNote,
      });
      initialized.current = true;
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        data: formData
      });
      toast({
        title: "Profile updated",
        description: "Your church details have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif text-foreground">Church Profile</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Grace uses these details to personalize your bulletins, emails, and generated content.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              General Details
            </CardTitle>
            <CardDescription>
              Core information about your ministry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 size={16} className="text-muted-foreground" /> Church Name
                </label>
                <Input 
                  value={formData.churchName}
                  onChange={e => setFormData({ ...formData, churchName: e.target.value })}
                  placeholder="e.g. Grace Fellowship"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" /> Lead Pastor
                </label>
                <Input 
                  value={formData.pastorName}
                  onChange={e => setFormData({ ...formData, pastorName: e.target.value })}
                  placeholder="e.g. Pastor David"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" /> Address
                </label>
                <Input 
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 123 Main St, City, ST 12345"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" /> Standard Service Times
                </label>
                <Input 
                  value={formData.serviceTime}
                  onChange={e => setFormData({ ...formData, serviceTime: e.target.value })}
                  placeholder="e.g. Sundays at 9am & 11am"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/50">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquareHeart size={16} className="text-muted-foreground" /> Default Welcome Note
              </label>
              <p className="text-xs text-muted-foreground pb-2">
                This text will be automatically included in your generated Sunday bulletins.
              </p>
              <Textarea 
                rows={4}
                value={formData.welcomeNote}
                onChange={e => setFormData({ ...formData, welcomeNote: e.target.value })}
                placeholder="Welcome to Grace Fellowship! We're so glad you're here..."
              />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending} className="gap-2 px-8">
                <Save size={16} />
                {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
