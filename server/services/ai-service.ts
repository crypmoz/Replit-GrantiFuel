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

export interface ProfileRequirement {
  fieldName: string;
  importance: 'required' | 'recommended' | 'optional';
  description: string;
  examples?: string[];
}

export interface DocumentAnalysisResult {
  documentId: number;
  title: string;
  summary: string;
  topics: string[];
  relevanceScore: number;
  keyInsights: string[];
  targetAudience: string[];
  profileRequirements?: ProfileRequirement[];
}

export interface DocumentClassificationResult {
  title: string;
  content: string;
  type: 'grant_info' | 'artist_guide' | 'application_tips' | 'admin_knowledge' | 'user_upload';
  tags: string[];
  confidence: number;
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
  PROPOSALS: 7200,       // 2 hours
  DOCUMENT_ANALYSIS: 86400, // 24 hours
  DOCUMENT_CLASSIFICATION: 3600 // 1 hour
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
      userId?: number;
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
      
      // Analyze documents for enhanced recommendations if user ID is provided
      let documentAnalyses: DocumentAnalysisResult[] = [];
      if (artistProfile.userId) {
        try {
          documentAnalyses = await this.analyzeDocumentsForGrantMatching(artistProfile.userId, artistProfile);
        } catch (error) {
          console.error('[AIService] Error analyzing documents for recommendations:', error);
          // Continue even if document analysis fails
        }
      }
      
      // Retrieve relevant documents for context
      const documents = await this.getRelevantDocuments('grants for musicians');
      let documentContext = '';
      
      // If we have document analyses, use those for enhanced context
      if (documentAnalyses && documentAnalyses.length > 0) {
        documentContext = "Here are some analyzed documents that provide context for grant recommendations:\n" + 
          documentAnalyses.map(analysis => {
            return `Document: ${analysis.title}\nSummary: ${analysis.summary}\nKey Insights: ${analysis.keyInsights.join(', ')}\nRelevance: ${analysis.relevanceScore}/100\n`;
          }).join('\n---\n');
      } 
      // Otherwise use basic document context
      else if (documents && documents.length > 0) {
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
   * Analyze a document using AI
   */
  async analyzeDocument(documentId: number): Promise<ServiceResponse<DocumentAnalysisResult>> {
    return this.executeWithErrorHandling(async () => {
      // Create cache key based on document ID
      const cacheKey = `doc-analysis-${documentId}`;
      
      // Check cache first
      const cachedAnalysis = this.cache.get<DocumentAnalysisResult>(cacheKey);
      if (cachedAnalysis) {
        console.log(`[AIService] Using cached document analysis for document ${documentId}`);
        return cachedAnalysis;
      }
      
      // Get the document from storage
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }
      
      // Prepare the system prompt
      const systemPrompt = `You are an AI assistant specialized in analyzing grant-related documents for musicians and artists.
Your task is to analyze the provided document and extract key information that would be useful for grant matching and profile completion.
Provide a structured analysis with the following components:
1. A concise summary of the document
2. Main topics covered in the document
3. Relevance score for grant matching (0-100)
4. Key insights from the document
5. Target audience information
6. Required profile fields for artists applying to grants

Identify any profile fields that would be needed for grant applications mentioned in the document.
`;

      // Prepare the user message
      const userMessage = `Please analyze the following document:

Title: ${document.title}
Type: ${document.type}
Content: ${document.content}

Return your analysis in JSON format with the following fields:
{
  "summary": "A concise summary of the document (100-150 words)",
  "topics": ["List of main topics covered"],
  "relevanceScore": number between 0-100,
  "keyInsights": ["List of key insights or important points"],
  "targetAudience": ["List of target audience groups"],
  "profileRequirements": [
    {
      "fieldName": "Name of the profile field (e.g., 'genre', 'careerStage', 'education', etc.)",
      "importance": "required/recommended/optional",
      "description": "Brief description of what this field is and why it matters for grant applications",
      "examples": ["Example values for this field"]
    }
  ]
}`;

      const requestData: AICompletionRequest = {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.5,
        max_tokens: 2048
      };
      
      return await this.executeWithLogging('analyzeDocument', async () => {
        try {
          const response = await this.circuitBreaker.execute(this.callAI.bind(this), requestData);
          
          // Parse the response
          try {
            const content = response.choices[0].message.content;
            const analysis = this.parseDocumentAnalysis(content, documentId, document.title);
            
            // Add to cache
            this.cache.set(cacheKey, analysis, CACHE_TTL.DOCUMENT_ANALYSIS);
            
            return analysis;
          } catch (parseError) {
            console.error('[AIService] Failed to parse document analysis:', parseError);
            throw new Error('Failed to parse document analysis');
          }
        } catch (error) {
          console.error('[AIService] Error analyzing document:', error);
          
          // Create a minimal analysis result as fallback
          return {
            documentId,
            title: document.title,
            summary: "Analysis unavailable at this time.",
            topics: ["Music grants"],
            relevanceScore: 50,
            keyInsights: ["Please try analyzing this document again later."],
            targetAudience: ["Musicians", "Artists"]
          };
        }
      });
    }, 'Failed to analyze document');
  }
  
