import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, HelpCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function AIAssistant() {
  const [location, navigate] = useLocation();

  const handleGenerateProposal = () => {
    navigate('/ai-assistant?action=generate-proposal');
  };

  const handleAskQuestion = () => {
    navigate('/ai-assistant?action=ask-question');
  };

  return (
    <Card className="mt-6">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">AI Assistant</h3>
        <Badge variant="accent" className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
          New
        </Badge>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Get help with writing proposals, answering questions, and more.
        </p>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleGenerateProposal}
            size="sm"
            className="inline-flex items-center"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Proposal
          </Button>
          <Button 
            onClick={handleAskQuestion}
            variant="outline"
            size="sm"
            className="inline-flex items-center"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Ask a Question
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}