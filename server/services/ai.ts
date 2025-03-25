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
    const systemPrompt = `You are an expert grant proposal writer for musicians and artists. 
    Create a professional, well-structured grant proposal based on the following information.`;
    
    let userPrompt = `Write a detailed grant proposal for the following project:\n\n${projectDescription}`;
    
    if (grantName) {
      userPrompt += `\n\nThe grant to apply for is: ${grantName}`;
    }
    
    if (artistName) {
      userPrompt += `\n\nThe artist applying is: ${artistName}`;
    }
    
    if (proposalType) {
      userPrompt += `\n\nThis is specifically a ${proposalType} proposal.`;
    }
    
    userPrompt += `\n\nFormat your response in markdown with clear sections including: 
    - Project Summary
    - Artist Background
    - Project Goals & Objectives
    - Implementation Plan
    - Budget Overview
    - Expected Impact
    - Timeline`;
    
    const requestData: AICompletionRequest = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    };
    
    const response = await axios.post<AICompletionResponse>(
      API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating proposal:', error);
    throw new Error('Failed to generate proposal');
  }
}

export async function answerQuestion(
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  try {
    const systemPrompt = `You are a knowledgeable assistant specialized in music grants, funding opportunities, 
    and application processes for musicians and artists. Provide detailed, helpful, and accurate information. 
    Your responses should be concise but thorough.`;
    
    // Convert the conversation history to the format expected by the API
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];
    
    const requestData: AICompletionRequest = {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1024
    };
    
    const response = await axios.post<AICompletionResponse>(
      API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error answering question:', error);
    throw new Error('Failed to answer question');
  }
}