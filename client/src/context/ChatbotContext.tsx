import { createContext, useContext, useState, ReactNode } from 'react';

// ChatbotContext types
export type MessageType = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thinking';
  content: string;
  timestamp: Date;
  sources?: any[];
};

export type GrantProfileType = {
  careerStage: string;
  genre: string;
  instrumentOrRole: string;
};

type ChatbotContextType = {
  messages: MessageType[];
  isLoading: boolean;
  userProfile: GrantProfileType | null;
  setUserProfile: (profile: GrantProfileType | null) => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
};

// Create context with default values
const ChatbotContext = createContext<ChatbotContextType>({
  messages: [],
  isLoading: false,
  userProfile: null,
  setUserProfile: () => {},
  sendMessage: async () => {},
  clearMessages: () => {},
});

// Helper function to generate UUID for messages
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Provider component
export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<GrantProfileType | null>(null);

  // Send message to the AI assistant
  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    // Add user message
    const userMessage: MessageType = {
      id: generateId(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Show thinking indicator
    const thinkingId = generateId();
    setMessages(prev => [
      ...prev, 
      { 
        id: thinkingId, 
        role: 'thinking', 
        content: 'Thinking...', 
        timestamp: new Date() 
      }
    ]);
    setIsLoading(true);

    try {
      // Extract only the conversation history (user and assistant messages)
      const conversationHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({ role: msg.role, content: msg.content }));

      // Call API with user profile for context-aware responses
      const response = await fetch('/api/ai/answer-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: messageContent,
          conversationHistory,
          userProfile, // Include the user profile for context awareness
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      
      // Remove thinking message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== thinkingId);
        return [
          ...filtered, 
          {
            id: generateId(),
            role: 'assistant',
            content: data.answer,
            timestamp: new Date(),
          }
        ];
      });
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Remove thinking message and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== thinkingId);
        return [
          ...filtered, 
          {
            id: generateId(),
            role: 'assistant',
            content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date(),
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatbotContext.Provider
      value={{
        messages,
        isLoading,
        userProfile,
        setUserProfile,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

// Hook for using the chatbot context
export const useChatbot = () => useContext(ChatbotContext);