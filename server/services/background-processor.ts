import { storage } from '../storage';
import { aiService } from './ai-service';
import { Document, documentTypeEnum } from '@shared/schema';
import NodeCache from 'node-cache';

/**
 * Background processor for handling resource-intensive AI operations
 * This service runs document analysis in the background and caches results
 */
export class BackgroundProcessor {
  private static instance: BackgroundProcessor;
  private processingQueue: Set<number> = new Set();
  private processingStatus: NodeCache;
  private analysisResults: NodeCache;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Cache for tracking processing status (10 min TTL)
    this.processingStatus = new NodeCache({ stdTTL: 600, checkperiod: 60 });
    // Cache for storing analysis results (24 hour TTL)
    this.analysisResults = new NodeCache({ stdTTL: 86400, checkperiod: 300 });

    // Setup automatic processing interval (every 5 minutes)
    this.startProcessingInterval();

    console.log('[BackgroundProcessor] Initialized');
  }

  public static getInstance(): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor();
    }
    return BackgroundProcessor.instance;
  }

  /**
   * Start the background processing interval
   */
  public startProcessingInterval(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processDocumentQueue().catch(err => {
        console.error('[BackgroundProcessor] Error in processing interval:', err);
      });
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('[BackgroundProcessor] Processing interval started');
  }

  /**
   * Stop the background processing interval
   */
  public stopProcessingInterval(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[BackgroundProcessor] Processing interval stopped');
    }
  }

  /**
   * Queue a document for analysis
   * @param documentId The document ID to process
   * @returns Status information about the queued document
   */
  public queueDocumentForAnalysis(documentId: number): { queued: boolean, status: string } {
    if (this.processingStatus.get(`doc_${documentId}`)) {
      return { 
        queued: false, 
        status: this.processingStatus.get(`doc_${documentId}`) as string 
      };
    }

    this.processingQueue.add(documentId);
    this.processingStatus.set(`doc_${documentId}`, 'queued');
    
    // Trigger processing if not already running
    if (!this.isProcessing) {
      this.processDocumentQueue().catch(err => {
        console.error('[BackgroundProcessor] Error processing queue:', err);
      });
    }

    return { queued: true, status: 'queued' };
  }

  /**
   * Check if a document has been analyzed
   * @param documentId The document ID to check
   * @returns Status and result information
   */
  public getDocumentAnalysis(documentId: number): { 
    processed: boolean, 
    status: string, 
    result?: any 
  } {
    const status = this.processingStatus.get(`doc_${documentId}`);
    const result = this.analysisResults.get(`doc_${documentId}`);

    if (result) {
      return { processed: true, status: 'completed', result };
    }

    if (status) {
      return { processed: false, status: status as string };
    }

    return { processed: false, status: 'not_queued' };
  }

  /**
   * Queue all unprocessed documents for analysis
   */
  public async queueAllDocuments(): Promise<{ queued: number }> {
    try {
      const documents = await storage.getAllDocuments();
      let queuedCount = 0;

      for (const doc of documents) {
        if (!this.processingStatus.get(`doc_${doc.id}`)) {
          this.processingQueue.add(doc.id);
          this.processingStatus.set(`doc_${doc.id}`, 'queued');
          queuedCount++;
        }
      }

      // Start processing if documents were queued
      if (queuedCount > 0 && !this.isProcessing) {
        this.processDocumentQueue().catch(err => {
          console.error('[BackgroundProcessor] Error processing queue:', err);
        });
      }

      return { queued: queuedCount };
    } catch (error) {
      console.error('[BackgroundProcessor] Error queuing all documents:', error);
      return { queued: 0 };
    }
  }

  /**
   * Get all document analysis results
   * @returns Object with document IDs as keys and analysis results as values
   */
  public getAllAnalysisResults(): Record<string, any> {
    const results: Record<string, any> = {};
    
    this.analysisResults.keys().forEach(key => {
      if (key.startsWith('doc_')) {
        const docId = key.replace('doc_', '');
        results[docId] = this.analysisResults.get(key);
      }
    });
    
    return results;
  }

  /**
   * Process the document queue
   * This runs in the background to analyze documents
   */
  private async processDocumentQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      // Get all documents in the queue
      const queueArray = Array.from(this.processingQueue);
      const totalDocuments = queueArray.length;
      
      // Process documents in batches of 5 to avoid overloading the system
      const BATCH_SIZE = 5;
      const totalBatches = Math.ceil(totalDocuments / BATCH_SIZE);
      
      console.log(`[BackgroundProcessor] Processing ${totalDocuments} documents in ${totalBatches} batches of max ${BATCH_SIZE}`);
      
      // Create a processing job to track progress across all batches
      const job = await storage.createProcessingJob({
        jobType: 'document_analysis',
        status: 'running',
        entityType: 'document',
        entityId: 0, // Not specific to any one document
        params: {
          documentCount: totalDocuments,
          documentIds: queueArray,
          batchSize: BATCH_SIZE,
          totalBatches: totalBatches,
          startTime: new Date().toISOString()
        },
      });
      
      console.log(`[BackgroundProcessor] Created processing job ${job.id}`);

      let processedCount = 0;
      let errorCount = 0;
      
      // Process documents in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, totalDocuments);
        const currentBatch = queueArray.slice(start, end);
        
        console.log(`[BackgroundProcessor] Processing batch ${batchIndex + 1}/${totalBatches} with ${currentBatch.length} documents`);
        
        // Update job status at batch start
        await storage.updateProcessingJob(job.id, {
          status: 'processing',
          result: {
            progress: Math.floor((processedCount / totalDocuments) * 100),
            currentBatch: batchIndex + 1,
            totalBatches: totalBatches,
            processedCount: processedCount,
            errorCount: errorCount,
            message: `Starting batch ${batchIndex + 1} of ${totalBatches}`
          }
        });
        
        // Process each document in the current batch
        for (const documentId of currentBatch) {
          // Check if document exists and if it already has analysis
          const document = await storage.getDocument(documentId);
          if (!document) {
            console.log(`[BackgroundProcessor] Document ${documentId} not found, removing from queue`);
            this.processingQueue.delete(documentId);
            this.processingStatus.set(`doc_${documentId}`, 'not_found');
            processedCount++;
            errorCount++;
            continue;
          }
          
          // Check if we already have a persisted analysis for this document
          const existingAnalysis = await storage.getDocumentAnalysis(documentId);
          
          if (existingAnalysis) {
            console.log(`[BackgroundProcessor] Document ${documentId} already has persisted analysis`);
            // Cache in memory for quicker access
            const analysisData = {
              summary: existingAnalysis.summary,
              topics: existingAnalysis.topics,
              relevanceScore: existingAnalysis.relevanceScore,
              keyInsights: existingAnalysis.keyInsights,
              targetAudience: existingAnalysis.targetAudience,
              profileRequirements: existingAnalysis.profileRequirements
            };
            this.analysisResults.set(`doc_${documentId}`, analysisData);
            this.processingStatus.set(`doc_${documentId}`, 'completed');
            this.processingQueue.delete(documentId);
            processedCount++;
            continue;
          }

          try {
            // Update status to processing
            this.processingStatus.set(`doc_${documentId}`, 'processing');
            
            // Update the job status for individual document
            await storage.updateProcessingJob(job.id, {
              status: 'processing',
              result: {
                progress: Math.floor((processedCount / totalDocuments) * 100),
                currentBatch: batchIndex + 1,
                totalBatches: totalBatches,
                currentDocument: documentId,
                processedCount: processedCount,
                errorCount: errorCount
              }
            });
            
            // Analyze the document
            const analysisResults = await this.analyzeDocument(document);
            
            // Cache the results in memory
            this.analysisResults.set(`doc_${documentId}`, analysisResults);
            
            // Save analysis results to the database to persist them
            await storage.createOrUpdateDocumentAnalysis({
              documentId,
              summary: analysisResults.summary || "No summary available",
              topics: analysisResults.topics || [],
              relevanceScore: analysisResults.relevanceScore || 0,
              keyInsights: analysisResults.keyInsights || [],
              targetAudience: analysisResults.targetAudience || [],
              profileRequirements: typeof analysisResults.profileRequirements === 'object' 
                ? analysisResults.profileRequirements 
                : {}
            });
            
            // Update status to completed
            this.processingStatus.set(`doc_${documentId}`, 'completed');
            
            // Remove from processing queue
            this.processingQueue.delete(documentId);
            
            processedCount++;
            
            console.log(`[BackgroundProcessor] Completed analysis for document ${documentId}`);
          } catch (error) {
            console.error(`[BackgroundProcessor] Error processing document ${documentId}:`, error);
            this.processingStatus.set(`doc_${documentId}`, 'error');
            errorCount++;
            
            // Create a failed analysis entry in the database
            try {
              await storage.createOrUpdateDocumentAnalysis({
                documentId,
                summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                topics: [],
                relevanceScore: 0,
                keyInsights: [],
                targetAudience: [],
                profileRequirements: { error: error instanceof Error ? error.message : 'Unknown error' }
              });
            } catch (dbError) {
              console.error(`[BackgroundProcessor] Error saving failed analysis to DB:`, dbError);
            }
            
            // Remove from queue so we don't try again immediately
            this.processingQueue.delete(documentId);
          }
        }
        
        // If there are more batches to process, pause briefly to prevent overwhelming the system
        if (batchIndex < totalBatches - 1) {
          console.log(`[BackgroundProcessor] Completed batch ${batchIndex + 1}/${totalBatches}, pausing before next batch`);
          
          // Update job status between batches
          await storage.updateProcessingJob(job.id, {
            status: 'processing',
            result: {
              progress: Math.floor((processedCount / totalDocuments) * 100),
              processedCount: processedCount,
              errorCount: errorCount,
              currentBatch: batchIndex + 1,
              totalBatches: totalBatches,
              message: `Completed batch ${batchIndex + 1} of ${totalBatches}, pausing before next batch`
            }
          });
          
          // Pause for 10 seconds between batches to let the system breathe
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      
      // Update the job status to completed
      await storage.updateProcessingJob(job.id, {
        status: 'completed',
        completedAt: new Date(),
        result: {
          progress: 100,
          processedCount: processedCount,
          errorCount: errorCount,
          totalDocuments: totalDocuments,
          totalBatches: totalBatches,
          message: 'All documents processed'
        }
      });
      
      console.log(`[BackgroundProcessor] Job ${job.id} completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('[BackgroundProcessor] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze a document using the AI service
   * @param document The document to analyze
   * @returns Analysis results
   */
  private async analyzeDocument(document: Document): Promise<any> {
    try {
      const documentText = document.content || '';
      const docType = document.type || 'user_upload';
      
      // Use a generic document analysis regardless of type for now
      // This simplifies implementation and avoids type errors
      const response = await aiService.analyzeDocument(document.id);
      return response.data || {};
    } catch (error) {
      console.error(`[BackgroundProcessor] Error in analyzeDocument:`, error);
      throw error;
    }
  }

  /**
   * Get the profile requirements from analyzed documents
   * Either returns cached results or generates new ones
   */
  public async getProfileRequirements(): Promise<any> {
    // Check if we have cached profile requirements
    const cachedRequirements = this.analysisResults.get('profile_requirements');
    if (cachedRequirements) {
      return cachedRequirements;
    }

    try {
      // Check if we have profile requirements in the database
      const allDocumentAnalyses = await storage.getAllDocumentAnalyses();
      if (allDocumentAnalyses && allDocumentAnalyses.length > 0) {
        console.log(`[BackgroundProcessor] Found ${allDocumentAnalyses.length} document analyses for profile requirements`);
        
        // Extract profile requirements from document analyses
        const profileRequirements: {field: string, importance: string, description: string}[] = [];
        
        for (const analysis of allDocumentAnalyses) {
          try {
            // The profileRequirements field should contain our data directly
            if (analysis.profileRequirements) {
              // Check if it's already an object with the fields we need
              const profileReqs = analysis.profileRequirements as any;
              
              if (Array.isArray(profileReqs)) {
                // Map the field structure
                for (const req of profileReqs) {
                  // Only add if it's not already in the list (deduplicate by fieldName)
                  if (!profileRequirements.some(pr => pr.field === req.fieldName)) {
                    profileRequirements.push({
                      field: req.fieldName,
                      importance: req.importance || 'recommended',
                      description: req.description || ''
                    });
                  }
                }
              }
            }
          } catch (parseError) {
            console.warn(`[BackgroundProcessor] Could not parse profile requirements for document ${analysis.documentId}:`, parseError);
          }
        }
        
        // If we found profile requirements in the analyses, use those
        if (profileRequirements.length > 0) {
          console.log(`[BackgroundProcessor] Extracted ${profileRequirements.length} profile requirements from document analyses`);
          this.analysisResults.set('profile_requirements', profileRequirements);
          return profileRequirements;
        }
      }
      
      // If we don't have profile requirements from analyses, get all approved documents
      const documents = await storage.getApprovedDocuments();
      
      // If we have documents, analyze them through the AI service
      if (documents && documents.length > 0) {
        console.log(`[BackgroundProcessor] Getting profile requirements using ${documents.length} documents`);
        
        // Call the AI service to get profile requirements
        const result = await aiService.getRequiredProfileFields();
        
        if (result.success && result.data) {
          // Cache the results for future use
          this.analysisResults.set('profile_requirements', result.data);
          return result.data;
        } else {
          const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to get profile requirements';
          throw new Error(errorMessage);
        }
      } else {
        console.warn('[BackgroundProcessor] No documents available for analysis');
        
        // Return a simplified set of requirements if no documents are available
        const fallbackRequirements = [
          { field: 'bio', importance: 'required', description: 'Artist biography' },
          { field: 'genre', importance: 'required', description: 'Music genre' },
          { field: 'location', importance: 'required', description: 'Geographic location' }
        ];
        
        this.analysisResults.set('profile_requirements', fallbackRequirements);
        return fallbackRequirements;
      }
    } catch (error) {
      console.error('[BackgroundProcessor] Error getting profile requirements:', error);
      
      // Use cached requirements if available, otherwise throw the error
      const cachedReqs = this.analysisResults.get('profile_requirements');
      if (cachedReqs) {
        console.log('[BackgroundProcessor] Returning cached profile requirements due to error');
        return cachedReqs;
      }
      
      throw error;
    }
  }
  
  /**
   * Get grant recommendations for a user
   * This method checks for cached recommendations in the database first
   */
  public async getGrantRecommendations(userId: number, artistId?: number): Promise<any[]> {
    try {
      // First, check the database for persisted recommendations
      const persistedRecommendations = await storage.getGrantRecommendationsForUser(userId, artistId);
      
      if (persistedRecommendations && persistedRecommendations.recommendations) {
        try {
          console.log(`[BackgroundProcessor] Using persisted grant recommendations for user ${userId}${artistId ? ` and artist ${artistId}` : ''}`);
          // The recommendations field should directly contain our data
          return persistedRecommendations.recommendations as any[];
        } catch (error) {
          console.warn(`[BackgroundProcessor] Could not use persisted recommendations:`, error);
        }
      }
      
      console.log(`[BackgroundProcessor] No persisted recommendations found, generating new ones for user ${userId}${artistId ? ` and artist ${artistId}` : ''}`);
      
      // Get the artist profile if an artistId was provided
      let artistProfile: any = { userId };
      
      if (artistId) {
        const artist = await storage.getArtist(artistId);
        if (artist) {
          artistProfile = {
            userId,
            genre: artist.genres?.join(', ') || '',
            careerStage: artist.careerStage || '',
            instrumentOrRole: artist.primaryInstrument || '',
            location: artist.location || '',
            projectType: artist.projectType || ''
          };
        }
      }
      
      // If no persisted recommendations, get them from the AI service
      const result = await aiService.getGrantRecommendations(artistProfile);
      
      if (result.success && result.data) {
        // Store the recommendations in the database for future use
        await storage.createOrUpdateGrantRecommendations({
          userId,
          artistId: artistId || null,
          recommendations: result.data,
          queryParams: { timestamp: new Date().toISOString() }
        });
        
        return result.data;
      } else {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : 'Failed to get grant recommendations';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`[BackgroundProcessor] Error getting grant recommendations:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const backgroundProcessor = BackgroundProcessor.getInstance();