  /**
   * Classify and extract information from a document
   * This is used for the admin document upload to auto-detect fields
   */
  async classifyDocument(fileContent: string, fileName: string): Promise<ServiceResponse<DocumentClassificationResult>> {
    return this.executeWithErrorHandling(async () => {
      // Create cache key based on filename and first 100 chars of content
      const contentPreview = fileContent.substring(0, 100).replace(/\s+/g, '');
      const cacheKey = `doc-classification-${fileName}-${contentPreview}`;
      
      // Check cache first
      const cachedClassification = this.cache.get<DocumentClassificationResult>(cacheKey);
      if (cachedClassification) {
        console.log(`[AIService] Using cached document classification for file ${fileName}`);
        return cachedClassification;
      }
      
      // Prepare the system prompt
      const systemPrompt = `You are an AI assistant specialized in analyzing documents for a music grant application system.
Your task is to analyze the provided document and classify it into one of the following categories:
- grant_info: Information about specific grants or funding opportunities
- artist_guide: Guides and resources for musicians and artists
- application_tips: Tips and advice for grant applications
- admin_knowledge: Administrative information for system administrators
- user_upload: General user-uploaded content that doesn't fit other categories

You'll also need to extract key information from the document and suggest appropriate tags.`;

      // Prepare the user message
      const userMessage = `Please analyze the following document:

Filename: ${fileName}
Content: ${fileContent.substring(0, 5000)}${fileContent.length > 5000 ? '...' : ''}

Return your analysis in JSON format with the following fields:
{
  "title": "Suggested title for this document (concise and descriptive)",
  "content": "A 2-3 sentence summary of the document's contents",
  "type": "One of: grant_info, artist_guide, application_tips, admin_knowledge, user_upload",
  "tags": ["Suggested tags for this document (3-5 tags)"],
  "confidence": number between 0-100 representing confidence in classification
}`;

      const requestData: AICompletionRequest = {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 1024
      };
      
      return await this.executeWithLogging('classifyDocument', async () => {
        try {
          const response = await this.circuitBreaker.execute(this.callAI.bind(this), requestData);
          
          // Parse the response
          try {
            const content = response.choices[0].message.content;
            const classification = this.parseDocumentClassification(content);
            
            // Add to cache
            this.cache.set(cacheKey, classification, CACHE_TTL.DOCUMENT_CLASSIFICATION);
            
            return classification;
          } catch (parseError) {
            console.error('[AIService] Failed to parse document classification:', parseError);
            throw new Error('Failed to parse document classification');
          }
        } catch (error) {
          console.error('[AIService] Error classifying document:', error);
          
          // Create a minimal classification result as fallback
          return {
            title: fileName,
            content: "This document appears to contain information relevant to music grants.",
            type: "user_upload",
            tags: ["upload", "music", "document"],
            confidence: 30
          };
        }
      });
    }, 'Failed to classify document');
  }

  /**
   * Analyze multiple documents to enhance grant recommendations
   */
  async analyzeDocumentsForGrantMatching(userId: number, artistProfile: any): Promise<DocumentAnalysisResult[]> {
    try {
      // Get documents relevant to the user and artist profile
      const documents = await storage.getApprovedDocuments();
      if (!documents || documents.length === 0) {
        return [];
      }
      
      // Limit to max 5 documents to analyze
      const relevantDocs = documents.slice(0, 5);
      
      // Analyze each document in parallel
      const analysisPromises = relevantDocs.map(async (doc) => {
        const result = await this.analyzeDocument(doc.id);
        if (!result.success) {
          return null;
        }
        return result.data; // Properly extract the DocumentAnalysisResult from the ServiceResponse
      });
      
      const analysisResults = await Promise.all(analysisPromises);
      
      // Filter out nulls and sort by relevance score
      const validResults: DocumentAnalysisResult[] = [];
      
      for (const result of analysisResults) {
        if (result && typeof result?.relevanceScore === 'number' && result.relevanceScore > 30) {
          validResults.push(result);
        }
      }
      
      // Sort by relevance score
      return validResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('[AIService] Error analyzing documents for grant matching:', error);
      return [];
    }
  }
  
