import axios from 'axios';

interface AICompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
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

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.warn('Warning: DEEPSEEK_API_KEY environment variable is not set');
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

export async function answerQuestion(
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  try {
    // Optimize the system prompt to be concise and focused
    const systemPrompt = `You are a music grant specialist. Provide concise, helpful answers about music grants, funding, and applications. Format your responses in markdown for readability. Use bullet points for lists, ## for section headers, and ** for emphasis. Keep your answers brief but informative.`;
    
    // Optimize conversation history to only include the most recent exchanges (last 4 messages)
    const recentConversation = conversationHistory.slice(-4);
    
    // Convert the conversation history to the format expected by the API
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentConversation.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: question }
    ];
    
    const requestData: AICompletionRequest = {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 800, // Reduced for faster responses
      // Add a timeout to prevent long queries
      // Specify to generate directly without thinking too much
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