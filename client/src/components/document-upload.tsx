import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { domains, type Domain } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onUpload: (name: string, content: string, domain: Domain) => Promise<void>;
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [domain, setDomain] = useState<Domain>("general");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!name) {
      setName(file.name.replace(/\.[^/.]+$/, ""));
    }

    try {
      const text = await file.text();
      setContent(text);
    } catch (err) {
      toast({
        title: "Error reading file",
        description: "Could not read the file content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a document name and content.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(name.trim(), content, domain);
      toast({
        title: "Document uploaded",
        description: `"${name}" has been processed and added to the knowledge base.`,
      });
      setIsOpen(false);
      setName("");
      setContent("");
      setFileName("");
      setDomain("general");
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Could not process the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-upload-document">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-upload">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Add a document to the knowledge base. Supports plain text and PDF files.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-name">Document Name</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
              data-testid="input-document-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-domain">Domain</Label>
            <Select value={domain} onValueChange={(v) => setDomain(v as Domain)}>
              <SelectTrigger id="doc-domain" data-testid="select-document-domain">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Upload File</Label>
            <div
              className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.md,.json"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-file"
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm">{fileName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileName("");
                      setContent("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    TXT, PDF, MD, JSON files supported
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-content">Or Paste Content</Label>
            <Textarea
              id="doc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste document content here..."
              className="min-h-[150px]"
              data-testid="input-document-content"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isUploading || !name.trim() || !content.trim()}
            className="w-full"
            data-testid="button-submit-upload"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload Document"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
