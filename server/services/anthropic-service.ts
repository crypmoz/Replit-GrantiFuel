/**
 * Anthropic Claude Service
 * 
 * A service for interacting with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseService, ServiceResponse } from './base-service';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { storage } from '../storage';
import NodeCache from 'node-cache';

// Constants
const CACHE_TTL = {
  PROPOSALS: 7200,       // 2 hours
  ANSWERS: 1800,         // 30 minutes
  DOCUMENT_ANALYSIS: 86400, // 24 hours
};

// Types specific to the Anthropic service
export interface GenerateMusicProposalParams {
  projectDescription: string;
  artistName?: string;
  artistBio?: string;
  artistGenre?: string;
  grantName?: string;
  grantOrganization?: string;
  grantRequirements?: string;
  projectTitle?: string;
}

export class AnthropicService extends BaseService {
  private anthropic: Anthropic;
  private circuitBreaker: CircuitBreaker;
  private cache: NodeCache;
  private model: string;

  constructor() {
    super('AnthropicService');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY environment variable is not set');
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    this.model = 'claude-3-7-sonnet-20250219';
    
    // Initialize circuit breaker for API call resilience
    this.circuitBreaker = new CircuitBreaker('ANTHROPIC_API', {
      failureThreshold: 4,     // Number of failures before circuit opens
      resetTimeout: 120000,    // 2 minutes to wait before trying again
      timeoutDuration: 60000   // 1 minute timeout for API calls
    });
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: 1800,            // 30 minutes default TTL
      checkperiod: 600,        // Check for expired keys every 10 minutes
      useClones: false         // Store references instead of cloning objects
    });
    
    console.log('[AnthropicService] Initialized');
  }

  /**
   * Generate a music grant proposal using Claude
   */
  async generateMusicProposal(params: GenerateMusicProposalParams): Promise<ServiceResponse<string>> {
    return this.executeWithErrorHandling(async () => {
      const { 
        projectDescription, 
        artistName = 'the artist', 
        artistBio = 'a professional musician', 
        artistGenre = 'music', 
        grantName = 'the music grant', 
        grantOrganization = 'the arts foundation', 
        grantRequirements = 'funding for music projects',
        projectTitle = 'Music Project'
      } = params;

      // Create cache key based on params
      const cacheKey = `claude-proposal-${JSON.stringify(params)}`;
      
      // Check cache first
      const cachedProposal = this.cache.get<string>(cacheKey);
      if (cachedProposal) {
        console.log('[AnthropicService] Using cached proposal');
        return cachedProposal;
      }

      const systemPrompt = `You are an expert grant writer specializing in helping musicians and artists.
Your task is to write a compelling grant proposal that meets the requirements of the grant and 
effectively communicates the artist's qualifications and project goals.`;

      const userMessage = `Please write a detailed music grant proposal for the following:
Artist: ${artistName}
Artist Bio: ${artistBio}
Genre: ${artistGenre}
Grant: ${grantName} from ${grantOrganization}
Grant Requirements: ${grantRequirements}
Project Title: ${projectTitle}
Project Description: ${projectDescription}

Include these sections:
1. Introduction
2. Artist Background & Qualifications
3. Project Description
4. Goals & Objectives
5. Budget Summary
6. Expected Impact
7. Timeline

Format your response using Markdown with clear headings and bullet points where appropriate.
The proposal should be comprehensive and persuasive, approximately 1000-1500 words.`;

      return await this.executeWithLogging('generateMusicProposal', async () => {
        const response = await this.circuitBreaker.execute(async () => {
          try {
            console.log(`[AnthropicService] Making API request to Claude: model=${this.model}`);
            
            const startTime = Date.now();
            const message = await this.anthropic.messages.create({
              model: this.model,
              max_tokens: 4000,
              messages: [
                { role: 'user', content: userMessage }
              ],
              system: systemPrompt,
              temperature: 0.7
            });
            
            const duration = Date.now() - startTime;
            console.log(`[AnthropicService] Claude API response received in ${duration}ms`);
            
            // The response will contain content blocks, extract the text
            const contentBlocks = message.content;
            if (contentBlocks && contentBlocks.length > 0) {
              // Find the first text block
              for (const block of contentBlocks) {
                if (block.type === 'text') {
                  return block.text;
                }
              }
            }
            
            throw new Error('No text content found in Claude API response');
          } catch (error) {
            console.error(`[AnthropicService] Claude API error:`, error);
            throw error;
          }
        });
        
        // Cache the result
        this.cache.set(cacheKey, response, CACHE_TTL.PROPOSALS);
        
        return response;
      });
    }, 'Failed to generate music proposal with Claude');
  }

  /**
   * Clear the cache (useful for admin functions)
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('[AnthropicService] Cache cleared');
  }
}

// Create a singleton instance
export const anthropicService = new AnthropicService();