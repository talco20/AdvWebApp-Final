import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Post, PaginatedResponse } from '../types';
import PostCard from '../components/Post/PostCard';

const Home: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['posts', page],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Post>>(`/posts?page=${page}&limit=10`);
      return response.data;
    },
  });

  const handleLoadMore = () => {
    if (data && page < data.pagination.pages) {
      setPage(page + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load posts. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Home Feed</h1>

      {data && data.data.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">No posts yet. Be the first to post!</p>
          <Link
            to="/create-post"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create Post
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.data.map((post) => (
            <PostCard key={post._id} post={post} onUpdate={refetch} />
          ))}

          {data && page < data.pagination.pages && (
            <div className="text-center py-6">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Load More
              </button>
            </div>
          )}

          {data && page === data.pagination.pages && data.data.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              You've reached the end
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;


