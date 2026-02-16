import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Post, User } from '../../types';

interface SearchResults {
  posts: Post[];
  users: User[];
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Search using embeddings
  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults({ posts: [], users: [] });
      return;
    }

    try {
      setLoading(true);
      
      // Search both posts and users using embeddings with lower threshold
      const [postsResponse, usersResponse] = await Promise.all([
        api.post('/search/posts', { query: searchQuery, threshold: 0.3, limit: 5 }),
        api.post('/search/users', { query: searchQuery, threshold: 0.3, limit: 5 })
      ]);

      setResults({
        posts: postsResponse.data.data.results || postsResponse.data.data || [],
        users: usersResponse.data.data.results || usersResponse.data.data || []
      });
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ posts: [], users: [] });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePostClick = (postId: string) => {
    setShowResults(false);
    setQuery('');
    navigate(`/post/${postId}`);
  };

  const handleUserClick = (userId: string) => {
    setShowResults(false);
    setQuery('');
    navigate(`/profile/${userId}`);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search posts and users... (min 3 chars)"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (results.posts.length > 0 || results.users.length > 0 || loading) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <>
              {/* Users Section */}
              {results.users.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Users
                  </div>
                  {results.users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleUserClick(user._id)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      {user.profileImage ? (
                        <img
                          src={
                            user.profileImage.startsWith('http')
                              ? user.profileImage
                              : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${user.profileImage}`
                          }
                          alt={user.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Posts Section */}
              {results.posts.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Posts
                  </div>
                  {results.posts.map((post) => (
                    <button
                      key={post._id}
                      onClick={() => handlePostClick(post._id)}
                      className="w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        {post.userId?.profileImage ? (
                          <img
                            src={
                              post.userId.profileImage.startsWith('http')
                                ? post.userId.profileImage
                                : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}${post.userId.profileImage}`
                            }
                            alt={post.userId.username}
                            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {post.userId?.username.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {post.userId?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {post.content}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* No Results */}
      {showResults && !loading && results.posts.length === 0 && results.users.length === 0 && query.length >= 3 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500 z-50">
          No results found. Try using more specific terms.
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
