import { useState } from 'react';
import { Document } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  AlertCircle, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  Target, 
  ListFilter,
  Filter
} from 'lucide-react';

import DocumentAnalysisCard, { DocumentAnalysisResult } from './DocumentAnalysisCard';

interface DocumentsAnalysisListProps {
  documents: Document[];
  isLoading: boolean;
  error: Error | null;
  onAnalysisComplete?: (documentId: number, analysis: DocumentAnalysisResult) => void;
}

export default function DocumentsAnalysisList({
  documents,
  isLoading,
  error,
  onAnalysisComplete
}: DocumentsAnalysisListProps) {
  const [analyzedDocuments, setAnalyzedDocuments] = useState<{[key: number]: DocumentAnalysisResult}>({});
  
  const handleAnalysisComplete = (analysis: DocumentAnalysisResult) => {
    setAnalyzedDocuments(prev => ({
      ...prev,
      [analysis.documentId]: analysis
    }));
    
    if (onAnalysisComplete) {
      onAnalysisComplete(analysis.documentId, analysis);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="w-full animate-pulse opacity-60">
            <CardHeader className="pb-2">
              <div className="h-7 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load documents: {error.message}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!documents || documents.length === 0) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>No documents available</AlertTitle>
        <AlertDescription>
          Upload some documents to analyze them for grant matching.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Document Analysis</h3>
        <Badge variant="outline" className="font-normal flex items-center">
          <ListFilter className="h-3 w-3 mr-1" />
          {documents.length} Documents Available
        </Badge>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {documents.map(doc => (
          <DocumentAnalysisCard
            key={doc.id}
            documentId={doc.id}
            documentTitle={doc.title}
            documentType={doc.type}
            onAnalysisComplete={handleAnalysisComplete}
          />
        ))}
      </div>
      
      {Object.keys(analyzedDocuments).length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Analysis Summary
              </CardTitle>
              <CardDescription>
                Overview of all document analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Top Topics Identified</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(
                      Object.values(analyzedDocuments).flatMap(a => a.topics)
                    )).slice(0, 10).map((topic, i) => (
                      <Badge key={i} variant="outline">{topic}</Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-semibold mb-1">Key Audience Groups</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(
                      Object.values(analyzedDocuments).flatMap(a => a.targetAudience)
                    )).slice(0, 10).map((audience, i) => (
                      <Badge key={i} variant="secondary">{audience}</Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-semibold mb-1">Most Relevant Documents</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {Object.values(analyzedDocuments)
                      .sort((a, b) => b.relevanceScore - a.relevanceScore)
                      .slice(0, 3)
                      .map(analysis => (
                        <li key={analysis.documentId} className="mb-1">
                          <span className="font-medium">{analysis.title}</span>
                          <span className="text-muted-foreground"> - {analysis.relevanceScore}% relevant</span>
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                <Filter className="mr-2 h-3 w-3" />
                Use Analysis to Improve Recommendations
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}