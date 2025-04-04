import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Zap,
  Send, 
  Sparkles, 
  Copy, 
  RefreshCw, 
  FileText, 
  Clipboard,
  MessageSquare,
  Loader
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
// Template feature removed - considered useless
import { Grant, Artist } from '@shared/schema';
import ChatInterface from '@/components/chat/ChatInterface';
import ProfileSelector from '@/components/chat/ProfileSelector';
import { useChatbot, GrantProfileType } from '@/context/ChatbotContext';

export default function AIAssistant() {
  const [location] = useLocation();
  // Parse search params manually
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialTab = searchParams.get('action') === 'ask-question' ? 'questions' : 'proposals';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Proposal generation states
  const [proposalType, setProposalType] = useState('project');
  const [selectedGrant, setSelectedGrant] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalResult, setProposalResult] = useState('');
  // Using Deepseek as the default AI provider
  const aiProvider = 'deepseek';
  
  // Question & Answer states
  const [question, setQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  // Templates state - feature removed
  // const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // History state
  const [savedItems, setSavedItems] = useState<Array<{id: string, type: string, title: string, content: string, date: Date}>>([]);
  
  // Fetch data
  const { data: grantsData } = useQuery({
    queryKey: ['/api/grants'],
  });
  
  // Extract grants array safely
  const grants = Array.isArray(grantsData) 
    ? grantsData 
    : (grantsData && typeof grantsData === 'object' && 'grants' in grantsData && Array.isArray((grantsData as any).grants)) 
      ? (grantsData as any).grants 
      : [];
  
  const { data: artistsData } = useQuery({
    queryKey: ['/api/artists'],
  });
  
  // Extract artists array safely
  const artists = Array.isArray(artistsData) ? artistsData : [];
  
  // Templates feature removed - considered useless
  /*
  const { data: templatesData } = useQuery({
    queryKey: ['/api/templates'],
  });
  
  // Extract templates array safely
  const templates = Array.isArray(templatesData) ? templatesData : [];
  */
  const templates: any[] = []; // Empty array since templates feature is removed
  
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of conversation
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle proposal generation
  const handleGenerateProposal = async () => {
    if (!projectDescription) {
      toast({
        title: "Project description required",
        description: "Please enter a project description to generate a proposal",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGeneratingProposal(true);
      
      const selectedGrantObj = grants?.find((g: any) => g.id === parseInt(selectedGrant));
      const selectedArtistObj = artists?.find((a: any) => a.id === parseInt(selectedArtist));
      
      // Use the Deepseek endpoint for proposal generation
      const endpoint = '/api/ai/generate-proposal';
      
      // Call the selected AI API with the user profile included for context
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectDescription,
          grantName: selectedGrantObj?.name,
          artistName: selectedArtistObj?.name,
          projectTitle: proposalType === 'project' ? `Music ${proposalType} Proposal` : `${proposalType.charAt(0).toUpperCase() + proposalType.slice(1)} for Music Grant`,
          proposalType,
          artistBio: selectedArtistObj?.bio,
          artistGenre: selectedArtistObj?.genre,
          grantOrganization: selectedGrantObj?.organization,
          grantRequirements: selectedGrantObj?.requirements,
          userProfile: userProfile // Include userProfile for context-aware proposals
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate proposal with Deepseek`);
      }
      
      const data = await response.json();
      setProposalResult(data.proposal);
      
      // Add to saved items
      const newSavedItem = {
        id: Date.now().toString(),
        type: 'proposal',
        title: `Proposal: ${projectDescription.substring(0, 30)}...`,
        content: data.proposal,
        date: new Date()
      };
      
      setSavedItems(prev => [newSavedItem, ...prev]);
      
      toast({
        title: "Proposal generated",
        description: "Your proposal has been successfully generated",
      });
      
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast({
        title: "Failed to generate proposal",
        description: "There was an error generating your proposal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingProposal(false);
    }
  };
  
  // Access useChatbot to get the userProfile
  const { userProfile } = useChatbot();
  
  // Handle asking a question
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a question to ask the AI assistant",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAskingQuestion(true);
      
      // Add user question to history
      const newQuestion = { role: 'user' as const, content: question };
      setConversationHistory(prev => [...prev, newQuestion]);
      
      // Call the AI API with the userProfile for context
      const response = await fetch('/api/ai/answer-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          conversationHistory,
          userProfile: userProfile // Include user profile for context-aware answers
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      const data = await response.json();
      
      // Add AI response to history
      const aiResponse = { role: 'assistant' as const, content: data.answer };
      setConversationHistory(prev => [...prev, aiResponse]);
      
      // Clear question input
      setQuestion('');
      
      // Scroll to bottom after response
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
    } catch (error) {
      console.error('Error getting answer:', error);
      toast({
        title: "Failed to get answer",
        description: "There was an error processing your question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAskingQuestion(false);
    }
  };
  
  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The content has been copied to your clipboard",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "There was an error copying to clipboard",
        variant: "destructive"
      });
    });
  };
  
  // Handle template selection - feature removed
  /*
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    const template = templates?.find((t: any) => t.id === parseInt(value));
    if (template) {
      setProjectDescription(template.content);
    }
  };
  */
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            AI Assistant
            <Badge variant="accent" className="ml-3">New</Badge>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Get AI-powered help with writing proposals, answering questions about grants, and more
          </p>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="proposals" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span>Proposals</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Questions</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <Clipboard className="h-4 w-4 mr-2" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Proposal Generation Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate a Grant Proposal</CardTitle>
              <CardDescription>
                Our AI will help you craft a professional grant proposal based on your inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proposalType">Proposal Type</Label>
                <Select value={proposalType} onValueChange={setProposalType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select proposal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="project">Project Proposal</SelectItem>
                      <SelectItem value="artistic">Artistic Statement</SelectItem>
                      <SelectItem value="budget">Budget Justification</SelectItem>
                      <SelectItem value="impact">Impact Statement</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              

              <div className="space-y-2">
                <Label htmlFor="grantSelect">Grant (Optional)</Label>
                <Select value={selectedGrant} onValueChange={setSelectedGrant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a grant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific grant</SelectItem>
                    {grants?.map((grant: any) => (
                      <SelectItem key={grant.id} value={grant.id.toString()}>
                        {grant.name} - {grant.organization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="artistSelect">Artist (Optional)</Label>
                <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an artist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific artist</SelectItem>
                    {artists?.map((artist: any) => (
                      <SelectItem key={artist.id} value={artist.id.toString()}>
                        {artist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Templates feature removed - considered useless
              <div className="space-y-2">
                <Label htmlFor="templateSelect">Start from Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates?.filter((t: any) => t.type === 'proposal')?.map((template: any) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              */}
              
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Describe your project or what you need help with..."
                  className="min-h-[150px]"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setProjectDescription('')}>
                Clear
              </Button>
              <Button 
                onClick={handleGenerateProposal} 
                disabled={generatingProposal || !projectDescription.trim()}
                className="gap-2"
              >
                {generatingProposal ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate Proposal
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {proposalResult && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Generated Proposal</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(proposalResult)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleGenerateProposal}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md whitespace-pre-wrap font-mono text-sm border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto">
                  {proposalResult}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {/* Templates feature removed - considered useless 
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={async () => {
                    try {
                      // Save as template logic
                      const templateName = `${proposalType.charAt(0).toUpperCase() + proposalType.slice(1)} - ${new Date().toLocaleDateString()}`;
                      
                      const response = await fetch('/api/templates', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          name: templateName,
                          description: projectDescription.substring(0, 100) + (projectDescription.length > 100 ? '...' : ''),
                          content: proposalResult,
                          type: 'proposal'
                        }),
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to save template');
                      }
                      
                      // Create activity for saving template
                      await fetch('/api/activities', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          userId: 1, // Default user
                          action: 'CREATED',
                          entityType: 'TEMPLATE',
                          details: {
                            templateName,
                            type: 'proposal'
                          }
                        }),
                      });
                      
                      // Invalidate templates cache
                      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
                      
                      toast({
                        title: "Saved as template",
                        description: "This proposal has been saved as a template"
                      });
                    } catch (error) {
                      console.error('Error saving template:', error);
                      toast({
                        title: "Failed to save template",
                        description: "There was an error saving your template. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Save as Template
                </Button>
                */}
                
                {selectedGrant && selectedGrant !== 'none' && selectedArtist && selectedArtist !== 'none' && (
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={async () => {
                      try {
                        // Create a new application using the proposal
                        const response = await fetch('/api/applications', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            grantId: parseInt(selectedGrant),
                            artistId: parseInt(selectedArtist),
                            status: 'draft',
                            progress: 30, // Start with some progress since we have a proposal
                            answers: {
                              proposal: proposalResult,
                              projectDescription: projectDescription
                            }
                          }),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to create application');
                        }
                        
                        const application = await response.json();
                        
                        // Create activity for new application
                        await fetch('/api/activities', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            userId: 1, // Default user
                            action: 'CREATED',
                            entityType: 'APPLICATION',
                            entityId: application.id,
                            details: {
                              grantId: parseInt(selectedGrant),
                              artistId: parseInt(selectedArtist)
                            }
                          }),
                        });
                        
                        // Invalidate applications cache
                        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
                        
                        toast({
                          title: "Application created",
                          description: "A draft application has been created with this proposal"
                        });
                        
                      } catch (error) {
                        console.error('Error creating application:', error);
                        toast({
                          title: "Failed to create application",
                          description: "There was an error creating your application. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Application
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ask a Question</CardTitle>
                  <CardDescription>
                    Get answers about grant writing, music industry opportunities, applications, and more
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ChatInterface />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-1">
              <ProfileSelector />
            </div>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Your History</CardTitle>
              <CardDescription>
                Previously generated proposals and answered questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedItems.length > 0 ? (
                <div className="space-y-3">
                  {savedItems.map((item: any) => (
                    <Card key={item.id} className="shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {item.date.toLocaleDateString()} · {item.date.toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge variant={item.type === 'proposal' ? 'default' : 'secondary'}>
                            {item.type === 'proposal' ? 'Proposal' : 'Question'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="p-4 pt-2 flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(item.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (item.type === 'proposal') {
                              setActiveTab('proposals');
                              setProposalResult(item.content);
                            }
                          }}
                        >
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Clipboard className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No history yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Generate proposals or ask questions to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
