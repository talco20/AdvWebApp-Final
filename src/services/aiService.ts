import OpenAI from 'openai';
import axios from 'axios';
import { config } from '../config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface NewsSearchResult {
  title: string;
  summary: string;
  relevance: string;
  category: string;
  url?: string;
  publishedDate?: string;
  source?: string;
}

/**
 * Sanitize user input to prevent injection attacks
 * @param input - Raw user input
 * @returns Sanitized input
 */
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: query must be a non-empty string');
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Check length constraints
  if (sanitized.length < 2) {
    throw new Error('Query too short: minimum 2 characters required');
  }
  if (sanitized.length > 500) {
    throw new Error('Query too long: maximum 500 characters allowed');
  }

  // Remove control characters and non-printable characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Remove potential script tags and HTML
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]+>/g, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Basic XSS prevention - escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
};

/**
 * Sanitize API response text (less strict than user input)
 * @param text - Text from API response
 * @param maxLength - Maximum allowed length (default: 2000)
 * @returns Sanitized text
 */
const sanitizeApiText = (text: string, maxLength: number = 2000): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = text.trim();

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  // Remove control characters and non-printable characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Remove potential script tags (but keep other HTML for now)
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
};

/**
 * Search for real news using OpenAI's Web Search tool
 * @param query - User's search query (will be sanitized)
 * @returns Array of real news results from web search
 */
export const searchNews = async (query: string): Promise<NewsSearchResult[]> => {
  try {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Sanitize user input
    const sanitizedQuery = sanitizeInput(query);
    console.log(`Searching web for: "${sanitizedQuery}" using OpenAI Web Search...`);

    // Use OpenAI Responses API with web_search tool
    const response = await (openai as any).responses.create({
      model: 'gpt-4o-mini', // gpt-4o-mini is cheaper and supports web search
      tools: [
        { type: 'web_search' }
      ],
      input: `Find 5 recent news articles about: ${sanitizedQuery}

For each article found, provide:
1. Title - The actual headline
2. Summary - A 2-3 sentence summary
3. Relevance - Why it's relevant to the search
4. Category - One of: Politics, Technology, Business, Sports, Entertainment, Science, Health, or World
5. URL - The actual article URL
6. PublishedDate - Publication date in ISO format
7. Source - The news source name

Format the response as a JSON object with an "articles" array.`,
    });

    console.log('Web search completed');
    console.log('Full Response Object:', JSON.stringify(response, null, 2));
    
    // Extract the output
    const outputText = response.output_text || response.output || '';
    
    console.log('Output Text:', outputText);
    console.log('Output Text Length:', outputText.length);
    
    if (!outputText) {
      console.error('No output text in response. Response keys:', Object.keys(response));
      throw new Error('No response from OpenAI Web Search');
    }

    // Try to parse JSON from the response
    let results: NewsSearchResult[] = [];
    
    try {
      console.log('Attempting to parse JSON from response...');
      
      // Try to extract JSON from the response
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('Found JSON in response');
        console.log('JSON String:', jsonMatch[0].substring(0, 500) + '...');
        
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON');
        console.log('Parsed Object Keys:', Object.keys(parsed));
        
        // Handle different response formats
        if (Array.isArray(parsed)) {
          console.log('Response is an array, length:', parsed.length);
          results = parsed;
        } else if (parsed.articles && Array.isArray(parsed.articles)) {
          console.log('Found "articles" array, length:', parsed.articles.length);
          results = parsed.articles;
        } else if (parsed.results && Array.isArray(parsed.results)) {
          console.log('Found "results" array, length:', parsed.results.length);
          results = parsed.results;
        } else if (parsed.news && Array.isArray(parsed.news)) {
          console.log('Found "news" array, length:', parsed.news.length);
          results = parsed.news;
        } else {
          console.log('Extracting objects with "title" field from parsed object');
          // Extract any array of objects with title field
          results = Object.values(parsed).filter((item: any) => 
            item && typeof item === 'object' && item.title
          ) as NewsSearchResult[];
          console.log('Extracted results count:', results.length);
        }
        
        console.log('Raw results before sanitization:', JSON.stringify(results, null, 2));
      } else {
        console.warn('No JSON found in response text');
      }
    } catch (parseError: any) {
      console.error('Failed to parse JSON from response:', parseError.message);
      console.error('Problematic text:', outputText.substring(0, 500));
      // If JSON parsing fails, return empty array
      results = [];
    }

    console.log(`Results count before sanitization: ${results.length}`);

    // Sanitize the results and normalize field names (OpenAI uses Title/Summary/URL instead of title/summary/url)
    results = results.map((result: any, index) => {
      // Normalize field names - OpenAI returns Title, Summary, URL, PublishedDate (capital letters)
      const normalizedResult = {
        title: result.title || result.Title,
        summary: result.summary || result.Summary,
        relevance: result.relevance || result.Relevance,
        category: result.category || result.Category,
        url: result.url || result.URL,
        publishedDate: result.publishedDate || result.PublishedDate,
        source: result.source || result.Source,
      };
      
      console.log(`Sanitizing result ${index + 1}:`, {
        title: normalizedResult.title,
        summary: normalizedResult.summary?.substring(0, 50) + '...',
        url: normalizedResult.url,
        source: normalizedResult.source
      });
      
      return {
        title: sanitizeApiText(normalizedResult.title || 'Untitled', 200),
        summary: sanitizeApiText(normalizedResult.summary || 'No summary available', 1000),
        relevance: sanitizeApiText(normalizedResult.relevance || 'Related to search query', 500),
        category: normalizedResult.category || 'World',
        url: normalizedResult.url || '',
        publishedDate: normalizedResult.publishedDate || new Date().toISOString(),
        source: sanitizeApiText(normalizedResult.source || 'Unknown', 100),
      };
    });

    console.log(`Found ${results.length} news articles after sanitization`);
    console.log('Final results:', JSON.stringify(results, null, 2));

    return results.slice(0, 5);
  } catch (error: any) {
    console.error('OpenAI Web Search Error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('Invalid input')) {
      throw error; // Re-throw validation errors
    }
    
    if (error.message?.includes('model') || error.status === 404) {
      throw new Error('Model not available. Please ensure your OpenAI API key has access to gpt-4o-mini or gpt-4o.');
    }
    
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key configuration.');
    }
    
    throw new Error(error.message || 'Error searching news with OpenAI Web Search');
  }
};


/**
 * Analyze content using AI
 * @param content - Content to analyze
 * @returns Analysis result
 */
export const analyzeContent = async (content: string): Promise<string> => {
  try {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a content analyzer that provides insights about text content.',
        },
        {
          role: 'user',
          content: `Analyze the following content and provide a brief summary and key topics:\n\n${content}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || 'No analysis available';
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    throw new Error(error.message || 'Error analyzing content');
  }
};

/**
 * Generate content suggestions based on a topic
 * @param topic - Topic to generate suggestions for
 * @returns Array of content suggestions
 */
export const generateContentSuggestions = async (topic: string): Promise<string[]> => {
  try {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a creative content suggestion assistant.',
        },
        {
          role: 'user',
          content: `Generate 5 engaging post ideas about: ${topic}. Return as a JSON array of strings.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    return parsed.suggestions || parsed.ideas || Object.values(parsed).flat();
  } catch (error: any) {
    console.error('AI Suggestions Error:', error);
    throw new Error(error.message || 'Error generating suggestions');
  }
};

