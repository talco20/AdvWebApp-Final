import OpenAI from 'openai';
import { config } from '../config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Generate embeddings for text using OpenAI's embedding model
 * @param text - Text to generate embeddings for
 * @returns Array of numbers representing the embedding vector
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for embedding generation');
    }

    // Clean and prepare text for embedding
    const cleanedText = text.trim().substring(0, 8000); // OpenAI has a limit

    console.log(`Generating embedding for text (${cleanedText.length} chars)...`);

    // Use OpenAI's embedding model (text-embedding-3-small is cost-effective)
    // text-embedding-3-small produces 1536-dimensional vectors
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanedText,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;
    console.log(`Generated embedding with ${embedding.length} dimensions`);

    return embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embedding for a post (content + metadata)
 * Creates a searchable representation of the post
 * @param content - Post content
 * @param username - Author username (optional)
 * @returns Embedding vector
 */
export const generatePostEmbedding = async (
  content: string,
  username?: string
): Promise<number[]> => {
  try {
    // Combine content with metadata for better semantic search
    let textToEmbed = content;
    if (username) {
      textToEmbed = `Author: ${username}\nContent: ${content}`;
    }

    return await generateEmbedding(textToEmbed);
  } catch (error: any) {
    console.error('Error generating post embedding:', error);
    throw error;
  }
};

/**
 * Generate embedding for a user profile
 * Creates a searchable representation of the user
 * @param username - User's username
 * @param email - User's email
 * @returns Embedding vector
 */
export const generateUserEmbedding = async (
  username: string,
  email: string
): Promise<number[]> => {
  try {
    // Combine user information for embedding
    const textToEmbed = `Username: ${username}\nEmail: ${email}`;
    
    return await generateEmbedding(textToEmbed);
  } catch (error: any) {
    console.error('Error generating user embedding:', error);
    throw error;
  }
};

/**
 * Calculate cosine similarity between two vectors
 * Used for measuring similarity between embeddings
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Similarity score between -1 and 1 (higher is more similar)
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
};
