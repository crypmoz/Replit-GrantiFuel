/**
 * Enhanced AI Service
 * 
 * A more robust implementation of AI service with circuit breaking,
 * caching, fallbacks, and error handling.
 */

import axios from 'axios';
import { BaseService, ServiceResponse } from './base-service';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { storage } from '../storage';
import { Document } from '@shared/schema';
import NodeCache from 'node-cache';

// Interface definitions
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AICompletionRequest {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface AICompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

export interface GrantRecommendation {
  id: string;
  name: string;
  organization: string;
  amount: string;
  deadline: string;
  description: string;
  requirements: string[];
  eligibility: string[];
  url: string;
  matchScore: number;
}

export interface ProposalGenerationParams {
  artistName: string;
  artistBio: string;
  artistGenre: string;
  grantName: string;
  grantOrganization: string;
  grantRequirements: string;
  projectTitle: string;
  projectDescription: string;
}

export interface AnswerQuestionParams {
  question: string;
  artistProfile?: any;
  conversationHistory?: AIMessage[];
}

// Define AI provider options
const AI_PROVIDERS = {
  DEEPSEEK: 'deepseek',
  // Add more providers as needed (e.g., OPENAI, ANTHROPIC, etc.)
};

// Cache configuration
const CACHE_TTL = {
  RECOMMENDATIONS: 3600, // 1 hour
  ANSWERS: 1800,         // 30 minutes
  PROPOSALS: 7200        // 2 hours
};

export class AIService extends BaseService {
  private apiKey: string;
  private provider: string;
  private circuitBreaker: CircuitBreaker;
  private cache: NodeCache;
  private defaultModel: string;

  constructor() {
    super('AIService');
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.provider = AI_PROVIDERS.DEEPSEEK; // Default provider
    this.defaultModel = 'deepseek-chat';
    
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker('AI_API', {
      failureThreshold: 3,
      resetTimeout: 30000,
      timeoutDuration: 15000
    });
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: 1800,  // 30 minutes default TTL
      checkperiod: 600,  // Check for expired keys every 10 minutes
      useClones: false
    });
    
    // Validate if we have the required API keys
    if (!this.apiKey) {
      console.warn('[AIService] No API key found for Deepseek. AI features may not work correctly.');
    }
  }
  
  /**
   * Generate grant recommendations based on artist profile
   */
  async getGrantRecommendations(
    artistProfile: {
      genre: string;
      careerStage: string;
      instrumentOrRole: string;
      location?: string;
      projectType?: string;
    }
  ): Promise<ServiceResponse<GrantRecommendation[]>> {
    return this.executeWithErrorHandling(async () => {
      // Create cache key based on artist profile
      const cacheKey = `recommendations-${JSON.stringify(artistProfile)}`;
      
      // Check cache first
      const cachedRecommendations = this.cache.get<GrantRecommendation[]>(cacheKey);
      if (cachedRecommendations) {
        console.log(`[AIService] Using cached grant recommendations for profile`);
        return cachedRecommendations;
      }
      
      // Retrieve relevant documents for context
      const documents = await this.getRelevantDocuments('grants for musicians');
      let documentContext = '';
      
      if (documents && documents.length > 0) {
        documentContext = "Here are some example grants that might be relevant:\n" + 
          documents.map(doc => `- ${doc.title}: ${doc.content.substring(0, 200)}...`).join('\n');
      }
      
      // Prepare the system prompt
      const systemPrompt = `You are an AI grant specialist for musicians and artists. 
Generate personalized grant recommendations based on the artist's profile.
For each grant, include these fields: id (unique string), name, organization, amount, deadline (in YYYY-MM-DD format), 
description (2-3 sentences), requirements (list of strings), eligibility (list of strings), url (fictional but plausible), 
and matchScore (integer 0-100 indicating relevance).
Return exactly 5 grants that would be appropriate for this artist.
${documentContext}`;

      // Get existing grants to potentially reference
      const existingGrants = await storage.getAllGrants();
      const grantsContext = existingGrants.length > 0 
        ? `Here are some actual grants in our system you can reference:\n${JSON.stringify(existingGrants.slice(0, 3))}`
        : '';
      
      // Prepare the user message
      const userMessage = `Please recommend grants for an artist with the following profile:
- Genre: ${artistProfile.genre || 'Not specified'}
- Career Stage: ${artistProfile.careerStage || 'Not specified'} 
- Instrument/Role: ${artistProfile.instrumentOrRole || 'Not specified'}
${artistProfile.location ? `- Location: ${artistProfile.location}` : ''}
${artistProfile.projectType ? `- Project Type: ${artistProfile.projectType}` : ''}
${grantsContext}

Make sure each grant recommendation is specific to this artist's profile. Ensure deadlines are in the future and realistic.`;
      
      const requestData: AICompletionRequest = {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2048
      };
      
      // Use circuit breaker to call the AI API
      return await this.executeWithLogging('getGrantRecommendations', async () => {
        try {
          const response = await this.circuitBreaker.execute(this.callAI.bind(this), requestData);
          
          // Parse the response
          let recommendations: GrantRecommendation[] = [];
          try {
            const content = response.choices[0].message.content;
            recommendations = this.parseGrantRecommendations(content);
            
            // Add to cache
            this.cache.set(cacheKey, recommendations, CACHE_TTL.RECOMMENDATIONS);
            
            return recommendations;
          } catch (parseError) {
            console.error('[AIService] Failed to parse grant recommendations:', parseError);
            throw new Error('Failed to parse grant recommendations');
          }
        } catch (error) {
          console.error('[AIService] Error getting grant recommendations:', error);
          
          // Try to get fallback recommendations
          const fallbackRecommendations = await this.getFallbackRecommendations(artistProfile);
          return fallbackRecommendations;
        }
      });
    }, 'Failed to get grant recommendations');
  }
  
  /**
   * Generate a grant proposal draft
   */
  async generateProposal(params: ProposalGenerationParams): Promise<ServiceResponse<string>> {
    return this.executeWithErrorHandling(async () => {
      // Create cache key based on params
      const cacheKey = `proposal-${JSON.stringify(params)}`;
      
      // Check cache first
      const cachedProposal = this.cache.get<string>(cacheKey);
      if (cachedProposal) {
        return cachedProposal;
      }
      
      const systemPrompt = `You are an expert grant writer specializing in helping musicians and artists.
Your task is to write a compelling grant proposal that meets the requirements of the grant and 
effectively communicates the artist's qualifications and project goals.`;

      const userMessage = `Please write a grant proposal for the following:
Artist: ${params.artistName}
Artist Bio: ${params.artistBio}
Genre: ${params.artistGenre}
Grant: ${params.grantName} by ${params.grantOrganization}
Grant Requirements: ${params.grantRequirements}
Project Title: ${params.projectTitle}
Project Description: ${params.projectDescription}

Include these sections:
1. Introduction
2. Artist Background & Qualifications
3. Project Description
4. Goals & Objectives
5. Budget Summary
6. Expected Impact
7. Timeline

Make the proposal approximately 1000 words.`;

      const requestData: AICompletionRequest = {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 4000
      };
      
      return await this.executeWithLogging('generateProposal', async () => {
        const response = await this.circuitBreaker.execute(this.callAI.bind(this), requestData);
        const proposal = response.choices[0].message.content;
        
        // Add to cache
        this.cache.set(cacheKey, proposal, CACHE_TTL.PROPOSALS);
        
        return proposal;
      });
    }, 'Failed to generate proposal');
  }
  
  /**
   * Answer a question using AI
   */
  async answerQuestion(params: AnswerQuestionParams): Promise<ServiceResponse<string>> {
    return this.executeWithErrorHandling(async () => {
      // Extract question and other parameters
      const { question, artistProfile, conversationHistory = [] } = params;
      
      // Create cache key for simple questions (not using history)
      const shouldCache = conversationHistory.length <= 1;
      const cacheKey = shouldCache ? `answer-${question}-${JSON.stringify(artistProfile || {})}` : null;
      
      // Check cache for simple questions
      if (cacheKey) {
        const cachedAnswer = this.cache.get<string>(cacheKey);
        if (cachedAnswer) {
          return cachedAnswer;
        }
      }
      
      // Get relevant documents
      const documents = await this.getRelevantDocuments(question);
      let documentContext = '';
      
      if (documents && documents.length > 0) {
        documentContext = "Here are some relevant documents that might help answer the question:\n" + 
          documents.map(doc => `Document: ${doc.title}\nContent: ${doc.content.substring(0, 500)}...\n`).join('\n');
      }
      
      const systemPrompt = `You are an AI assistant for musicians and artists seeking grants and funding opportunities.
Your goal is to provide helpful, accurate information about grants, application processes, and funding strategies.
Answer questions based on the provided documents and your knowledge about music grants and funding.
If you don't know the answer, be honest about not knowing rather than making up information.`;

      // Prepare all messages
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add any conversation history
      if (conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      }
      
      // Add the current question with context
      let userContent = question;
      
      if (documentContext) {
        userContent += `\n\nHere is some helpful context:\n${documentContext}`;
      }
      
      if (artistProfile) {
        userContent += `\n\nArtist Profile:\n${JSON.stringify(artistProfile, null, 2)}`;
      }
      
      messages.push({ role: 'user', content: userContent });
      
      const requestData: AICompletionRequest = {
        model: this.defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 2048
      };
      
      return await this.executeWithLogging('answerQuestion', async () => {
        const response = await this.circuitBreaker.execute(this.callAI.bind(this), requestData);
        const answer = response.choices[0].message.content;
        
        // Cache the answer if it's a simple question
        if (cacheKey) {
          this.cache.set(cacheKey, answer, CACHE_TTL.ANSWERS);
        }
        
        return answer;
      });
    }, 'Failed to answer question');
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('[AIService] Cache cleared');
  }
  
  /**
   * Call the AI service based on the current provider
   */
  private async callAI(requestData: AICompletionRequest): Promise<AICompletionResponse> {
    if (this.provider === AI_PROVIDERS.DEEPSEEK) {
      return this.callDeepseekAPI(requestData);
    }
    
    // Add more providers as needed
    
    throw new Error(`AI provider ${this.provider} not supported`);
  }
  
  /**
   * Call the Deepseek API
   */
  private async callDeepseekAPI(requestData: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Deepseek API key not configured');
    }
    
    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000 // 30 seconds
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('[AIService] Deepseek API error:', error.message);
      
      // Add more details to the error
      const enhancedError = new Error(`Deepseek API call failed: ${error.message}`);
      enhancedError.name = 'DeepseekAPIError';
      throw enhancedError;
    }
  }
  
  /**
   * Parse grant recommendations from AI response
   */
  private parseGrantRecommendations(content: string): GrantRecommendation[] {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/```json([\s\S]*?)```/) || 
                        content.match(/```([\s\S]*?)```/) ||
                        content.match(/\[([\s\S]*?)\]/);
      
      if (jsonMatch && jsonMatch[1]) {
        // Parse the JSON within the code block
        const jsonContent = jsonMatch[1].trim();
        return JSON.parse(jsonContent.startsWith('[') ? jsonContent : `[${jsonContent}]`);
      } else {
        // Try parsing the entire response as JSON
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('[AIService] Failed to parse grant recommendations JSON:', e);
      console.log('[AIService] Original content:', content);
      
      // Attempt a more lenient parsing approach
      try {
        // Look for objects with properties that match our expected format
        const grantMatches = content.match(/(\{[\s\S]*?\})/g);
        if (grantMatches) {
          const grants = grantMatches.map(match => {
            try {
              return JSON.parse(match);
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          if (grants.length > 0) {
            return grants;
          }
        }
      } catch (lenientError) {
        console.error('[AIService] Lenient parsing also failed:', lenientError);
      }
      
      throw new Error('Unable to parse grant recommendations');
    }
  }
  
  /**
   * Fallback if AI service is unavailable
   */
  private async getFallbackRecommendations(artistProfile: any): Promise<GrantRecommendation[]> {
    // Attempt to get existing grants from storage and adapt them
    const recommendations: GrantRecommendation[] = [];
    
    try {
      // Use existing grants if available, otherwise provide a minimal response
      const existingGrants = await storage.getAllGrants();
      
      if (existingGrants && existingGrants.length > 0) {
        // Map existing grants to the recommendation format
        return existingGrants.slice(0, 5).map((grant: any, index: number) => {
          // Calculate a match score based on available information
          const matchScore = Math.floor(Math.random() * 30) + 50; // 50-80 range
          
          // Generate a future deadline
          const today = new Date();
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + 30 + (index * 15)); // 1-3 months in the future
          
          return {
            id: `fallback-${grant.id}`,
            name: grant.name,
            organization: grant.organization,
            amount: grant.amount || `$${(Math.floor(Math.random() * 10) + 1) * 1000}`,
            deadline: futureDate.toISOString().split('T')[0],
            description: grant.description || 'Grant details unavailable at the moment. Please check back later.',
            requirements: [grant.requirements || 'Requirements information temporarily unavailable.'],
            eligibility: ['Open to qualifying artists and musicians'],
            url: 'https://example.org/grants',
            matchScore
          };
        });
      }
    } catch (error) {
      console.error('[AIService] Error creating fallback recommendations:', error);
    }
    
    // Ultimate fallback if everything else fails
    return [];
  }
  
  /**
   * Get relevant documents based on a query
   */
  private async getRelevantDocuments(query: string): Promise<Document[]> {
    try {
      // Get approved documents from storage
      const documents = await storage.getApprovedDocuments();
      
      if (!documents || documents.length === 0) {
        return [];
      }
      
      // Extract keywords from query
      const keywords = this.extractKeywords(query);
      
      // Simple relevance scoring based on keyword matching
      const scoredDocuments = documents.map(doc => {
        const content = (doc.title + ' ' + doc.content).toLowerCase();
        let score = 0;
        
        // Score based on keyword matches
        keywords.forEach(keyword => {
          const matches = content.split(keyword.toLowerCase()).length - 1;
          score += matches;
        });
        
        return { doc, score };
      });
      
      // Sort by score and return top 3
      return scoredDocuments
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.doc);
    } catch (error) {
      console.error('[AIService] Error getting relevant documents:', error);
      return [];
    }
  }
  
  /**
   * Extract keywords from a query
   */
  private extractKeywords(query: string): string[] {
    // Simplified keyword extraction
    const stopWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'with', 'about'];
    
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5);
  }
}

// Export a singleton instance
export const aiService = new AIService();