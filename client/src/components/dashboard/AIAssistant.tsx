import { Button } from '@/components/ui/button';
import { Zap, HelpCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/use-onboarding';

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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">
        Get AI-powered assistance with your grant applications
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleGenerateProposal}
          className="flex items-center justify-center gap-1.5 flex-1"
          size="sm"
        >
          <Zap className="h-4 w-4" />
          <span>Generate Proposal</span>
        </Button>
        
        <Button
          onClick={handleAskQuestion}
          variant="outline"
          className="flex items-center justify-center gap-1.5 flex-1"
          size="sm"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Ask a Question</span>
        </Button>
      </div>
    </div>
  );
}