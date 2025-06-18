'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';


import ProfileStats from '@/components/ProfileStats'; 
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import { useComments } from '@/hooks/useComments';
import { userApi } from '@/utils/api';
import FollowButton from '@/components/FollowButton';

const ProfileCard = ({ profile, isOwnProfile, onPrivacyToggle, updatingPrivacy, isPrivateView = false ,targetid }) => (
  <div className="profile-card">

    <div className="profile-header">
      <Image
        src={profile.avatar ? `/${profile.avatar}` : "/icon.jpg"}
        alt="Profile Avatar"
        width={80}
        height={80}
        priority
        style={{borderRadius: 50}}
      />
      <div className="profile-info">
        <h2>{profile.first_name} {profile.last_name}</h2>
        <p className="nickname">@{profile.nickname}</p>
        
        {/* Only show privacy toggle for own profile */}
        {isOwnProfile && (
          <div className="privacy-toggle">
            <span className={`privacy-badge ${profile.is_private ? 'private' : 'public'}`}>
              {profile.is_private ? '🔒 Private' : '🌍 Public'}
            </span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={profile.is_private}
                onChange={onPrivacyToggle}
                disabled={updatingPrivacy}
              />
              <span className="slider"></span>
            </label>
            {updatingPrivacy && <span className="updating-text">Updating...</span>}
          </div>
        )}
        
        {/* Show privacy status for other users */}
        {!isOwnProfile && (
          <div className="privacy-status">
            <span className={`privacy-badge ${profile.is_private ? 'private' : 'public'}`}>
              {profile.is_private ? '🔒 Private' : '🌍 Public'}
            </span>
            <FollowButton targetUserid={targetid} isPrivateView={isPrivateView} />

          </div>
        )}
      </div>
      
    </div>
    
    {/* Show detailed info only if !isPrivateView or if is own profile */}
    {(!isPrivateView || isOwnProfile) && profile.email && (
      <div className="profile-details">
        <div className="detail-item">
          <strong>Email:</strong> {profile.email}
        </div>
        <div className="detail-item">
          <strong>Age:</strong> {profile.age}
        </div>
        <div className="detail-item">
          <strong>Gender:</strong> {profile.gender}
        </div>
        {profile.about_me && (
          <div className="detail-item">
            <strong>About:</strong> {profile.about_me}
          </div>
        )}
      </div>
    )}
    
    {/* Show message for private profile */}
    {isPrivateView && !isOwnProfile && (
      <div className="private-details-message" style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        marginTop: '1rem',
        textAlign: 'center',
        color: '#6c757d'
      }}>
        <p>🔒 Additional details are private</p>
      </div>
    )}
  </div>
);

const PrivatePostsMessage = () => (
  <div className="private-posts-message" style={{
    textAlign: 'center',
    padding: '2rem',
    background: '#f8f9fa',
    borderRadius: '8px',
    margin: '2rem 0',
    color: '#6c757d'
  }}>
    <h3>🔒 Private Posts</h3>
    <p>This user's posts are private and only visible to them.</p>
  </div>
);



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

  // Use custom comment hook
  const {
    showComments,
    comments,
    loadingComments,
    handleComment,
    handleSendComment
  } = useComments(setPosts);

  useEffect(() => {
    // Fetch the profile
    fetchProfile();
  }, [targetUserId]);

  const fetchCurrentUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:8080/statuts', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      
    } catch (error) {
      console.error('Error fetching current user info:', error);
    }
  };

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
        />
      </div>
    </div>
  );
}