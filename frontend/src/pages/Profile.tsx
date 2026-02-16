import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { User, Post, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/Post/PostCard';
import ImageUpload from '../components/Upload/ImageUpload';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [uploading, setUploading] = useState(false);

  const isOwnProfile = currentUser?._id === userId;

  const { data: user, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: User }>(`/users/${userId}`);
      setUsername(response.data.data.username);
      return response.data.data;
    },
  });

  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Post>>(`/users/${userId}/posts`);
      return response.data;
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/users/me/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(response.data.data.user);
      refetchUser();
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateUsername = async () => {
    try {
      const response = await api.put('/users/me', { username });
      updateUser(response.data.data);
      refetchUser();
      setIsEditing(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update username');
    }
  };

  if (userLoading || postsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start space-x-6">
          {isOwnProfile ? (
            <div>
              <p className="text-xs text-gray-500 text-center mb-2">Click to change</p>
              <ImageUpload
                currentImage={user.profileImage}
                onImageSelect={handleImageUpload}
                uploading={uploading}
                size="md"
                variant="circle"
              />
            </div>
          ) : (
            <div>
              {user.profileImage ? (
                <img
                  src={
                    user.profileImage.startsWith('http')
                      ? user.profileImage
                      : `${process.env.REACT_APP_API_URL}${user.profileImage}`
                  }
                  alt={user.username}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={handleUpdateUsername}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setUsername(user.username);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <p className="text-gray-600 mt-1">{user.email}</p>
            <p className="text-sm text-gray-500 mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isOwnProfile ? 'Your Posts' : `${user.username}'s Posts`}
        </h2>

        {posts && posts.data.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts?.data.map((post) => (
              <PostCard key={post._id} post={post} onUpdate={refetchPosts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

