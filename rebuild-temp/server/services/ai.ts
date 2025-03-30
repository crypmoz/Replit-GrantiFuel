import axios from 'axios';
import { logger } from '../middleware/logger';
import env from '../config/env';

// Interface for request to Deepseek
interface DeepseekRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

// Interface for response from Deepseek
interface DeepseekResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error handling wrapper
export class AIError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AIError';
    this.statusCode = statusCode;
  }
}

// AI Service class
export class AIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;
  
  constructor() {
    this.apiKey = env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.model = 'deepseek-chat';
    this.timeoutMs = 60000; // 60 second timeout
    
    if (!this.apiKey) {
      logger.warn('DEEPSEEK_API_KEY not set. AI functionality will be limited.');
    }
  }
  
  async generateProposal(projectDescription: string, grantName?: string, artistName?: string): Promise<string> {
    if (!this.apiKey) {
      throw new AIError('AI service is not available. Please configure DEEPSEEK_API_KEY.', 503);
    }
    
    try {
      const promptContent = this.buildProposalPrompt(projectDescription, grantName, artistName);
      
      const request: DeepseekRequest = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert grant proposal writer for musicians and artists. Your responses should be well-structured, persuasive, and specific to the music industry. Format your responses using markdown with clear sections.'
          },
          {
            role: 'user',
            content: promptContent
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      };
      
      const response = await this.makeRequest(request);
      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Error generating proposal:', error);
      if (error instanceof AIError) {
        throw error;
      }
      throw new AIError('Failed to generate proposal. Please try again later.', 500);
    }
  }
  
  async answerQuestion(question: string, conversationHistory: any[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new AIError('AI service is not available. Please configure DEEPSEEK_API_KEY.', 503);
    }
    
    try {
      // Format conversation history for API
      const messages = [
        {
          role: 'system',
          content: 'You are an experienced music grant consultant providing helpful, accurate information about grants, applications, and the music industry. Provide specific details when possible and always be encouraging. Format your responses using markdown for readability.'
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: question
        }
      ];
      
      const request: DeepseekRequest = {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1500
      };
      
      const response = await this.makeRequest(request);
      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Error answering question:', error);
      if (error instanceof AIError) {
        throw error;
      }
      throw new AIError('Failed to answer your question. Please try again later.', 500);
    }
  }
  
  private async makeRequest(request: DeepseekRequest): Promise<DeepseekResponse> {
    try {
      const response = await axios.post<DeepseekResponse>(
        `${this.baseUrl}/chat/completions`, 
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: this.timeoutMs
        }
      );
      
      return response.data;
    } catch (error: any) {
      logger.error('Deepseek API request failed:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new AIError('Authentication failed. Please check your Deepseek API key.', 401);
        } else if (status === 429) {
          throw new AIError('Rate limit exceeded. Please try again later.', 429);
        } else if (status >= 500) {
          throw new AIError('Deepseek service unavailable. Please try again later.', 503);
        } else {
          throw new AIError(`API error: ${data?.error?.message || 'Unknown error'}`, status);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new AIError('Request timed out. The operation took too long to complete.', 504);
      }
      
      throw new AIError('Failed to communicate with AI service. Please try again later.', 500);
    }
  }
  
  private buildProposalPrompt(projectDescription: string, grantName?: string, artistName?: string): string {
    let prompt = `Write a compelling music grant proposal based on the following project description:\n\n${projectDescription}\n\n`;
    
    if (grantName) {
      prompt += `This proposal is for the "${grantName}" grant. `;
    }
    
    if (artistName) {
      prompt += `The artist name is ${artistName}. `;
    }
    
    prompt += `\nPlease structure the proposal with the following sections:
1. Project Summary (brief overview)
2. Artist Background (relevant experience and qualifications)
3. Project Description (detailed explanation of the project)
4. Timeline and Milestones
5. Budget Breakdown
6. Expected Impact and Outcomes
7. Conclusion

Format the response using markdown with clear headings and bullet points where appropriate.`;
    
    return prompt;
  }
}

// Export singleton instance
export const aiService = new AIService();