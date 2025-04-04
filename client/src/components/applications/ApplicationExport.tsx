import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Application, Grant, Artist } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Download,
  FileText,
  FileIcon,
  Save
} from "lucide-react";

interface ApplicationExportProps {
  application: Application;
  grant: Grant;
  artist: Artist;
  onExportComplete?: () => void;
}

export function ApplicationExport({
  application,
  grant,
  artist,
  onExportComplete,
}: ApplicationExportProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx">("pdf");
  
  // Export application mutation
  const exportMutation = useMutation({
    mutationFn: async (format: "pdf" | "docx") => {
      const response = await apiRequest(
        "POST", 
        `/api/applications/${application.id}/export`,
        { format }
      );
      
      if (!response.ok) {
        throw new Error("Failed to export application");
      }
      
      return await response.blob();
    },
    onSuccess: (blob) => {
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${grant.name.replace(/\s+/g, "_")}_application.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: `Your application has been exported as ${exportFormat.toUpperCase()}`,
      });
      
      if (onExportComplete) {
        onExportComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleExport = (format: "pdf" | "docx") => {
    setExportFormat(format);
    exportMutation.mutate(format);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Export Application</CardTitle>
        <CardDescription>
          Export your completed application in your preferred format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around">
          <div className="flex flex-col items-center">
            <div className="w-24 h-32 flex items-center justify-center border rounded-md bg-primary/5 mb-4">
              <FileText className="h-12 w-12 text-primary/70" />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 mt-2"
              onClick={() => handleExport("pdf")}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4" />
              Export as PDF
            </Button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-24 h-32 flex items-center justify-center border rounded-md bg-blue-500/5 mb-4">
              <FileIcon className="h-12 w-12 text-blue-500/70" />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 mt-2"
              onClick={() => handleExport("docx")}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4" />
              Export as Word
            </Button>
          </div>
        </div>
        
        {exportMutation.isPending && (
          <div className="mt-6 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Preparing your document...</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          This will export your application to submit directly to {grant.organization}.
        </p>
        <Button 
          size="sm" 
          onClick={() => handleExport("pdf")}
          disabled={exportMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {exportMutation.isPending ? "Exporting..." : "Quick Export"}
        </Button>
      </CardFooter>
    </Card>
  );
}