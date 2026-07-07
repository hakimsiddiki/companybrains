import { useState, useCallback, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Upload, FileText, Search, MoreVertical, Trash2, Download,
  CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/Seo";

interface DocRow {
  id: string;
  name: string;
  type: string;
  size_bytes: number;
  storage_path: string;
  status: string;
  access_role: string;
  created_at: string;
}

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef<Set<string>>(new Set());

  const processDoc = useCallback(async (id: string) => {
    if (processingRef.current.has(id)) return;
    processingRef.current.add(id);
    try {
      await supabase.functions.invoke("process-document", { body: { documentId: id } });
    } catch {
      /* status will reflect error; ignore here */
    } finally {
      processingRef.current.delete(id);
      loadDocs();
    }
  }, []);

  const loadDocs = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load documents");
      return;
    }
    setDocuments(data ?? []);
    // Re-trigger extraction for any documents still pending processing.
    (data ?? [])
      .filter((d) => d.status === "processing")
      .forEach((d) => processDoc(d.id));
  }, [processDoc]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle()
      .then(({ data }) => setCompanyId(data?.company_id ?? null));
    loadDocs();
  }, [user, loadDocs]);

  const handleFiles = useCallback(async (files: File[]) => {
    if (!companyId || !user) {
      toast.error("Workspace not ready, please refresh");
      return;
    }
    const PDF_MIME = "application/pdf";
    const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const MAX_BYTES = 20 * 1024 * 1024; // 20MB
    const validFiles = files.filter(f => {
      const n = f.name.toLowerCase();
      const extOk = n.endsWith(".pdf") || n.endsWith(".docx");
      // Browsers sometimes leave f.type empty; require it to be empty OR an allowed MIME.
      const mimeOk = !f.type || f.type === PDF_MIME || f.type === DOCX_MIME;
      const sizeOk = f.size > 0 && f.size <= MAX_BYTES;
      return extOk && mimeOk && sizeOk;
    });
    if (validFiles.length === 0) {
      toast.error("Please upload PDF or DOCX files only");
      return;
    }
    if (validFiles.length !== files.length) {
      toast.warning("Some files were skipped (only PDF/DOCX allowed)");
    }

    setUploading(true);
    let successCount = 0;

    for (const file of validFiles) {
      const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";
      const path = `${companyId}/${Date.now()}-${file.name}`;

      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }

      const { data: inserted, error: insErr } = await supabase.from("documents").insert({
        company_id: companyId,
        uploaded_by: user.id,
        name: file.name,
        type: ext,
        size_bytes: file.size,
        storage_path: path,
        status: "processing",
        access_role: "all",
      }).select("id").single();
      if (insErr || !inserted) {
        toast.error(`DB insert failed: ${file.name}`);
        await supabase.storage.from("documents").remove([path]);
        continue;
      }
      // Extract text in the background so the AI can read this document.
      processDoc(inserted.id);
      successCount++;
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded — processing for AI…`);
      loadDocs();
    }
  }, [companyId, user, loadDocs, processDoc]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleDelete = async (doc: DocRow) => {
    await supabase.storage.from("documents").remove([doc.storage_path]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Document deleted");
    loadDocs();
  };

  const handleDownload = async (doc: DocRow) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 60);
    if (error || !data) {
      toast.error("Download failed");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const filteredDocuments = documents.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    if (status === "ready") return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
        <CheckCircle className="w-3 h-3 mr-1" />Ready
      </Badge>
    );
    if (status === "processing") return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
        <Clock className="w-3 h-3 mr-1 animate-spin" />Processing
      </Badge>
    );
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
        <AlertCircle className="w-3 h-3 mr-1" />Error
      </Badge>
    );
  };

  const formatSize = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <DashboardLayout>
      <Seo
        title="Documents — Company Brain"
        description="Upload, organize, and manage the PDF and DOCX documents that power your company's AI knowledge base, with role-based access controls."
        path="/documents"
        noindex
      />
      <div className="space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
            ${isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            multiple
            onChange={handleFileSelect}
          />
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Upload className={`w-6 h-6 text-accent ${uploading ? "animate-bounce" : ""}`} />
          </div>
          <h3 className="font-semibold mb-1">{uploading ? "Uploading..." : "Upload documents"}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop PDF or DOCX files, or click to browse
          </p>
          <Button variant="accent" size="sm" type="button" disabled={uploading}>
            Select files
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Access role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="hr">HR only</SelectItem>
              <SelectItem value="sales">Sales only</SelectItem>
              <SelectItem value="support">Support only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Name</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Size</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Uploaded</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Access</th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      {searchQuery ? "No documents found" : "No documents uploaded yet"}
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-accent" />
                          </div>
                          <span className="font-medium text-sm truncate max-w-[200px] sm:max-w-[300px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{formatSize(doc.size_bytes)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant="secondary" className="capitalize">{doc.access_role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()} aria-label={`Actions for ${doc.name}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4 mr-2" />Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(doc)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Documents" value={documents.length.toString()} />
          <StatCard label="Ready" value={documents.filter(d => d.status === "ready").length.toString()} />
          <StatCard label="Processing" value={documents.filter(d => d.status === "processing").length.toString()} />
          <StatCard label="Total Size" value={documents.length > 0 ? formatSize(documents.reduce((a, d) => a + d.size_bytes, 0)) : "0 MB"} />
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card border rounded-xl p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
  </div>
);

export default Documents;
