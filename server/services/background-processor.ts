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
    console.log(`[BackgroundProcessor] Processing ${this.processingQueue.size} documents`);

    try {
      // Process each document in the queue by converting Set to Array
      const queueArray = Array.from(this.processingQueue);
      for (const documentId of queueArray) {
        // Skip if already processed
        if (this.analysisResults.get(`doc_${documentId}`)) {
          this.processingQueue.delete(documentId);
          continue;
        }

        try {
          // Update status to processing
          this.processingStatus.set(`doc_${documentId}`, 'processing');
          
          // Get document from storage
          const document = await storage.getDocument(documentId);
          
          if (!document) {
            console.warn(`[BackgroundProcessor] Document ${documentId} not found`);
            this.processingStatus.set(`doc_${documentId}`, 'not_found');
            this.processingQueue.delete(documentId);
            continue;
          }

          // Process the document
          const analysis = await this.analyzeDocument(document);
          
          // Store result
          this.analysisResults.set(`doc_${documentId}`, analysis);
          this.processingStatus.set(`doc_${documentId}`, 'completed');
          
          console.log(`[BackgroundProcessor] Completed analysis for document ${documentId}`);
        } catch (error) {
          console.error(`[BackgroundProcessor] Error processing document ${documentId}:`, error);
          this.processingStatus.set(`doc_${documentId}`, 'error');
        } finally {
          // Remove from queue regardless of outcome
          this.processingQueue.delete(documentId);
        }
      }
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
      // Get all approved documents from storage
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
}

// Export a singleton instance
export const backgroundProcessor = BackgroundProcessor.getInstance();