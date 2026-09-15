import { getGetVolunteerQueryKey, useGetVolunteer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Edit2, Mail, Phone, MapPin, Calendar, Clock, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function VolunteerDetailSheet({ 
  id, 
  onClose,
  onEdit
}: { 
  id: number | null; 
  onClose: () => void;
  onEdit: (id: number) => void;
}) {
  const { data: volunteer, isLoading } = useGetVolunteer(id as number, {
    query: {
      enabled: !!id,
      queryKey: getGetVolunteerQueryKey(id as number),
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 size={16} className="text-green-600 shrink-0" aria-label="Confirmed" />;
      case 'waitlisted': return <AlertCircle size={16} className="text-amber-500 shrink-0" aria-label="Waitlisted" />;
      case 'cancelled': return <X size={16} className="text-muted-foreground shrink-0" aria-label="Cancelled" />;
      case 'no_show': return <AlertCircle size={16} className="text-destructive shrink-0" aria-label="No show" />;
      default: return null;
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[90] bg-background/50 backdrop-blur-sm transition-all duration-300", 
      id !== null ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="fixed inset-0 z-0" onClick={onClose} aria-hidden="true" />
      
      <div className={cn(
        "fixed inset-y-0 right-0 z-10 w-full max-w-md bg-card border-l shadow-2xl transition-transform duration-300 ease-out flex flex-col",
        id !== null ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-muted/10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif text-foreground">Volunteer Profile</h2>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close volunteer profile"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="w-10 h-10 rounded-md shrink-0" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          ) : volunteer ? (
            <div className="p-6 space-y-8 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif text-foreground flex items-center gap-2">
                    {volunteer.firstName} {volunteer.lastName}
                    {volunteer.isStudent && (
                      <span title="Student" className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                        <GraduationCap size={14} />
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="font-medium text-foreground">{volunteer.team || "No Team"}</span>
                    <span>&bull;</span>
                    <span className={cn(
                      "font-medium uppercase tracking-wider text-xs",
                      volunteer.status === 'active' ? "text-primary" : "text-muted-foreground"
                    )}>
                      {volunteer.status}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={() => onEdit(volunteer.id)} title="Edit profile">
                  <Edit2 size={16} />
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Info</h4>
                <div className="space-y-3 bg-muted/20 border rounded-xl p-4 text-sm">
                  <div className="flex items-center gap-3 text-foreground">
                    <Mail size={16} className="text-muted-foreground shrink-0" />
                    {volunteer.email ? (
                      <a href={`mailto:${volunteer.email}`} className="hover:text-primary transition-colors hover:underline">{volunteer.email}</a>
                    ) : <span className="text-muted-foreground italic">No email</span>}
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <Phone size={16} className="text-muted-foreground shrink-0" />
                    {volunteer.phone ? (
                      <a href={`tel:${volunteer.phone}`} className="hover:text-primary transition-colors hover:underline">{volunteer.phone}</a>
                    ) : <span className="text-muted-foreground italic">No phone</span>}
                  </div>
                </div>
              </div>

              {volunteer.isStudent && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guardian Info</h4>
                  <div className="space-y-3 bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm">
                    {volunteer.schoolName && (
                      <div className="flex items-center gap-3 text-foreground mb-4 pb-4 border-b border-accent/20">
                        <MapPin size={16} className="text-muted-foreground shrink-0" />
                        <span>{volunteer.schoolName}</span>
                      </div>
                    )}
                    <div className="font-medium text-foreground mb-2">{volunteer.guardianName}</div>
                    <div className="flex items-center gap-3 text-foreground">
                      <Phone size={16} className="text-muted-foreground shrink-0" />
                      {volunteer.guardianPhone ? (
                        <a href={`tel:${volunteer.guardianPhone}`} className="hover:text-primary transition-colors hover:underline">{volunteer.guardianPhone}</a>
                      ) : <span className="text-muted-foreground italic">No phone</span>}
                    </div>
                    {volunteer.guardianEmail && (
                      <div className="flex items-center gap-3 text-foreground mt-3">
                        <Mail size={16} className="text-muted-foreground shrink-0" />
                        <a href={`mailto:${volunteer.guardianEmail}`} className="hover:text-primary transition-colors hover:underline">{volunteer.guardianEmail}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ministry Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border rounded-xl p-5 flex flex-col justify-center items-center text-center">
                    <Clock size={20} className="text-primary mb-2 opacity-80" />
                    <span className="text-3xl font-serif text-foreground leading-none mb-1">
                      {volunteer.totalApprovedHours || 0}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Approved Hours</span>
                  </div>
                  <div className="bg-card border rounded-xl p-5 flex flex-col justify-center items-center text-center">
                    <Calendar size={20} className="text-secondary mb-2 opacity-80" />
                    <span className="text-3xl font-serif text-foreground leading-none mb-1">
                      {volunteer.upcomingSignups?.length || 0}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Upcoming Slots</span>
                  </div>
                </div>
              </div>

              {volunteer.upcomingSignups && volunteer.upcomingSignups.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Schedule</h4>
                  <div className="space-y-2">
                    {volunteer.upcomingSignups.map(signup => (
                      <div key={signup.id} className="p-3 bg-card border rounded-lg flex items-center justify-between gap-3 text-sm hover:border-primary/30 transition-colors">
                        <div>
                          <div className="font-medium text-foreground mb-0.5">{signup.slotTitle}</div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(signup.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {signup.startTime}
                          </div>
                        </div>
                        {getStatusIcon(signup.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {volunteer.notes && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internal Notes</h4>
                  <div className="p-4 bg-muted/20 border rounded-xl text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {volunteer.notes}
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
