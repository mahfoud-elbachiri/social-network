import { useState } from 'react';
import { commentApi } from '../utils/api';

export const useComments = (setPosts) => {
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

  const fetchCommentsForPost = async (postId) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    
    try {
      const data = await commentApi.fetchComments(postId);
      
      if (data && (data.error || data.status === false)) {
        console.error('Error fetching comments:', data.error);
      } else {
        setComments(prev => ({
          ...prev,
          [postId]: Array.isArray(data) ? data : []
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleComment = async (e) => {
    const postId = e.target.getAttribute('posteid');
    
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    if (!showComments[postId] && !comments[postId]) {
      await fetchCommentsForPost(postId);
    }
  };

  const handleSendComment = async (postId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const data = await commentApi.sendComment(postId, commentText);

      if (data && data.status) {
        await fetchCommentsForPost(postId);
        
        // Update post comment count
        if (setPosts) {
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.ID == postId 
                ? { ...post, Nembre: post.Nembre + 1 }
                : post
            )
          );
        }
      } else {
        console.error('Error sending comment:', data?.error);
      }
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  return {
    showComments,
    comments,
    loadingComments,
    handleComment,
    handleSendComment,
    fetchCommentsForPost
  }
}