import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
  Target 
} from 'lucide-react';

export interface DocumentAnalysisResult {
  documentId: number;
  title: string;
  summary: string;
  topics: string[];
  relevanceScore: number;
  keyInsights: string[];
  targetAudience: string[];
}

interface DocumentAnalysisCardProps {
  documentId: number;
  documentTitle: string;
  documentType: string;
  onAnalysisComplete?: (analysis: DocumentAnalysisResult) => void;
}

export default function DocumentAnalysisCard({
  documentId,
  documentTitle,
  documentType,
  onAnalysisComplete
}: DocumentAnalysisCardProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/ai/analyze-document/${documentId}`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.analysis) {
        const analysisResult = data.analysis;
        setAnalysis(analysisResult);
        if (onAnalysisComplete) {
          onAnalysisComplete(analysisResult);
        }
        toast({
          title: 'Document analysis complete',
          description: 'We\'ve analyzed your document to help find relevant grants.',
        });
      } else {
        toast({
          title: 'Analysis error',
          description: 'Could not analyze document content',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    },
  });
  
  const handleAnalyze = () => {
    analyzeMutation.mutate();
  };
  
  if (analyzeMutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Analyzing Document
          </CardTitle>
          <CardDescription>
            Our AI is analyzing "{documentTitle}" to extract insights
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">This may take a minute...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (analyzeMutation.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {analyzeMutation.error?.message || 'An error occurred while analyzing the document'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} variant="outline">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Analysis
          </CardTitle>
          <CardDescription>
            Analyze this document to extract key insights for grant matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI analysis helps identify how this document relates to potential grants. Our system will extract relevant information that can improve grant recommendations.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} className="w-full">
            <Brain className="mr-2 h-4 w-4" />
            Analyze Document
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Display analysis results
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Document Analysis Complete
            </CardTitle>
            <CardDescription>
              AI analysis of "{analysis.title}"
            </CardDescription>
          </div>
          <Badge variant={analysis.relevanceScore > 70 ? "default" : "outline"}>
            <Target className="mr-1 h-3 w-3" />
            {analysis.relevanceScore}% Relevant
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-1">Summary</h4>
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-semibold mb-1">Key Insights</h4>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {analysis.keyInsights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1">Topics</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.topics.map((topic, i) => (
              <Badge key={i} variant="outline">{topic}</Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1">Target Audience</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.targetAudience.map((audience, i) => (
              <Badge key={i} variant="secondary">{audience}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleAnalyze} size="sm">
          <Brain className="mr-2 h-3 w-3" />
          Re-analyze
        </Button>
      </CardFooter>
    </Card>
  );
}