import axios from 'axios';
import { storage } from '../storage';
import { Document } from '@shared/schema';

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

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.warn('Warning: DEEPSEEK_API_KEY environment variable is not set');
}

// Function to get relevant documents based on the question
async function getRelevantDocuments(question: string) {
  try {
    // Get all documents from the database (no approval needed)
    const allDocuments = await storage.getAllDocuments();
    
    if (!allDocuments || allDocuments.length === 0) {
      return [];
    }
    
    // Simple keyword matching for document relevance
    // In a production environment, this would be replaced with proper vector embeddings and similarity search
    const keywords = extractKeywords(question.toLowerCase());
    
    // Score each document based on keyword matches
    const scoredDocuments = allDocuments.map(doc => {
      const docText = `${doc.title} ${doc.content}`.toLowerCase();
      const score = keywords.reduce((score, keyword) => {
        return score + (docText.includes(keyword) ? 1 : 0);
      }, 0);
      
      return { ...doc, score };
    });
    
    // Sort by relevance score and return the most relevant ones
    return scoredDocuments
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Limit to top 3 documents
  } catch (error) {
    console.error('Error retrieving relevant documents:', error);
    return []; // Return empty array on error
  }
}

// Helper function to extract potential keywords from a question
function extractKeywords(question: string): string[] {
  // Remove common words and punctuation
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                    'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 
                    'by', 'about', 'like', 'through', 'over', 'before', 'after', 
                    'between', 'under', 'above', 'how', 'what', 'why', 'where', 
                    'when', 'who', 'which', 'can', 'could', 'should', 'would', 
                    'will', 'shall', 'may', 'might', 'must', 'of', 'from'];
  
  // Split by spaces and filter out stop words and short words
  return question
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(' ')
    .map(word => word.trim())
    .filter(word => word.length > 2 && !stopWords.includes(word));
}

export async function generateProposal(
  projectDescription: string,
  grantName?: string,
  artistName?: string,
  proposalType?: string
): Promise<string> {
  try {
    // Optimized system prompt for clarity and speed
    const systemPrompt = `You are an expert grant proposal writer for musicians. Create a professional, well-structured grant proposal using markdown formatting. Use ## for section headers, bullet points for lists, and bold for key points.`;
    
    // Streamlined user prompt with clear structure requirements
    let userPrompt = `Write a concise grant proposal for this project:\n\n${projectDescription}`;
    
    if (grantName) {
      userPrompt += `\n\nGrant: ${grantName}`;
    }
    
    if (artistName) {
      userPrompt += `\n\nArtist: ${artistName}`;
    }
    
    if (proposalType) {
      userPrompt += `\n\nType: ${proposalType} proposal`;
    }
    
    userPrompt += `\n\nUse markdown format with these sections:
## Project Summary
## Artist Background
## Goals & Objectives
## Implementation Plan
## Budget Overview
## Expected Impact
## Timeline

Keep your response focused and professional. Use formatting to enhance readability.`;
    
    const requestData: AICompletionRequest = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500 // Reduced for faster response
    };
    
    // Use a timeout to prevent hanging requests
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 15000); // 15 second timeout
    
    const response = await axios.post<AICompletionResponse>(
      API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        signal: timeoutController.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating proposal:', error);
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try a shorter or simpler project description.');
    }
    throw new Error('Failed to generate proposal');
  }
}

