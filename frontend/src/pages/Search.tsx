import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { SearchResult } from '../types';

interface SearchForm {
  query: string;
}

const Search: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<SearchForm>();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [repostingIndex, setRepostingIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (data: SearchForm) => {
    try {
      setLoading(true);
      setError('');
      setSearched(true);

      const response = await api.post('/search/news', { query: data.query });
      setResults(response.data.data.results);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to search';
      
      // Provide helpful message for OpenAI quota errors
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        setError('⚠️ OpenAI API quota exceeded. Please update your API key in the backend .env file. See README.md for instructions.');
      } else if (errorMessage.includes('API key')) {
        setError('⚠️ OpenAI API key not configured. Please add OPENAI_API_KEY to your backend .env file.');
      } else {
        setError(errorMessage);
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRepost = async (result: SearchResult, index: number) => {
    try {
      setRepostingIndex(index);
      
      // Create post content from search result
      const content = `📰 ${result.title}\n\n${result.summary}\n\n🔗 Category: ${result.category}${result.url ? `\n🌐 Source: ${result.url}` : ''}`;
      
      await api.post('/posts', { content });
      
      // Show success message
      alert('✅ News reposted successfully!');
      
      // Optionally redirect to home
      navigate('/');
    } catch (err: any) {
      console.error('Failed to repost:', err);
      alert('❌ Failed to repost. Please try again.');
    } finally {
      setRepostingIndex(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Technology: 'bg-blue-100 text-blue-800',
      Politics: 'bg-red-100 text-red-800',
      Business: 'bg-green-100 text-green-800',
      Sports: 'bg-yellow-100 text-yellow-800',
      Entertainment: 'bg-purple-100 text-purple-800',
      Science: 'bg-indigo-100 text-indigo-800',
      Health: 'bg-pink-100 text-pink-800',
      World: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800 mb-1">Real-Time Web Search</h3>
            <p className="text-sm text-blue-700">
              This feature uses OpenAI's Web Search tool to find real, current news articles from the internet with actual URLs and publication dates.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">AI-Powered News Search</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('query', { 
                required: 'Please enter a search query',
                minLength: {
                  value: 3,
                  message: 'Query must be at least 3 characters'
                }
              })}
              type="text"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg"
              placeholder="Search for news topics... (e.g., 'latest AI developments')"
            />
            {errors.query && (
              <p className="mt-1 text-sm text-red-600">{errors.query.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No results found. Try a different search query.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
          {results.map((result, index) => (
            <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              {/* Header with title and category */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 flex-1">{result.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(result.category)} ml-3`}>
                  {result.category}
                </span>
              </div>

              {/* Meta information */}
              <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(result.publishedDate)}
                </div>
                {result.source && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    {result.source}
                  </div>
                )}
              </div>

              {/* Summary */}
              <p className="text-gray-700 mb-4">{result.summary}</p>

              {/* Footer with relevance, link, and repost button */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Relevance:</span> {result.relevance}
                  </p>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Read full article
                    </a>
                  )}
                </div>
                
                <button
                  onClick={() => handleRepost(result, index)}
                  disabled={repostingIndex === index}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {repostingIndex === index ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Reposting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Repost</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;

