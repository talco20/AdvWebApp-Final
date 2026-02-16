import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [loading, setLoading] = useState(false);
  
  // API URL with fallback
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const handleLike = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/posts/${post._id}/like`);
      setIsLiked(response.data.data.liked);
      setLikesCount(response.data.data.likesCount);
    } catch (error) {
      console.error('Failed to like post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/posts/${post._id}`);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Link to={`/profile/${post.userId._id}`} className="flex items-center space-x-3">
          {post.userId.profileImage ? (
            <img
              src={
                post.userId.profileImage.startsWith('http')
                  ? post.userId.profileImage
                  : `${API_URL}${post.userId.profileImage}`
              }
              alt={post.userId.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
              {post.userId.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{post.userId.username}</p>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </Link>

        {user?._id === post.userId._id && (
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="text-gray-800 whitespace-pre-wrap">
          {post.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, index) => {
            // Check if this part is a URL
            if (/^https?:\/\//.test(part)) {
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part}
                </a>
              );
            }
            // Regular text
            return <span key={index}>{part}</span>;
          })}
        </div>

        {post.imageUrl && (
          <Link to={`/post/${post._id}`}>
            <img
              src={`${API_URL}${post.imageUrl}`}
              alt="Post"
              className="w-full rounded-lg mt-4 max-h-96 object-cover"
              onError={(e) => {
                console.error('Image failed to load:', `${API_URL}${post.imageUrl}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-6 pt-4 border-t">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center space-x-2 ${
            isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
          } disabled:opacity-50`}
        >
          <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm font-medium">{likesCount}</span>
        </button>

        <Link
          to={`/post/${post._id}`}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">{post.commentsCount} Comments</span>
        </Link>
      </div>
    </div>
  );
};

export default PostCard;

