import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, Copy, Info, InfoIcon, BookOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useChatbot, MessageType } from '@/context/ChatbotContext';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ReactMarkdown from 'react-markdown';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export function ChatMessage({ message }: { message: MessageType }) {
  const { toast } = useToast();
  const isUser = message.role === 'user';
  const isThinking = message.role === 'thinking';
  const isSystem = message.role === 'system';
  
  // Handle copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The message has been copied to your clipboard",
        duration: 2000,
      });
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy the message to clipboard",
        variant: "destructive",
      });
    });
  }, [toast]);
  
  if (isThinking) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-lg p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
          <TypingIndicator />
        </div>
      </div>
    );
  }
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <Badge variant="outline" className="bg-muted/50">
          <InfoIcon className="h-3 w-3 mr-1" />
          <span className="text-xs text-muted-foreground">{message.content}</span>
        </Badge>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div 
        className={`max-w-[80%] rounded-lg p-3 relative ${
          isUser 
            ? 'bg-primary text-white' 
            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
        }`}
      >
        {!isUser && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={() => copyToClipboard(message.content)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {isUser ? (
          <div className="flex items-start">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center text-xs font-medium mb-1">
              <BookOpen className="h-3 w-3 mr-1 text-gray-500" />
              <span>Sources:</span>
            </div>
            <ul className="text-xs space-y-1">
              {message.sources.map((source, index) => (
                <li key={index}>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Ask me anything about music grants
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          I can help with application strategies, deadlines, requirements, and more
        </p>
      </div>
    </div>
  );
}

export function SuggestionChips({ 
  onSuggestionClick, 
  customSuggestions 
}: { 
  onSuggestionClick: (suggestion: string) => void;
  customSuggestions?: string[];
}) {
  const defaultSuggestions = [
    "What grants are available for emerging artists?",
    "How do I write a compelling artist statement?",
    "What's the difference between project and operational grants?",
    "Tips for creating a music project budget",
    "How to find grants for touring musicians"
  ];
  
  const suggestions = customSuggestions || defaultSuggestions;
  
  return (
    <div className="flex flex-wrap gap-2 my-4 px-4">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs hover:bg-primary/10 transition-colors"
          onClick={() => onSuggestionClick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}

export function ContextMenu({ onExport }: { onExport: () => void }) {
  return (
    <div className="flex justify-end px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-1" />
              <span className="text-xs">Export Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save this conversation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default function ChatInterface() {
  const { messages, isLoading, userProfile, sendMessage, clearMessages } = useChatbot();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Add debounce to handle fast typing
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // User is typing
    setIsTyping(true);
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Send the message
    await sendMessage(inputValue);
    
    // Clear the input
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && inputValue.trim()) {
        handleSendMessage();
      }
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Focus the input field after clicking a suggestion
    const inputElement = document.querySelector('input[type="text"]');
    if (inputElement instanceof HTMLInputElement) {
      inputElement.focus();
    }
  };
  
  // Export conversation as a text file
  const exportConversation = useCallback(() => {
    if (messages.length === 0) {
      toast({
        title: "No conversation to export",
        description: "Start a conversation before exporting",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Format the conversation for export
      const conversationText = messages
        .filter(msg => msg.role !== 'thinking' && msg.role !== 'system')
        .map(msg => {
          const role = msg.role === 'user' ? 'You' : 'AI Assistant';
          return `${role}: ${msg.content}\n\n`;
        })
        .join('');
      
      // Create a blob and download link
      const blob = new Blob([conversationText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grant-assistant-conversation-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Conversation exported",
        description: "The conversation has been saved as a text file",
      });
    } catch (error) {
      console.error('Error exporting conversation:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the conversation",
        variant: "destructive",
      });
    }
  }, [messages, toast]);
  
  // Display context-aware UI elements based on user profile and conversation
  const showContextAwareSuggestions = useCallback(() => {
    // If user has a profile, show more personalized suggestions
    if (userProfile && messages.length === 0) {
      const genreSpecificSuggestions = [];
      
      if (userProfile.genre) {
        genreSpecificSuggestions.push(`What grants are available for ${userProfile.genre} musicians?`);
      }
      
      if (userProfile.careerStage) {
        genreSpecificSuggestions.push(`Grant opportunities for ${userProfile.careerStage} musicians`);
      }
      
      return genreSpecificSuggestions.length > 0
        ? genreSpecificSuggestions
        : undefined; // Fall back to default suggestions
    }
    
    return undefined;
  }, [userProfile, messages.length]);
  
  const customSuggestions = showContextAwareSuggestions();
  
  return (
    <div className="flex flex-col h-[600px] border rounded-lg shadow-sm bg-white dark:bg-gray-900" ref={chatContainerRef}>
      {messages.length > 0 && <ContextMenu onExport={exportConversation} />}
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <>
            <EmptyState />
            <SuggestionChips 
              onSuggestionClick={handleSuggestionClick} 
              customSuggestions={customSuggestions}
            />
          </>
        )}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Type your message here..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearMessages}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {userProfile && (
          <div className="mt-2 flex items-center">
            <InfoIcon className="h-3 w-3 text-muted-foreground mr-1" />
            <p className="text-xs text-muted-foreground">
              Responding based on your {userProfile.genre} {userProfile.careerStage} artist profile
            </p>
          </div>
        )}
      </div>
    </div>
  );
}