  /**
   * Extract required profile fields from documents
   * This helps identify what fields artists need to complete for better grant matches
   */
  async getRequiredProfileFields(): Promise<ServiceResponse<ProfileRequirement[]>> {
    return this.executeWithErrorHandling(async () => {
      // Create cache key
      const cacheKey = `profile-requirements`;
      
      // Check cache first
      const cachedRequirements = this.cache.get<ProfileRequirement[]>(cacheKey);
      if (cachedRequirements) {
        console.log(`[AIService] Using cached profile requirements`);
        return cachedRequirements;
      }
      
      // Get approved documents
      const documents = await storage.getApprovedDocuments();
      if (!documents || documents.length === 0) {
        // Return default requirements if no documents
        const defaultRequirements: ProfileRequirement[] = [
          {
            fieldName: "genre",
            importance: "required",
            description: "Primary musical genre of the artist",
            examples: ["Classical", "Jazz", "Hip-hop", "Rock", "Electronic"]
          },
          {
            fieldName: "careerStage",
            importance: "required",
            description: "Current stage of the artist's career",
            examples: ["Early career", "Mid-career", "Established"]
          },
          {
            fieldName: "instrumentOrRole",
            importance: "required",
            description: "Main instrument played or role in music production",
            examples: ["Vocalist", "Guitarist", "Producer", "Composer"]
          }
        ];
        
        // Cache the default requirements
        this.cache.set(cacheKey, defaultRequirements, CACHE_TTL.DOCUMENT_ANALYSIS);
        return defaultRequirements;
      }
      
      // Analyze documents to extract profile requirements
      const analysisResults: DocumentAnalysisResult[] = [];
      
      // Limit to a reasonable number of documents
      const docsToAnalyze = documents.slice(0, 5);
      for (const doc of docsToAnalyze) {
        try {
          const analysis = await this.analyzeDocument(doc.id);
          if (analysis.success && analysis.data) {
            analysisResults.push(analysis.data);
          }
        } catch (error) {
          console.error(`[AIService] Error analyzing document ${doc.id}:`, error);
          // Continue with other documents
        }
      }
      
      // Consolidate profile requirements from all analyses
      const allRequirements: ProfileRequirement[] = [];
      
      // Extract profile requirements from all document analyses
      analysisResults.forEach(analysis => {
        if (analysis.profileRequirements && analysis.profileRequirements.length > 0) {
          allRequirements.push(...analysis.profileRequirements);
        }
      });
      
      // If we couldn't extract any requirements, return defaults
      if (allRequirements.length === 0) {
        const defaultRequirements: ProfileRequirement[] = [
          {
            fieldName: "genre",
            importance: "required",
            description: "Primary musical genre of the artist",
            examples: ["Classical", "Jazz", "Hip-hop", "Rock", "Electronic"]
          },
          {
            fieldName: "careerStage",
            importance: "required",
            description: "Current stage of the artist's career",
            examples: ["Early career", "Mid-career", "Established"]
          },
          {
            fieldName: "instrumentOrRole",
            importance: "required",
            description: "Main instrument played or role in music production",
            examples: ["Vocalist", "Guitarist", "Producer", "Composer"]
          }
        ];
        
        // Cache the default requirements
        this.cache.set(cacheKey, defaultRequirements, CACHE_TTL.DOCUMENT_ANALYSIS);
        return defaultRequirements;
      }
      
      // Consolidate requirements (combine duplicate fields and keep the highest importance)
      const fieldMap = new Map<string, ProfileRequirement>();
      
      allRequirements.forEach(req => {
        const normalizedField = req.fieldName.toLowerCase().trim();
        
        // If we already have this field, potentially update its importance
        if (fieldMap.has(normalizedField)) {
          const existing = fieldMap.get(normalizedField)!;
          
          // Update importance if the new one is higher priority
          const importanceLevels = { required: 3, recommended: 2, optional: 1 };
          const existingLevel = importanceLevels[existing.importance];
          const newLevel = importanceLevels[req.importance];
          
          if (newLevel > existingLevel) {
            existing.importance = req.importance;
          }
          
          // Merge examples if available
          if (req.examples && req.examples.length > 0) {
            if (!existing.examples) {
              existing.examples = [];
            }
            
            // Add unique examples
            req.examples.forEach(example => {
              if (!existing.examples!.includes(example)) {
                existing.examples!.push(example);
              }
            });
          }
        } else {
          // Add new field
          fieldMap.set(normalizedField, { ...req });
        }
      });
      
      // Convert the map back to an array
      const consolidatedRequirements = Array.from(fieldMap.values());
      
      // Sort by importance (required first, then recommended, then optional)
      const sortedRequirements = consolidatedRequirements.sort((a, b) => {
        const importanceOrder = { required: 1, recommended: 2, optional: 3 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      });
      
      // Cache the results
      this.cache.set(cacheKey, sortedRequirements, CACHE_TTL.DOCUMENT_ANALYSIS);
      
      return sortedRequirements;
    }, 'Failed to extract required profile fields');
  }
  
  /**
   * Parse document analysis result from AI response
   */
  private parseDocumentAnalysis(content: string, documentId: number, documentTitle: string): DocumentAnalysisResult {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/```json([\s\S]*?)```/) || 
                        content.match(/```([\s\S]*?)```/) ||
                        content.match(/(\{[\s\S]*?\})/);
      
      if (jsonMatch && jsonMatch[1]) {
        // Parse the JSON within the code block
        const jsonContent = jsonMatch[1].trim();
        const parsedResult = JSON.parse(jsonContent);
        
        // Ensure the result has the documentId and title
        return {
          documentId,
          title: documentTitle,
          ...parsedResult
        };
      } else {
        // Try parsing the entire response as JSON
        const parsedResult = JSON.parse(content);
        return {
          documentId,
          title: documentTitle,
          ...parsedResult
        };
      }
    } catch (e) {
      console.error('[AIService] Failed to parse document analysis JSON:', e);
      
      // Create a simple analysis result with default values
      return {
        documentId,
        title: documentTitle,
        summary: "Unable to parse analysis result.",
        topics: ["Document analysis"],
        relevanceScore: 40,
        keyInsights: ["Analysis parsing failed"],
        targetAudience: ["Musicians"],
        profileRequirements: [{
          fieldName: "genre",
          importance: "recommended",
          description: "Primary musical genre of the artist",
          examples: ["Classical", "Jazz", "Hip-hop"]
        }]
      };
    }
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
  