export async function getGrantRecommendations(
  artistProfile: {
    genre: string;
    careerStage: string;
    instrumentOrRole: string;
    location?: string;
    projectType?: string;
  }
): Promise<GrantRecommendation[]> {
  // Check if the DeepSeek API key is available
  if (!DEEPSEEK_API_KEY) {
    console.warn('DEEPSEEK_API_KEY is not set, using fallback recommendations');
    return getFallbackRecommendations(artistProfile);
  }
  
  try {
    // System prompt for defining the assistant's role and behavior
    const systemPrompt = `You are a grant funding expert for musicians. You help artists find grants that match their profile.
Your task is to provide tailored grant recommendations in a structured JSON format based on the artist profile.`;

    // User prompt that includes all the criteria for matching
    const userPrompt = `Recommend music grants for an artist with this profile:
- Genre: ${artistProfile.genre}
- Career Stage: ${artistProfile.careerStage}
- Role/Instrument: ${artistProfile.instrumentOrRole}
${artistProfile.location ? `- Location: ${artistProfile.location}` : ''}
${artistProfile.projectType ? `- Project Type: ${artistProfile.projectType}` : ''}

Provide 3-5 grant recommendations in this exact JSON structure:
[
  {
    "id": "unique-id",
    "name": "Grant Name",
    "organization": "Organization Name",
    "amount": "$1,000 - $5,000",
    "deadline": "2025-06-30 or Rolling",
    "description": "Brief description of the grant",
    "requirements": ["Requirement 1", "Requirement 2"],
    "eligibility": ["Eligibility criteria 1", "Eligibility criteria 2"],
    "url": "https://example.org/grant",
    "matchScore": 95
  }
]

The matchScore should range from 50-100 and represent how well the grant matches the artist profile.
Make sure all recommendations are real grants with valid URLs and current information.`;

    const requestData: AICompletionRequest = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      max_tokens: 1800, // Allowing enough tokens for 5 detailed recommendations
    };
    
    // Use a timeout to prevent hanging requests
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 15000); // 15 second timeout
    
    const response = await axios.post<AICompletionResponse>(
      API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        signal: timeoutController.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    // Parse the response content as JSON
    const content = response.data.choices[0].message.content;
    
    // Sometimes the AI might include markdown code blocks, so we need to handle that
    const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const recommendations = JSON.parse(jsonContent) as GrantRecommendation[];
      return recommendations;
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      console.log('Falling back to backup recommendations');
      return getFallbackRecommendations(artistProfile);
    }
  } catch (error) {
    console.error('Error getting grant recommendations:', error);
    console.log('Using fallback recommendations due to API error');
    return getFallbackRecommendations(artistProfile);
  }
}

// Provides pre-defined fallback grant recommendations when AI service is unavailable
function getFallbackRecommendations(artistProfile: {
  genre: string;
  careerStage: string;
  instrumentOrRole: string;
  location?: string;
  projectType?: string;
}): GrantRecommendation[] {
  // Common grants that are available to various musicians
  const recommendations: GrantRecommendation[] = [
    {
      id: "nsf-1",
      name: "Artist Development Grant",
      organization: "National Foundation for the Arts",
      amount: "$5,000 - $15,000",
      deadline: "March 15, 2025",
      description: "Supports the creative development of artists across all musical genres to advance their careers through recordings, performances, or new works.",
      requirements: [
        "Project proposal with timeline", 
        "Budget breakdown", 
        "Work samples"
      ],
      eligibility: [
        "Professional musicians with established work history", 
        "U.S. citizens or permanent residents", 
        "Not enrolled in degree program"
      ],
      url: "https://www.arts.gov/grants",
      matchScore: 85
    },
    {
      id: "mcf-1",
      name: "Music Creation Fund",
      organization: "Chamber Music America",
      amount: "$10,000 - $20,000",
      deadline: "October 1, 2025",
      description: "Commissioning grants to support the creation of new chamber works and assist with the costs of rehearsing and performing these works.",
      requirements: [
        "Detailed project description", 
        "Composer's resume", 
        "Sample recordings", 
        "Performance plan"
      ],
      eligibility: [
        "Professional ensembles and composers", 
        "Organizations with 501(c)(3) status", 
        "Demonstrated commitment to chamber music"
      ],
      url: "https://www.chamber-music.org/programs/grant-programs",
      matchScore: 75
    },
    {
      id: "mpf-2",
      name: "Touring & Professional Development Grant",
      organization: "Music Performance Fund",
      amount: "$2,000 - $7,500",
      deadline: "Rolling",
      description: "Provides funding for live music performances in public spaces, schools, and places where traditional funding is not readily available.",
      requirements: [
        "Performance schedule and venues", 
        "Public engagement component", 
        "Marketing plan"
      ],
      eligibility: [
        "Professional musicians", 
        "Community-focused projects", 
        "Projects that provide free performances to the public"
      ],
      url: "https://musicpf.org/grants/",
      matchScore: 80
    }
  ];
  
  // Add genre-specific recommendations
  if (artistProfile.genre.toLowerCase().includes('jazz')) {
    recommendations.push({
      id: "jazz-1",
      name: "Jazz Performance Grant",
      organization: "Jazz Forward Coalition",
      amount: "$3,000 - $8,000",
      deadline: "September 30, 2025",
      description: "Supports jazz artists in creating and presenting original work through performances, workshops, and community engagement.",
      requirements: [
        "Project narrative", 
        "Performance history", 
        "Budget", 
        "Marketing plan"
      ],
      eligibility: [
        "Professional jazz musicians", 
        "Original composition component", 
        "Public performance component"
      ],
      url: "https://jazzforward.org/grants",
      matchScore: 95
    });
  } else if (artistProfile.genre.toLowerCase().includes('classical')) {
    recommendations.push({
      id: "classical-1",
      name: "Classical Commissioning Program",
      organization: "New Music USA",
      amount: "$5,000 - $15,000",
      deadline: "May 1, 2025",
      description: "Supports the creation of new classical music compositions and their premiere performances.",
      requirements: [
        "Commissioning contract", 
        "Composer biography", 
        "Project timeline", 
        "Performance plans"
      ],
      eligibility: [
        "U.S.-based performers commissioning new work", 
        "Established composers", 
        "Planned public performance"
      ],
      url: "https://newmusicusa.org/grants/",
      matchScore: 92
    });
  }
  
  // Add career stage specific recommendations
  if (artistProfile.careerStage.toLowerCase().includes('emerging')) {
    recommendations.push({
      id: "emerging-1",
      name: "Emerging Artist Fellowship",
      organization: "Creative Capital",
      amount: "$10,000 - $25,000",
      deadline: "February 28, 2025",
      description: "Supports innovative projects from emerging artists working at the intersection of musical performance, technology, and social practice.",
      requirements: [
        "Project proposal", 
        "Timeline", 
        "Budget", 
        "Work samples", 
        "Artist statement"
      ],
      eligibility: [
        "Artists in early career stages", 
        "Innovative or boundary-pushing work", 
        "U.S. citizen or permanent resident"
      ],
      url: "https://creative-capital.org/grants",
      matchScore: 90
    });
  }
  
  // Adjust match scores based on artist profile
  return recommendations.map(rec => {
    let adjustedScore = rec.matchScore;
    
    // Calculate personalized match score based on artist profile
    // Just some basic logic for demonstration
    if (rec.name.toLowerCase().includes(artistProfile.genre.toLowerCase())) {
      adjustedScore += 5;
    }
    
    if (rec.name.toLowerCase().includes(artistProfile.instrumentOrRole.toLowerCase())) {
      adjustedScore += 5;
    }
    
    // Cap the score at 100
    return {
      ...rec,
      matchScore: Math.min(adjustedScore, 100)
    };
  });
}

