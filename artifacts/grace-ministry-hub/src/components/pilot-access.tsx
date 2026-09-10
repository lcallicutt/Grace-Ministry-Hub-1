import { FormEvent, type ReactNode, useState } from "react";
import {
  getGetPilotAccessStatusQueryKey,
  useGetPilotAccessStatus,
  useStartPilotAccess,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PilotAccess({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetPilotAccessStatus({
    query: {
      retry: false,
      queryKey: getGetPilotAccessStatusQueryKey(),
    },
  });
  const [password, setPassword] = useState("");
  const login = useStartPilotAccess({
    mutation: {
      onSuccess: () => {
        setPassword("");
        queryClient.setQueryData(getGetPilotAccessStatusQueryKey(), {
          authenticated: true,
        });
      },
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password.trim()) login.mutate({ data: { password } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (data?.authenticated) return children;

  return (
    <main className="min-h-screen bg-background relative overflow-hidden grid place-items-center p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--secondary)/0.16),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.45),transparent_35%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border bg-card/95 p-7 shadow-xl backdrop-blur md:p-9">
        <img
          src={`${import.meta.env.BASE_URL}grace-logo.png`}
          alt="Grace Ministry Hub"
          className="mx-auto h-24 w-auto object-contain"
        />
        <div className="mt-6 text-center">
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole size={21} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl text-foreground">Private pilot access</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Grace Ministry Hub is currently available through a complimentary
            30-day pilot. Access and AI usage are manually managed during this period.
          </p>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input
            type="text"
            name="username"
            value="grace-pilot"
            autoComplete="username"
            readOnly
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <div>
            <label htmlFor="pilot-password" className="text-sm font-medium text-foreground">
              Pilot password
            </label>
            <Input
              id="pilot-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2"
              autoFocus
              required
            />
          </div>
          {login.isError && (
            <p role="alert" className="text-sm text-destructive">
              The password was not accepted. Check it and try again.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={login.isPending || !password.trim()}>
            {login.isPending ? "Checking access…" : "Enter Grace Ministry Hub"}
          </Button>
        </form>
        <div className="mt-6 flex items-start gap-3 rounded-lg bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
          <p>Please do not share this password outside your participating ministry team.</p>
        </div>
      </section>
    </main>
  );
}