  /**
   * Parse document classification result from AI response
   */
  private parseDocumentClassification(content: string): DocumentClassificationResult {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/```json([\s\S]*?)```/) || 
                        content.match(/```([\s\S]*?)```/) ||
                        content.match(/(\{[\s\S]*?\})/);
      
      if (jsonMatch && jsonMatch[1]) {
        // Parse the JSON within the code block
        const jsonContent = jsonMatch[1].trim();
        const parsedResult = JSON.parse(jsonContent);
        
        // Validate the result has all required fields
        const result: DocumentClassificationResult = {
          title: parsedResult.title || "Untitled Document",
          content: parsedResult.content || "No summary available",
          type: this.validateDocumentType(parsedResult.type),
          tags: Array.isArray(parsedResult.tags) ? parsedResult.tags : [],
          confidence: typeof parsedResult.confidence === 'number' ? 
                      Math.min(100, Math.max(0, parsedResult.confidence)) : 50
        };
        
        return result;
      } else {
        // Try parsing the entire response as JSON
        const parsedResult = JSON.parse(content);
        
        return {
          title: parsedResult.title || "Untitled Document",
          content: parsedResult.content || "No summary available",
          type: this.validateDocumentType(parsedResult.type),
          tags: Array.isArray(parsedResult.tags) ? parsedResult.tags : [],
          confidence: typeof parsedResult.confidence === 'number' ? 
                      Math.min(100, Math.max(0, parsedResult.confidence)) : 50
        };
      }
    } catch (e) {
      console.error('[AIService] Failed to parse document classification JSON:', e);
      
      // Create a default classification
      return {
        title: "Untitled Document",
        content: "This document couldn't be automatically classified.",
        type: "user_upload",
        tags: ["unclassified"],
        confidence: 0
      };
    }
  }
  
  /**
   * Validate document type value
   */
  private validateDocumentType(type: string): DocumentClassificationResult['type'] {
    const validTypes = ['grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload'];
    
    if (type && validTypes.includes(type)) {
      return type as DocumentClassificationResult['type'];
    }
    
    return 'user_upload';
  }
}

// Export a singleton instance
export const aiService = new AIService();