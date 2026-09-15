import { useState, useMemo } from "react";
import { useGetVolunteers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Upload, Plus, Filter, UserCheck, GraduationCap } from "lucide-react";
import { VolunteerDetailSheet } from "./components/detail-sheet";
import { VolunteerFormDialog } from "./components/form-dialog";
import { ImportDialog } from "./components/import-dialog";
import { cn } from "@/lib/utils";

export default function VolunteersPage() {
  const { data: volunteers, isLoading } = useGetVolunteers();
  
  const [activeTab, setActiveTab] = useState("roster");
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const tabs = [
    { id: "roster", label: "Roster", disabled: false },
    { id: "slots", label: "Slots", disabled: true },
    { id: "signups", label: "Sign-ups", disabled: true },
    { id: "hours", label: "Hours", disabled: true },
  ];

  const uniqueTeams = useMemo(() => {
    if (!volunteers) return [];
    const teams = new Set(volunteers.map(v => v.team).filter(Boolean));
    return Array.from(teams) as string[];
  }, [volunteers]);

  const filteredVolunteers = useMemo(() => {
    if (!volunteers) return [];
    return volunteers.filter(v => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        v.firstName.toLowerCase().includes(search) || 
        v.lastName.toLowerCase().includes(search) ||
        (v.email?.toLowerCase().includes(search) || false) ||
        (v.phone?.toLowerCase().includes(search) || false);
      
      const matchesTeam = teamFilter === "all" || v.team === teamFilter;
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const matchesStudent = studentFilter === "all" || (studentFilter === "student" ? v.isStudent : !v.isStudent);
      
      return matchesSearch && matchesTeam && matchesStatus && matchesStudent;
    });
  }, [volunteers, searchTerm, teamFilter, statusFilter, studentFilter]);

  const handleExport = () => {
    if (!filteredVolunteers.length) return;
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Team', 'Status', 'Student', 'School', 'Guardian', 'Guardian Phone'];
    const rows = filteredVolunteers.map(v => [
      v.firstName,
      v.lastName,
      v.email || '',
      v.phone || '',
      v.team || '',
      v.status,
      v.isStudent ? 'Yes' : 'No',
      v.schoolName || '',
      v.guardianName || '',
      v.guardianPhone || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'volunteers_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (id: number) => {
    setSelectedId(null);
    setEditId(id);
    setTimeout(() => setIsFormOpen(true), 150);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditId(null), 300);
  };

  return (
    <div className="h-full flex flex-col bg-background animate-in fade-in duration-500">
      <div className="px-6 md:px-10 pt-8 pb-4 shrink-0 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-foreground mb-2">Volunteers</h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Manage your ministry team, view contact details, and organize scheduling.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2 bg-background hover:bg-muted">
              <Upload size={16} /> Import
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2 shadow-sm">
              <Plus size={16} /> Add Volunteer
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-border/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground",
                tab.disabled && "opacity-50 cursor-not-allowed hover:text-muted-foreground"
              )}
              title={tab.disabled ? "Coming soon" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 md:px-10 pb-10">
        <div className="space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search volunteers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 pb-2 xl:pb-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card border rounded-md text-sm shrink-0">
                <Filter size={14} className="text-muted-foreground" />
                <select 
                  className="bg-transparent border-none text-sm focus:outline-none cursor-pointer"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  aria-label="Filter by team"
                >
                  <option value="all">All Teams</option>
                  {uniqueTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-card border rounded-md text-sm shrink-0">
                <select 
                  className="bg-transparent border-none text-sm focus:outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">Any Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-card border rounded-md text-sm shrink-0">
                <select 
                  className="bg-transparent border-none text-sm focus:outline-none cursor-pointer"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  aria-label="Filter by age group"
                >
                  <option value="all">All Ages</option>
                  <option value="adult">Adults</option>
                  <option value="student">Students</option>
                </select>
              </div>

              {filteredVolunteers.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleExport} className="gap-2 shrink-0 text-muted-foreground hover:text-foreground">
                  <Download size={14} /> Export CSV
                </Button>
              )}
            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredVolunteers.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                  <UserCheck size={24} />
                </div>
                <h3 className="text-lg font-serif mb-1">No volunteers found</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md">
                  {searchTerm || teamFilter !== 'all' || statusFilter !== 'all' || studentFilter !== 'all'
                    ? "Try adjusting your filters to see more results."
                    : "Your roster is currently empty. Add your first volunteer to get started."}
                </p>
                {(!searchTerm && teamFilter === 'all' && statusFilter === 'all' && studentFilter === 'all') && (
                  <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                    <Plus size={16} /> Add Volunteer
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                    <tr>
                      <th className="px-5 py-4 font-medium">Name</th>
                      <th className="px-5 py-4 font-medium">Team</th>
                      <th className="px-5 py-4 font-medium">Contact</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredVolunteers.map((vol) => (
                      <tr 
                        key={vol.id} 
                        onClick={() => setSelectedId(vol.id)}
                        className="bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {vol.firstName} {vol.lastName}
                            </span>
                            {vol.isStudent && (
                              <span title="Student" className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                                <GraduationCap size={12} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {vol.team || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col text-xs space-y-0.5">
                            {vol.email && <span className="text-muted-foreground truncate max-w-[200px]">{vol.email}</span>}
                            {vol.phone && <span className="text-muted-foreground truncate">{vol.phone}</span>}
                            {!vol.email && !vol.phone && <span className="text-muted-foreground/50">No contact info</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider inline-block",
                            vol.status === 'active' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {vol.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <VolunteerDetailSheet 
        id={selectedId} 
        onClose={() => setSelectedId(null)} 
        onEdit={handleEdit}
      />
      <VolunteerFormDialog 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        editId={editId}
      />
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
}
