import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useImportVolunteers, getGetVolunteersQueryKey, VolunteerImportRow } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i+1];
    
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++; // skip trailing newline of CRLF
      row.push(current);
      if (row.some(c => c.trim() !== '')) {
        result.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    if (row.some(c => c.trim() !== '')) {
      result.push(row);
    }
  }
  return result;
}

export function ImportDialog({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const importVolunteers = useImportVolunteers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<VolunteerImportRow[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setParseError(null);
    
    try {
      const text = await selected.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        setParseError("File appears to be empty or missing data rows.");
        return;
      }

      const headers = rows[0];
      const map: Record<string, number> = {};
      headers.forEach((h, i) => {
        const norm = h.trim().toLowerCase();
        if (norm === 'first_name' || norm === 'firstname' || norm === 'first name') map['firstName'] = i;
        if (norm === 'last_name' || norm === 'lastname' || norm === 'last name') map['lastName'] = i;
        if (norm === 'email') map['email'] = i;
        if (norm === 'phone') map['phone'] = i;
        if (norm === 'team') map['team'] = i;
      });

      if (map['firstName'] === undefined || map['lastName'] === undefined) {
        setParseError("CSV must contain 'first_name' and 'last_name' columns.");
        return;
      }

      const validRows: VolunteerImportRow[] = [];
      let errs = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const firstName = row[map['firstName']]?.trim();
        const lastName = row[map['lastName']]?.trim();
        const email = map['email'] !== undefined ? row[map['email']]?.trim() : '';
        const phone = map['phone'] !== undefined ? row[map['phone']]?.trim() : '';
        const team = map['team'] !== undefined ? row[map['team']]?.trim() : '';

        if (!firstName || !lastName) {
          errs++;
          continue;
        }

        validRows.push({
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          team: team || null
        });
      }

      setParsedRows(validRows);
      setErrorCount(errs);

    } catch (err) {
      setParseError("Failed to parse CSV file. Please check the format.");
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    
    try {
      const res = await importVolunteers.mutateAsync({
        data: { volunteers: parsedRows }
      });
      queryClient.invalidateQueries({ queryKey: getGetVolunteersQueryKey() });
      toast({ title: `Successfully imported ${res.imported} volunteers` });
      handleClose();
    } catch (err) {
      toast({ title: "Import failed", description: "An error occurred during import.", variant: "destructive" });
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setErrorCount(0);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-all duration-300 flex items-center justify-center p-4", 
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div 
        className="fixed inset-0 z-0" 
        onClick={() => !importVolunteers.isPending && handleClose()} 
        aria-hidden="true" 
      />
      
      <div className={cn(
        "relative w-full max-w-lg bg-card text-card-foreground rounded-2xl border shadow-xl transition-transform duration-300 ease-out z-10 flex flex-col max-h-[90vh]",
        isOpen ? "scale-100" : "scale-95"
      )}>
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-muted/10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-serif text-foreground">Import Volunteers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a CSV to bulk add volunteers.
            </p>
          </div>
          <button 
            onClick={handleClose}
            disabled={importVolunteers.isPending}
            aria-label="Close CSV import"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!file && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Upload size={24} />
                </div>
                <div className="font-medium text-foreground mb-1">Click to upload CSV</div>
                <div className="text-sm text-muted-foreground max-w-[250px]">
                  Requires columns: first_name, last_name, email, phone, team
                </div>
              </div>
            </div>
          )}

          {parseError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 text-destructive">
              <AlertCircle size={20} className="shrink-0" />
              <div className="text-sm font-medium">{parseError}</div>
            </div>
          )}

          {file && !parseError && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <FileText size={24} className="text-primary" />
                  <div>
                    <div className="font-medium text-sm text-foreground">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-muted-foreground">
                  Change
                </Button>
              </div>

              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Preview ({parsedRows.length} valid rows)</h4>
                  <div className="border rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted text-muted-foreground uppercase">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Team</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedRows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="bg-card">
                            <td className="px-3 py-2 font-medium">{row.firstName} {row.lastName}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.email || '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.team || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedRows.length > 3 && (
                      <div className="px-3 py-2 text-center text-muted-foreground bg-muted/30 border-t">
                        ...and {parsedRows.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errorCount > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-600 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{errorCount} row{errorCount > 1 ? 's' : ''} skipped. </span>
                    Missing first_name or last_name.
                  </div>
                </div>
              )}
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileChange}
          />
        </div>

        <div className="p-6 border-t shrink-0 flex justify-end gap-3 bg-muted/10 rounded-b-2xl">
          <Button type="button" variant="outline" onClick={handleClose} disabled={importVolunteers.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedRows.length === 0 || importVolunteers.isPending}
            className="gap-2"
          >
            {importVolunteers.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Import {parsedRows.length > 0 ? parsedRows.length : ''} Volunteers
          </Button>
        </div>
      </div>
    </div>
  );
}
