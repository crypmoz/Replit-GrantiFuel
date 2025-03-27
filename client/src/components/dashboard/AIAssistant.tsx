import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, HelpCircle, MessageSquareText, FileText } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useEffect } from 'react';

export default function AIAssistant() {
  const [location, navigate] = useLocation();
  const { completeTask, hasCompletedTask } = useOnboarding();

  // Define safe function to mark AI assistant used
  const safeMarkAiAssistantUsed = () => {
    try {
      if (!hasCompletedTask("ai_assistant_used")) {
        completeTask("ai_assistant_used", { timestamp: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Error marking AI assistant as used:", error);
    }
  };

  const handleGenerateProposal = () => {
    safeMarkAiAssistantUsed();
    navigate('/ai-assistant?action=generate-proposal');
  };

  const handleAskQuestion = () => {
    safeMarkAiAssistantUsed();
    navigate('/ai-assistant?action=ask-question');
  };

  return (
    <div className="space-y-4">
      {/* Introduction Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-start space-x-3">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Grantaroo AI</h3>
              <Badge variant="secondary" className="ml-2 font-medium text-xs">
                Powered by Deepseek
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your personal grant writing assistant. Get expert help with proposals, applications, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleGenerateProposal}
          variant="outline"
          className="h-auto py-4 px-3 flex flex-col items-center justify-center border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
        >
          <Zap className="h-8 w-8 mb-2 text-primary" />
          <span className="text-sm font-medium">Generate Proposal</span>
        </Button>
        
        <Button
          onClick={handleAskQuestion}
          variant="outline"
          className="h-auto py-4 px-3 flex flex-col items-center justify-center border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
        >
          <HelpCircle className="h-8 w-8 mb-2 text-primary" />
          <span className="text-sm font-medium">Ask a Question</span>
        </Button>
      </div>

      {/* Tips Section */}
      <div className="bg-muted rounded-lg p-3">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <FileText className="h-4 w-4 mr-1.5 text-muted-foreground" />
          AI Writing Tips
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Be specific about your artistic background and goals</li>
          <li>Include details about your project timeline and budget needs</li>
          <li>Mention any past grants or notable achievements</li>
        </ul>
      </div>
    </div>
  );
}