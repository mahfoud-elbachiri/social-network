'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';

 
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import ProfileStats from '@/components/ProfileStats';
import ProfileCard from '@/components/ProfileCard';
import PrivatePostsMessage from '@/components/PrivatePostsMessage';
import { useComments } from '@/hooks/useComments';
import { userApi } from '@/utils/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isPrivatePosts, setIsPrivatePosts] = useState(false);
  const [isPrivateView, setIsPrivateView] = useState(false);

  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('id') || null;

 
  const {
    showComments,
    comments,
    loadingComments,
    handleComment,
    handleSendComment
  } = useComments(setPosts);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const data = await userApi.fetchProfile(targetUserId);
      
      if (data && data.status) {
        setProfile(data.profile);
        setIsOwnProfile(data.is_own_profile || false);
        setIsPrivateView(data.is_private_view || false);
        setError(null);
      } else {
        console.error('Profile fetch failed:', data);
        setError(data?.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      if (targetUserId) {
        const data = await userApi.fetchPostsOfUser(targetUserId);
        
        if (data && data.status) {
          if (data.is_private) {
            // This is a private profile that we can't access
            setIsPrivatePosts(true);
            setPosts([]);
          } else {
            // Normal posts or empty posts from a public profile
            setIsPrivatePosts(false);
            setPosts(data.posts || []);
          }
        } else {
          console.error('Posts fetch failed:', data);
          setIsPrivatePosts(false);
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setIsPrivatePosts(false);
      setPosts([]);
    }
  };

  const togglePrivacy = async () => {
    if (updatingPrivacy || !isOwnProfile) return;
    
    setUpdatingPrivacy(true);
    try {
      const data = await userApi.updatePrivacy(!profile.is_private);
      
      if (data && data.status) {
        setProfile(prev => ({
          ...prev,
          is_private: !prev.is_private
        }));
      } else {
        setError(data?.error || 'Failed to update privacy setting');
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
      setError('Failed to update privacy setting');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div>Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="container">
          <main className="main-content">
            <div>Error: {error}</div>
          </main>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Header />
        <div>Profile not found</div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div className="container">
        {/* Profile Info Sidebar */}
        <aside className="sidebar">
          <ProfileCard
            profile={profile}
            isOwnProfile={isOwnProfile}
            onPrivacyToggle={togglePrivacy}
            updatingPrivacy={updatingPrivacy}
            isPrivateView={isPrivateView}
            isPrivatePosts={isPrivatePosts}
            targetid={targetUserId}
          />
        </aside>
        
        {/* Main Content - Posts */}
        <main className="main-content" id="main-content">
          <div className="profile-posts-header">
            <h3>Posts by {profile.first_name} {isPrivatePosts ? '(Private)' : isPrivateView && !isOwnProfile ? '(Private)' : `(${posts.length})`}</h3>
          </div>

          <div className="posts-container">
            {isPrivatePosts ? (
              <PrivatePostsMessage />
            ) : (
              <>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.ID}
                      post={post}
                      showComments={showComments}
                      comments={comments}
                      loadingComments={loadingComments}
                      onCommentClick={handleComment}
                      onSendComment={handleSendComment}
                    />
                  ))
                ) : (
                  <div className="post">
                    <p>No posts found for this user</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <ProfileStats 
          postsCount={posts.length} 
          isPrivateView={isPrivateView}
          isPrivatePosts={isPrivatePosts}
          isOwnProfile={isOwnProfile}
          targetUserId={targetUserId} 
        />
      </div>
    </div>
  );
}