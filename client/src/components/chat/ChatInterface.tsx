import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useChatbot, MessageType } from '@/context/ChatbotContext';
import TypingIndicator from '@/components/chat/TypingIndicator';

export function ChatMessage({ message }: { message: MessageType }) {
  const isUser = message.role === 'user';
  const isThinking = message.role === 'thinking';
  
  if (isThinking) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-lg p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
          <TypingIndicator />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser 
            ? 'bg-primary text-white' 
            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs font-medium mb-1">Sources:</p>
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

export function SuggestionChips({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) {
  const suggestions = [
    "What grants are available for emerging artists?",
    "How do I write a compelling artist statement?",
    "What's the difference between project and operational grants?",
    "Tips for creating a music project budget",
    "How to find grants for touring musicians"
  ];
  
  return (
    <div className="flex flex-wrap gap-2 my-4 px-4">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onSuggestionClick(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}

export default function ChatInterface() {
  const { messages, isLoading, sendMessage, clearMessages } = useChatbot();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
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
  };
  
  return (
    <div className="flex flex-col h-[600px]">
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
            <SuggestionChips onSuggestionClick={handleSuggestionClick} />
          </>
        )}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Type your message here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearMessages}
              title="Clear conversation"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}