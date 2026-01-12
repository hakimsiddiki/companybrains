import { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  FileText, 
  Search, 
  MoreVertical, 
  Trash2, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx";
  size: string;
  uploadedAt: Date;
  status: "processing" | "ready" | "error";
  accessRole: string;
}

const mockDocuments: Document[] = [
  { id: "1", name: "HR Policy Manual 2024.pdf", type: "pdf", size: "2.4 MB", uploadedAt: new Date("2024-01-15"), status: "ready", accessRole: "all" },
  { id: "2", name: "Employee Handbook.docx", type: "docx", size: "1.8 MB", uploadedAt: new Date("2024-01-14"), status: "ready", accessRole: "all" },
  { id: "3", name: "Sales Playbook Q1.pdf", type: "pdf", size: "5.2 MB", uploadedAt: new Date("2024-01-13"), status: "ready", accessRole: "sales" },
  { id: "4", name: "Technical Documentation.pdf", type: "pdf", size: "8.1 MB", uploadedAt: new Date("2024-01-12"), status: "processing", accessRole: "support" },
  { id: "5", name: "Onboarding Guide.docx", type: "docx", size: "3.2 MB", uploadedAt: new Date("2024-01-10"), status: "ready", accessRole: "hr" },
];

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    setUploading(true);
    
    // Simulate upload
    const newDocs: Document[] = files.map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      name: file.name,
      type: file.name.endsWith(".pdf") ? "pdf" : "docx",
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date(),
      status: "processing" as const,
      accessRole: "all",
    }));

    setDocuments((prev) => [...newDocs, ...prev]);

    // Simulate processing completion
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) =>
          newDocs.find((nd) => nd.id === doc.id)
            ? { ...doc, status: "ready" as const }
            : doc
        )
      );
      setUploading(false);
    }, 3000);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}
          `}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx"
            multiple
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Upload className={`w-6 h-6 text-accent ${uploading ? "animate-bounce" : ""}`} />
            </div>
            <h3 className="font-semibold mb-1">
              {uploading ? "Uploading..." : "Upload documents"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop PDF or DOCX files, or click to browse
            </p>
            <Button variant="accent" size="sm">
              Select files
            </Button>
          </label>
        </div>

        {/* Search and filters */}
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

        {/* Documents list */}
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
                          <span className="font-medium text-sm truncate max-w-[200px] sm:max-w-[300px]">
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {doc.size}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {doc.uploadedAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant="secondary" className="capitalize">
                          {doc.accessRole}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(doc.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Documents" value={documents.length.toString()} />
          <StatCard label="Ready" value={documents.filter(d => d.status === "ready").length.toString()} />
          <StatCard label="Processing" value={documents.filter(d => d.status === "processing").length.toString()} />
          <StatCard label="Total Size" value="20.7 MB" />
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
