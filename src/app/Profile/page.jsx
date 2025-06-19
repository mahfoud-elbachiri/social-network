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
  const [isPrivateView, setIsPrivateView] = useState(false);

  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('id');

 
  const {
    showComments,
    comments,
    loadingComments,
    handleComment,
    handleSendComment
  } = useComments(setPosts);

  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const data = await userApi.fetchProfile(targetUserId);
      console.log('Profile data received:', data); 
      
      if (data && data.status) {
        setProfile(data.profile);
        setPosts(data.posts || []);
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
        <Header targetUserId= {targetUserId}/>
        <div>Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header targetUserId= {targetUserId}/>
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
        <Header targetUserId= {targetUserId}/>
        <div>Profile not found</div>
      </div>
    );
  }

  return (
    <div>
      <Header targetUserId={targetUserId}/>

      <div className="container">
        {/* Profile Info Sidebar */}
        <aside className="sidebar">
          <ProfileCard
            profile={profile}
            isOwnProfile={isOwnProfile}
            onPrivacyToggle={togglePrivacy}
            updatingPrivacy={updatingPrivacy}
            isPrivateView={isPrivateView}
            targetid={targetUserId}
          />
        </aside>
        
        {/* Main Content - Posts */}
        <main className="main-content" id="main-content">
          <div className="profile-posts-header">
            <h3>Posts by {profile.first_name} {isPrivateView && !isOwnProfile ? '(Private)' : `(${posts.length})`}</h3>
          </div>

          <div className="posts-container">
            {isPrivateView && !isOwnProfile ? (
              <PrivatePostsMessage />
            ) : (
              <>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.ID}
                      post={post}
                      currentUserId={null}
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
          isOwnProfile={isOwnProfile}
          targetUserId={targetUserId} 
        />
      </div>
    </div>
  );
}