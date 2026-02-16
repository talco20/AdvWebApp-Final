import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { Post, Comment, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/Post/PostCard';

interface CommentForm {
  content: string;
}

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>();
  const [submitting, setSubmitting] = useState(false);

  const { data: post, isLoading: postLoading, refetch: refetchPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Post }>(`/posts/${postId}`);
      return response.data.data;
    },
  });

  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Comment>>(`/comments/post/${postId}`);
      return response.data;
    },
  });

  const onSubmit = async (data: CommentForm) => {
    try {
      setSubmitting(true);
      await api.post('/comments', {
        postId,
        content: data.content,
      });
      reset();
      refetchComments();
      refetchPost();
    } catch (error) {
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      refetchComments();
      refetchPost();
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  if (postLoading || commentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Post not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Post */}
      <PostCard post={post} onUpdate={() => navigate('/')} />

      {/* Comments Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Comments ({comments?.data.length || 0})
        </h2>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
          <textarea
            {...register('content', { 
              required: 'Comment cannot be empty',
              maxLength: {
                value: 500,
                message: 'Comment must be less than 500 characters'
              }
            })}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Write a comment..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        {comments && comments.data.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-4">
            {comments?.data.map((comment: Comment) => (
              <div key={comment._id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {comment.userId.profileImage ? (
                      <img
                        src={
                          comment.userId.profileImage.startsWith('http')
                            ? comment.userId.profileImage
                            : `${process.env.REACT_APP_API_URL}${comment.userId.profileImage}`
                        }
                        alt={comment.userId.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                        {comment.userId.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{comment.userId.username}</p>
                      <p className="text-gray-700 mt-1">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {user?._id === comment.userId._id && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;

