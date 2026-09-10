import { Link, useLocation } from "wouter";
import { MessageSquare, LayoutList, Building2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEndPilotAccess,
  useGetChurchProfile,
} from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [desktopNavigationExpanded, setDesktopNavigationExpanded] = useState(true);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { data: profile } = useGetChurchProfile();
  const endPilotAccess = useEndPilotAccess({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        window.location.reload();
      },
    },
  });
  const sidebarOpen = isMobile ? mobileNavigationOpen : desktopNavigationExpanded;

  const navItems = [
    { href: "/", label: "Workspace", icon: MessageSquare },
    { href: "/service-builder", label: "Service Builder", icon: LayoutList },
    { href: "/church-profile", label: "Church Profile", icon: Building2 },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {sidebarOpen && isMobile && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 bg-foreground/35"
          onClick={() => setMobileNavigationOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-30 md:relative overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "w-64" : "w-0 md:w-16"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          <div className={cn("flex items-center gap-3 overflow-hidden", !sidebarOpen && "md:hidden")}>
            <img
              src="/grace-mark.png"
              alt=""
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="font-serif font-semibold text-lg truncate whitespace-nowrap">
              Grace
            </span>
          </div>
          <button 
            onClick={() => setDesktopNavigationExpanded((expanded) => !expanded)}
            aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors hidden md:block shrink-0"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  onClick={() => isMobile && setMobileNavigationOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative cursor-pointer",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className={cn("truncate transition-opacity", !sidebarOpen && "md:opacity-0 md:w-0")}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className={cn("flex items-center gap-3", !sidebarOpen && "md:hidden")}>
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <Building2 size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{profile?.churchName || "Loading..."}</span>
              <span className="text-xs text-sidebar-foreground/60 truncate">Ministry Team</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        <div className="shrink-0 border-b border-accent bg-accent/45 px-4 py-2 text-xs font-medium text-accent-foreground">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
            <span className="text-center">
              Complimentary 30-day pilot · Access and AI usage are manually managed during the pilot period.
            </span>
            <button
              type="button"
              className="shrink-0 underline underline-offset-2 hover:no-underline disabled:opacity-60"
              onClick={() => endPilotAccess.mutate()}
              disabled={endPilotAccess.isPending}
            >
              End session
            </button>
          </div>
        </div>
        <header className="h-16 md:hidden flex items-center px-4 border-b bg-background/80 backdrop-blur-sm z-10 shrink-0">
          <button 
            onClick={() => setMobileNavigationOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileNavigationOpen}
            className="text-foreground/70 hover:text-foreground"
          >
            <PanelLeftOpen size={24} />
          </button>
          <img src="/grace-mark.png" alt="" className="ml-4 h-8 w-8 object-contain" />
          <span className="font-serif font-semibold ml-2">Grace Ministry Hub</span>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
