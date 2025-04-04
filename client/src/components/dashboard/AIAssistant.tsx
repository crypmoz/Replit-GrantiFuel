import { Button } from '@/components/ui/button';
import { Zap, HelpCircle, FileText, PencilRuler } from 'lucide-react';
import { useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Card } from '@/components/ui/card';

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

  // Define the AI assistant features that align with our application flow
  const aiFeatures = [
    {
      icon: <FileText className="h-10 w-10 text-primary/70" />,
      title: "Grant Proposals",
      description: "Generate professional proposals based on your profile",
      action: handleGenerateProposal,
      actionText: "Write Proposal"
    },
    {
      icon: <HelpCircle className="h-10 w-10 text-primary/70" />,
      title: "Questions & Answers",
      description: "Get answers to your grant-related questions",
      action: handleAskQuestion,
      actionText: "Ask Question"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {aiFeatures.map((feature, index) => (
          <Card key={index} className="p-4 border border-muted hover:border-primary/20 transition-colors">
            <div className="flex flex-col h-full">
              <div className="flex items-start mb-3">
                <div className="mr-3">{feature.icon}</div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <Button 
                  onClick={feature.action}
                  variant={index === 0 ? "default" : "outline"}
                  className="w-full"
                  size="sm"
                >
                  {feature.actionText}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}