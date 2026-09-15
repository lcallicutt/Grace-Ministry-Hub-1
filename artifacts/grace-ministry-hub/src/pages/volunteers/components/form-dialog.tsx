import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateVolunteer, useUpdateVolunteer, useGetVolunteer, getGetVolunteersQueryKey, getGetVolunteerQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  team: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
  isStudent: z.boolean(),
  schoolName: z.string().optional().or(z.literal("")),
  guardianName: z.string().optional().or(z.literal("")),
  guardianPhone: z.string().optional().or(z.literal("")),
  guardianEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
}).refine(data => {
  if (data.isStudent) {
    return !!data.guardianName && !!data.guardianPhone;
  }
  return true;
}, {
  message: "Guardian name and phone are required for students",
  path: ["guardianName"],
});

type FormValues = z.infer<typeof formSchema>;

export function VolunteerFormDialog({ 
  isOpen, 
  onClose,
  editId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  editId?: number | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVolunteer = useCreateVolunteer();
  const updateVolunteer = useUpdateVolunteer();
  const { data: volunteerToEdit, isLoading: isLoadingEdit } = useGetVolunteer(editId as number, {
    query: {
      enabled: !!editId && isOpen,
      queryKey: getGetVolunteerQueryKey(editId as number),
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      team: "",
      status: "active",
      isStudent: false,
      schoolName: "",
      guardianName: "",
      guardianPhone: "",
      guardianEmail: "",
      notes: "",
    }
  });

  const isStudent = form.watch("isStudent");

  useEffect(() => {
    if (isOpen && !editId) {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        team: "",
        status: "active",
        isStudent: false,
        schoolName: "",
        guardianName: "",
        guardianPhone: "",
        guardianEmail: "",
        notes: "",
      });
    } else if (isOpen && editId && volunteerToEdit) {
      form.reset({
        firstName: volunteerToEdit.firstName,
        lastName: volunteerToEdit.lastName,
        email: volunteerToEdit.email || "",
        phone: volunteerToEdit.phone || "",
        team: volunteerToEdit.team || "",
        status: volunteerToEdit.status as "active" | "inactive",
        isStudent: volunteerToEdit.isStudent,
        schoolName: volunteerToEdit.schoolName || "",
        guardianName: volunteerToEdit.guardianName || "",
        guardianPhone: volunteerToEdit.guardianPhone || "",
        guardianEmail: volunteerToEdit.guardianEmail || "",
        notes: volunteerToEdit.notes || "",
      });
    }
  }, [isOpen, editId, volunteerToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      team: values.team || null,
      schoolName: values.schoolName || null,
      guardianName: values.guardianName || null,
      guardianPhone: values.guardianPhone || null,
      guardianEmail: values.guardianEmail || null,
      notes: values.notes || null,
    };

    try {
      if (editId) {
        await updateVolunteer.mutateAsync({
          volunteerId: editId,
          data: payload
        });
        queryClient.invalidateQueries({ queryKey: getGetVolunteersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetVolunteerQueryKey(editId) });
        toast({ title: "Volunteer profile updated" });
      } else {
        await createVolunteer.mutateAsync({ data: payload });
        queryClient.invalidateQueries({ queryKey: getGetVolunteersQueryKey() });
        toast({ title: "New volunteer added to roster" });
      }
      onClose();
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    }
  };

  const isPending = createVolunteer.isPending || updateVolunteer.isPending;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-end sm:justify-center sm:p-6", 
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div 
        className="fixed inset-0 z-0" 
        onClick={() => !isPending && onClose()} 
        aria-hidden="true" 
      />
      
      <div className={cn(
        "relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-card text-card-foreground sm:rounded-2xl rounded-t-2xl border shadow-2xl transition-all duration-300 ease-out z-10",
        isOpen ? "translate-y-0 scale-100" : "translate-y-full sm:translate-y-8 sm:scale-95"
      )}>
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-muted/10 sm:rounded-t-2xl rounded-t-2xl">
          <div>
            <h2 className="text-xl font-serif text-foreground">
              {editId ? "Edit Volunteer" : "Add Volunteer"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {editId ? "Update contact and ministry details." : "Add a new team member to your roster."}
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={isPending}
            aria-label="Close volunteer form"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {(editId && isLoadingEdit) ? (
          <div className="p-12 flex justify-center items-center flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
              <form id="volunteer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input {...field} placeholder="Jane" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input {...field} placeholder="Doe" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} placeholder="jane@example.com" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input type="tel" {...field} placeholder="(555) 123-4567" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="team" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Team</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. Welcome, Worship, Kids" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="border-t pt-6 mt-6">
                  <FormField control={form.control} name="isStudent" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/20">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 mt-0.5 accent-primary rounded cursor-pointer" 
                          checked={field.value} 
                          onChange={(e) => field.onChange(e.target.checked)} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <FormLabel className="font-medium cursor-pointer">This volunteer is a student / minor</FormLabel>
                        <FormDescription>
                          Requires guardian contact information for background checks and communication.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )} />
                </div>

                {isStudent && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormField control={form.control} name="schoolName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. Lincoln High" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="guardianName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guardian Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input {...field} placeholder="Guardian Full Name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="guardianPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guardian Phone <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input {...field} placeholder="(555) 123-4567" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="guardianEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Email (Optional)</FormLabel>
                        <FormControl><Input type="email" {...field} placeholder="guardian@example.com" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                <div className="border-t pt-6 mt-6">
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Allergies, background check dates, special skills..." 
                          className="min-h-[100px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

              </form>
            </Form>
          </div>
        )}

        <div className="p-6 border-t shrink-0 flex justify-end gap-3 bg-muted/10 sm:rounded-b-2xl">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="volunteer-form" disabled={isPending || isLoadingEdit}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editId ? "Save Changes" : "Add Volunteer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
