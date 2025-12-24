'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import { Grid3X3, Users, UserCheck, Mail, Calendar, User, Lock, Globe, MessageCircle } from 'lucide-react';

import styles from './profile.module.css';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import FollowButton from '@/components/FollowButton';
import FollowList from '@/components/Followlist';
import PrivatePostsMessage from '@/components/PrivatePostsMessage';
import UserNotFound from '@/components/UserNotFound';
import { useComments } from '@/hooks/useComments';
import { userApi } from '@/utils/api';
import { getSocket } from "@/sock/GetSocket";


export default function ProfileClient() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('id') || null;

  const socket = getSocket()

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isPrivatePosts, setIsPrivatePosts] = useState(false);
  const [isPrivateView, setIsPrivateView] = useState(false);

  // Follow data
  const [followData, setFollowData] = useState({
    followers: { count: 0 },
    following: { count: 0 }
  });
  const [showPopup, setShowPopup] = useState(false);
  const [popupTab, setPopupTab] = useState('followers');

  const [i, setI] = useState(false)

  useEffect(() => {
    socket.onopen = () => {
      console.log('✅ WebSocket connected')
      setI(true)
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ content: "broadcast" }));
    } else {
      console.warn("❌ WebSocket not ready, cannot send message yet");
    }
  }, [i])


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
    fetchFollowData();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const data = await userApi.fetchProfile(targetUserId);

      if (data && data.status) {
        setProfile(data.profile);
        setIsOwnProfile(data.is_own_profile || false);
        setIsPrivateView(data.is_private_view || false);
        setError(null);
        setUserNotFound(false);
      } else {

        if (data?.error === "User Not found" || data?.error === "Invalid user ID") {
          setUserNotFound(true);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
      setUserNotFound(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await userApi.fetchPostsOfUser(targetUserId);
      if (data && data.status) {
        const postsArray = data.posts || [];
        setPosts(postsArray);
        setIsPrivatePosts(false);
      } else if (data && data.error === "private") {
        setIsPrivatePosts(true);
        setPosts([]);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  };

  const fetchFollowData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/follow-data?id=${targetUserId}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (data && data.status) {
        setFollowData(data);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const togglePrivacy = async () => {
    if (!profile || updatingPrivacy) return;

    setUpdatingPrivacy(true);
    try {
      const response = await fetch('http://localhost:8080/updateUserPrivacy', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_private: !profile.is_private })
      });

      const data = await response.json();
      if (data && data.status) {
        setProfile(prev => ({ ...prev, is_private: !prev.is_private }));
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const openPopup = (tab) => {
    if (!isPrivatePosts) {
      setPopupTab(tab);
      setShowPopup(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Sidebar />
        <div className={styles.profileContainer}>
          <div className={styles.loadingState}>Loading profile...</div>
        </div>
      </div>
    );
  }

  // User not found
  if (userNotFound) {
    return (
      <div className={styles.pageWrapper}>
        <Sidebar />
        <UserNotFound />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <Sidebar />
        <div className={styles.profileContainer}>
          <div className={styles.errorState}>Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.pageWrapper}>
        <Sidebar />
        <div className={styles.profileContainer}>
          <div className={styles.errorState}>Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />

      <div className={styles.profileContainer}>
        {/* Profile Header Section */}
        <div className={styles.profileHeader}>
          {/* Cover Image */}
          <div className={styles.coverImage}></div>

          {/* Profile Info */}
          <div className={styles.profileInfo}>
            {/* Avatar */}
            <div className={styles.avatarWrapper}>
              <Image
                src={profile.avatar ? `/${profile.avatar}` : "/icon.jpg"}
                alt="Profile Avatar"
                width={120}
                height={120}
                priority
                className={styles.avatar}
              />
            </div>

            {/* Main Info */}
            <div className={styles.mainInfo}>
              <div className={styles.nameRow}>
                <h1 className={styles.displayName}>
                  {profile.first_name} {profile.last_name}
                </h1>
                <span className={styles.username}>@{profile.nickname}</span>

                {/* Privacy Badge */}
                <span className={`${styles.privacyBadge} ${profile.is_private ? styles.private : styles.public}`}>
                  {profile.is_private ? <><Lock size={14} /> Private</> : <><Globe size={14} /> Public</>}
                </span>
              </div>

              {/* Bio/About */}
              {profile.about_me && (
                <p className={styles.bio}>{profile.about_me}</p>
              )}

              {/* Quick Info */}
              <div className={styles.quickInfo}>
                {profile.email && (
                  <span className={styles.infoItem}>
                    <Mail size={16} />
                    {profile.email}
                  </span>
                )}
                {profile.age && (
                  <span className={styles.infoItem}>
                    <Calendar size={16} />
                    {profile.age} years old
                  </span>
                )}
                {profile.gender && (
                  <span className={styles.infoItem}>
                    <User size={16} />
                    {profile.gender}
                  </span>
                )}
              </div>
            </div>

            {/* Actions & Stats */}
            <div className={styles.actionsColumn}>
              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                {isOwnProfile ? (
                  <button
                    className={styles.editBtn}
                    onClick={togglePrivacy}
                    disabled={updatingPrivacy}
                  >
                    {updatingPrivacy ? 'Updating...' : (profile.is_private ? 'Make Public' : 'Make Private')}
                  </button>
                ) : (
                  <>
                    <FollowButton targetUserid={targetUserId} isPrivateView={isPrivateView} />
                    <button className={styles.messageBtn}>
                      <MessageCircle size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Stats Row */}
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <Grid3X3 size={18} />
                  <strong>{posts.length}</strong>
                  <span>Posts</span>
                </div>
                <div
                  className={`${styles.statItem} ${!isPrivatePosts ? styles.clickable : ''}`}
                  onClick={() => openPopup('followers')}
                >
                  <Users size={18} />
                  <strong>{followData.followers?.count || 0}</strong>
                  <span>Followers</span>
                </div>
                <div
                  className={`${styles.statItem} ${!isPrivatePosts ? styles.clickable : ''}`}
                  onClick={() => openPopup('following')}
                >
                  <UserCheck size={18} />
                  <strong>{followData.following?.count || 0}</strong>
                  <span>Following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className={styles.postsSection}>
          <div className={styles.postsHeader}>
            <Grid3X3 size={20} />
            <h2>Posts</h2>
          </div>

          <div className={styles.postsGrid}>
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
                  <div className={styles.noPosts}>
                    <Grid3X3 size={48} />
                    <p>No posts yet</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Follow List Popup */}
      <FollowList
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        activeTab={popupTab}
        targetUserId={targetUserId}
      />
    </div>
  );
}