export async function answerQuestion(
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  try {
    // Retrieve knowledge documents
    const relevantDocuments = await getRelevantDocuments(question);
    
    // Create context from relevant documents
    let documentContext = '';
    if (relevantDocuments.length > 0) {
      documentContext = "I'll refer to the following information to answer your question:\n\n";
      
      // Add only the most relevant content to avoid context overflow
      relevantDocuments.slice(0, 2).forEach(doc => {
        documentContext += `From "${doc.title}":\n${doc.content.substring(0, 600)}...\n\n`;
      });
    }
    
    // Base system prompt
    let systemPrompt = `You are a music grant specialist. Provide concise, helpful answers about music grants, funding, and applications. Format your responses in markdown for readability. Use bullet points for lists, ## for section headers, and ** for emphasis. Keep your answers brief but informative.`;
    
    // Add document instructions if we have relevant docs
    if (relevantDocuments.length > 0) {
      systemPrompt += `\n\nI have access to a knowledge base with information about music grants and funding. If the information provided doesn't directly answer the question, I'll rely on my general knowledge.`;
    }
    
    // Optimize conversation history to only include the most recent exchanges (last 3 messages to save context)
    const recentConversation = conversationHistory.slice(-3);
    
    // Convert the conversation history to the format expected by the API
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add relevant document context if available
    if (documentContext) {
      messages.push({ role: 'system' as const, content: documentContext });
    }
    
    // Add conversation history as messages
    for (const msg of recentConversation) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Add the current question
    messages.push({ role: 'user', content: question });
    
    const requestData: AICompletionRequest = {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 800, // Reasonable length for most answers
    };
    
    // Use a timeout to prevent hanging requests
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 10000); // 10 second timeout
    
    const response = await axios.post<AICompletionResponse>(
      API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        signal: timeoutController.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error answering question:', error);
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try a shorter or simpler question.');
    }
    throw new Error('Failed to answer question');
  }
}