/**
 * DeepSeek AI Service
 * 
 * A service for interacting with DeepSeek's AI API
 */

import axios from 'axios';
import { BaseService, ServiceResponse } from './base-service';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { storage } from '../storage';
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

export interface ContentGenerationParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  max_tokens?: number;
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

export interface ProfileFeedbackParams {
  artistProfile: {
    name?: string;
    bio?: string;
    genre?: string;
    careerStage?: string;
    location?: string;
    primaryInstrument?: string;
    projectType?: string;
  };
}

// Cache configuration
const CACHE_TTL = {
  RECOMMENDATIONS: 3600, // 1 hour
  CONTENT: 1800,        // 30 minutes
  FEEDBACK: 1800,       // 30 minutes
};

export class DeepseekService extends BaseService {
  private apiKey: string;
  private circuitBreaker: CircuitBreaker;
  private cache: NodeCache;
  private model: string;

  constructor() {
    super('DeepseekService');
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('[DeepseekService] DEEPSEEK_API_KEY environment variable is not set');
    }
    
    this.apiKey = apiKey || '';
    this.model = 'deepseek-chat';
    
    // Initialize circuit breaker for API call resilience
    this.circuitBreaker = new CircuitBreaker('DEEPSEEK_API', {
      failureThreshold: 5,     // Number of failures before circuit opens
      resetTimeout: 180000,    // 3 minutes to wait before trying again
      timeoutDuration: 120000  // 2 minutes timeout for API calls
    });
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: 1800,            // 30 minutes default TTL
      checkperiod: 600,        // Check for expired keys every 10 minutes
      useClones: false         // Store references instead of cloning objects
    });
    
    console.log('[DeepseekService] Initialized');
  }

  /**
   * Generate content using DeepSeek AI
   */
  async generateContent(params: ContentGenerationParams): Promise<ServiceResponse<string>> {
    return this.executeWithErrorHandling(async () => {
      const { 
        prompt, 
        systemPrompt = 'You are a helpful assistant for musicians and artists.',
        temperature = 0.7,
        max_tokens = 2048
      } = params;

      // Create cache key based on params
      const cacheKey = `content-${JSON.stringify({ prompt, systemPrompt })}-${temperature}`;
      
      // Check cache first
      const cachedContent = this.cache.get<string>(cacheKey);
      if (cachedContent) {
        console.log('[DeepseekService] Using cached content');
        return cachedContent;
      }

      const requestData: AICompletionRequest = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      };

      return await this.executeWithLogging('generateContent', async () => {
        const response = await this.circuitBreaker.execute(this.callDeepseekAPI.bind(this), requestData);
        const content = response.choices[0].message.content;
        
        // Cache the result
        this.cache.set(cacheKey, content, CACHE_TTL.CONTENT);
        
        return content;
      });
    }, 'Failed to generate content with DeepSeek');
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
      userId?: number;
    }
  ): Promise<ServiceResponse<GrantRecommendation[]>> {
    return this.executeWithErrorHandling(async () => {
      // Create cache key based on key artist profile fields 
      const { genre, careerStage, instrumentOrRole, projectType } = artistProfile;
      const cacheKeyObj = { genre, careerStage, instrumentOrRole, projectType };
      const cacheKey = `recommendations-${JSON.stringify(cacheKeyObj)}`;
      
      // Check cache first
      const cachedRecommendations = this.cache.get<GrantRecommendation[]>(cacheKey);
      if (cachedRecommendations) {
        console.log(`[DeepseekService] Using cached grant recommendations for profile`);
        return cachedRecommendations;
      }
      
      // Get artist profile fields as a structured object
      const artistProfileObj = {
        genre: artistProfile.genre || '',
        careerStage: artistProfile.careerStage || '',
        instrumentOrRole: artistProfile.instrumentOrRole || '',
        location: artistProfile.location || '',
        projectType: artistProfile.projectType || ''
      };
      
      // Prepare the system prompt
      const systemPrompt = `You are an AI grant specialist for musicians and artists.
Generate personalized grant recommendations based on the artist's profile.

For each grant, include these fields: id (unique string), name, organization, amount, deadline (in YYYY-MM-DD format), 
description (2-3 sentences), requirements (list of strings), eligibility (list of strings), url (fictional but plausible), 
and matchScore (integer 0-100 indicating relevance, calculated based on how well the grant matches the artist profile).

CRITICAL DEADLINE REQUIREMENTS:
- Set ALL deadlines at least 1 year into the future from today's date (${new Date().toISOString().split('T')[0]})
- Prefer deadlines between 12-18 months from now to give artists plenty of preparation time
- Never set any deadlines in the past or less than 12 months from today
- Double-check all deadline dates before returning to ensure they are valid and at least 1 year in the future

Return exactly 5 grants that would be appropriate for this artist.
Only recommend grants that would be specifically relevant to the artist's profile details like genre, career stage, instrument, etc.`;
      
      // Prepare the user message
      const userMessage = `Please recommend grants for an artist with the following profile:
\`\`\`json
${JSON.stringify(artistProfileObj, null, 2)}
\`\`\`

Important instructions:
1. Make sure each grant recommendation is SPECIFICALLY tailored to this artist's profile details.
2. Focus especially on matching grants to their genre (${artistProfileObj.genre || 'Not specified'}) and instrument (${artistProfileObj.instrumentOrRole || 'Not specified'}).
3. CRITICAL: ALL grant deadlines MUST be at least 1 year (12 months) in the future from today (${new Date().toISOString().split('T')[0]}). Preferably set deadlines 12-18 months from now.
4. Use YYYY-MM-DD format for deadlines and verify each date is valid and at least 365 days from today.
5. Ensure each grant has a match score that accurately reflects its relevance to this specific artist.
6. Return your response as a JSON array of grant objects.

DOUBLE-CHECK: Before returning, verify that every deadline date is actually in the future by at least 12 months.`;
      
      const requestData: AICompletionRequest = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2048
      };
      
      return await this.executeWithLogging('getGrantRecommendations', async () => {
        try {
          const response = await this.circuitBreaker.execute(this.callDeepseekAPI.bind(this), requestData);
          
          // Parse the response
          let recommendations: GrantRecommendation[] = [];
          try {
            const content = response.choices[0].message.content;
            recommendations = this.parseGrantRecommendations(content);
            
            // Add to cache
            this.cache.set(cacheKey, recommendations, CACHE_TTL.RECOMMENDATIONS);
            
            return recommendations;
          } catch (parseError) {
            console.error('[DeepseekService] Failed to parse grant recommendations:', parseError);
            throw new Error('Failed to parse grant recommendations');
          }
        } catch (error) {
          console.error('[DeepseekService] Error getting grant recommendations:', error);
          throw error;
        }
      });
    }, 'Failed to get grant recommendations');
  }

  /**
   * Provide feedback on artist profile completeness
   */
  async getProfileFeedback(params: ProfileFeedbackParams): Promise<ServiceResponse<{ 
    completeness: number;
    feedback: string;
    missingFields: string[];
    recommendations: string[];
  }>> {
    return this.executeWithErrorHandling(async () => {
      const { artistProfile } = params;
      
      // Define a type for the known keys to enable type-safe access
      type ArtistProfileKey = keyof typeof artistProfile;
      
      // Create cache key
      const cacheKey = `profile-feedback-${JSON.stringify(artistProfile)}`;
      
      // Check cache first
      const cachedFeedback = this.cache.get(cacheKey);
      if (cachedFeedback) {
        console.log('[DeepseekService] Using cached profile feedback');
        return cachedFeedback;
      }
      
      const systemPrompt = `You are an AI assistant that helps musicians and artists improve their profiles for grant applications.
Analyze the provided artist profile and provide helpful feedback on its completeness and effectiveness.`;
      
      const userPrompt = `Please analyze this artist profile and provide feedback:
\`\`\`json
${JSON.stringify(artistProfile, null, 2)}
\`\`\`

Provide your analysis in JSON format with these fields:
- completeness: A score from 0-100 indicating how complete the profile is
- feedback: A paragraph of overall feedback on the profile
- missingFields: An array of important fields that are missing or need improvement
- recommendations: An array of specific recommendations to improve the profile

Format your response as a valid JSON object.`;
      
      const requestData: AICompletionRequest = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024
      };
      
      return await this.executeWithLogging('getProfileFeedback', async () => {
        const response = await this.circuitBreaker.execute(this.callDeepseekAPI.bind(this), requestData);
        const content = response.choices[0].message.content;
        
        // Parse the JSON response
        try {
          // Extract JSON from the response
          const jsonMatch = content.match(/```json([\s\S]*?)```/) || 
                            content.match(/```([\s\S]*?)```/) ||
                            content.match(/(\{[\s\S]*\})/);
                            
          let jsonContent = jsonMatch ? jsonMatch[1] : content;
          
          // Clean up the JSON string
          jsonContent = jsonContent.trim();
          
          // Parse the JSON
          const feedbackData = JSON.parse(jsonContent);
          
          // Cache the result
          this.cache.set(cacheKey, feedbackData, CACHE_TTL.FEEDBACK);
          
          return feedbackData;
        } catch (error) {
          console.error('[DeepseekService] Error parsing profile feedback:', error);
          
          // Get keys with values 
          const filledKeys: string[] = [];
          const emptyKeys: string[] = [];
          
          // Check for each known key if it has a value
          for (const key of ['name', 'bio', 'genre', 'careerStage', 'location', 'primaryInstrument', 'projectType']) {
            if (artistProfile[key as keyof typeof artistProfile]) {
              filledKeys.push(key);
            } else {
              emptyKeys.push(key);
            }
          }
          
          // Provide a default response if parsing fails
          return {
            completeness: Math.min(filledKeys.length * 20, 100),
            feedback: "I couldn't generate detailed feedback, but your profile has some information. The more details you provide, the better your grant matches will be.",
            missingFields: emptyKeys,
            recommendations: ["Add more details to your profile to improve your grant recommendations."]
          };
        }
      });
    }, 'Failed to get profile feedback');
  }

  /**
   * Clear the cache (useful for admin functions)
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('[DeepseekService] Cache cleared');
  }
  
  /**
   * Get health status
   */
  getHealthStatus(): { status: string; circuitState: string; } {
    const circuitState = this.circuitBreaker.getState();
    return {
      status: this.apiKey ? 'configured' : 'missing_api_key',
      circuitState: circuitState.state,
    };
  }
  
  /**
   * Reset the circuit breaker
   */
  resetCircuitBreaker() {
    return this.circuitBreaker.forceReset();
  }

  /**
   * Call the Deepseek API
   * @private
   */
  private async callDeepseekAPI(requestData: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey) {
      console.error('[DeepseekService] Deepseek API key not configured');
      // Return a properly structured fallback response instead of throwing
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: 'I apologize, but the AI service is not properly configured. Please contact support.'
          },
          finish_reason: 'stop'
        }]
      };
    }
    
    try {
      console.log(`[DeepseekService] Making API request to Deepseek: model=${requestData.model}, messages=${requestData.messages.length}`);
      
      const startTime = Date.now();
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 115000 // 115 seconds - slightly less than circuit breaker timeout
        }
      );
      
      const duration = Date.now() - startTime;
      console.log(`[DeepseekService] Deepseek API response received in ${duration}ms`);
      
      // Validate response format before returning
      if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
        console.error('[DeepseekService] Malformed Deepseek API response:', response.data);
        // Return a fallback response
        return {
          choices: [{
            message: {
              role: 'assistant',
              content: 'I received an incomplete response. Please try again later.'
            },
            finish_reason: 'stop'
          }]
        };
      }
      
      return response.data;
    } catch (error: any) {
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`[DeepseekService] Deepseek API error: ${error.message}`);
        console.error(`[DeepseekService] Status: ${error.response.status}`);
        console.error(`[DeepseekService] Data:`, error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(`[DeepseekService] Deepseek API no response: ${error.message}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`[DeepseekService] Deepseek API setup error: ${error.message}`);
      }
      
      // Rethrow the error to be handled by the circuit breaker
      throw error;
    }
  }
  
  /**
   * Parse grant recommendations from AI response
   * @private
   */
  private parseGrantRecommendations(content: string): GrantRecommendation[] {
    try {
      // Ensure we have content to parse
      if (!content || typeof content !== 'string' || content.trim() === '') {
        console.error('[DeepseekService] Empty or invalid content to parse for grant recommendations');
        return this.createDefaultGrantRecommendations();
      }
      
      // Try to find JSON in the response
      const jsonMatch = content.match(/```json([\s\S]*?)```/) || 
                        content.match(/```([\s\S]*?)```/) ||
                        content.match(/(\[[\s\S]*\])/);
                        
      if (!jsonMatch) {
        console.error('[DeepseekService] No JSON found in response:', content);
        return this.createDefaultGrantRecommendations();
      }
      
      let jsonContent = jsonMatch[1];
      
      // Clean up the JSON string
      jsonContent = jsonContent.trim();
      
      // Parse the JSON
      const recommendations = JSON.parse(jsonContent);
      
      if (!Array.isArray(recommendations)) {
        console.error('[DeepseekService] Parsed content is not an array:', recommendations);
        return this.createDefaultGrantRecommendations();
      }
      
      // Validate and sanitize each recommendation
      return recommendations.map(rec => this.sanitizeGrantRecommendation(rec));
    } catch (error) {
      console.error('[DeepseekService] Error parsing grant recommendations:', error);
      return this.createDefaultGrantRecommendations();
    }
  }
  
  /**
   * Sanitize a grant recommendation to ensure it has all required fields
   * @private
   */
  private sanitizeGrantRecommendation(rec: any): GrantRecommendation {
    // Ensure all fields exist
    const sanitized: GrantRecommendation = {
      id: rec.id || `grant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: rec.name || 'Music Grant',
      organization: rec.organization || 'Arts Foundation',
      amount: rec.amount || '$5,000 - $10,000',
      deadline: this.ensureFutureDate(rec.deadline),
      description: rec.description || 'A grant for musicians and artists.',
      requirements: Array.isArray(rec.requirements) ? rec.requirements : ['Portfolio submission', 'Project proposal'],
      eligibility: Array.isArray(rec.eligibility) ? rec.eligibility : ['Professional musicians', 'US-based artists'],
      url: rec.url || 'https://example.org/grants',
      matchScore: typeof rec.matchScore === 'number' ? Math.max(0, Math.min(100, rec.matchScore)) : 75
    };
    
    return sanitized;
  }
  
  /**
   * Ensure the date is at least 1 year in the future
   * @private
   */
  private ensureFutureDate(dateStr: string): string {
    try {
      // Parse the date
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Get date 1 year from now
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      // If date is less than 1 year from now, add 1 year
      if (date < oneYearFromNow) {
        date.setFullYear(date.getFullYear() + 1);
      }
      
      // Return formatted date
      return date.toISOString().split('T')[0];
    } catch (e) {
      // If there's an error, return a date 1 year from now
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return date.toISOString().split('T')[0];
    }
  }
  
  /**
   * Create default grant recommendations
   * @private
   */
  private createDefaultGrantRecommendations(): GrantRecommendation[] {
    // Get date 15 months from now
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    return [
      {
        id: `grant-${Date.now()}-1`,
        name: 'Music Innovation Grant',
        organization: 'National Endowment for the Arts',
        amount: '$5,000 - $15,000',
        deadline: dateStr,
        description: 'Supporting innovative music projects and performances that push creative boundaries.',
        requirements: ['Project proposal', 'Budget outline', 'Work samples'],
        eligibility: ['Professional musicians', 'US-based artists'],
        url: 'https://arts.gov/grants/music-innovation',
        matchScore: 85
      },
      {
        id: `grant-${Date.now()}-2`,
        name: 'Community Music Program',
        organization: 'Local Arts Foundation',
        amount: '$2,500 - $10,000',
        deadline: dateStr,
        description: 'Funding for musicians to develop programs that engage local communities through music.',
        requirements: ['Community engagement plan', 'Project timeline', 'Letters of support'],
        eligibility: ['Musicians of all career stages', 'Focus on community impact'],
        url: 'https://localarts.org/community-grants',
        matchScore: 78
      },
      {
        id: `grant-${Date.now()}-3`,
        name: 'Recording Project Fund',
        organization: 'Music Forward Foundation',
        amount: '$3,000 - $8,000',
        deadline: dateStr,
        description: 'Supporting the production and distribution of original music recordings.',
        requirements: ['Demo recordings', 'Marketing plan', 'Production budget'],
        eligibility: ['Independent artists', 'Original music only'],
        url: 'https://musicforward.org/recording-fund',
        matchScore: 90
      },
      {
        id: `grant-${Date.now()}-4`,
        name: 'Emerging Artist Fellowship',
        organization: 'Creative Future Institute',
        amount: '$12,000',
        deadline: dateStr,
        description: 'Year-long fellowship for promising early-career musicians to develop their craft.',
        requirements: ['Career development plan', 'Artist statement', 'Performance history'],
        eligibility: ['Early career artists (1-5 years professional experience)', 'Demonstrated talent'],
        url: 'https://creativefuture.org/fellowships',
        matchScore: 75
      },
      {
        id: `grant-${Date.now()}-5`,
        name: 'Music Education Initiative',
        organization: 'Harmony Foundation',
        amount: '$4,000 - $20,000',
        deadline: dateStr,
        description: 'Supporting musicians who develop and implement music education programs in schools or underserved communities.',
        requirements: ['Curriculum outline', 'Target audience description', 'Impact metrics'],
        eligibility: ['Musicians with teaching experience', 'Education-focused projects'],
        url: 'https://harmonyfoundation.org/education-grants',
        matchScore: 70
      }
    ];
  }
}

// Create a singleton instance
export const deepseekService = new DeepseekService();