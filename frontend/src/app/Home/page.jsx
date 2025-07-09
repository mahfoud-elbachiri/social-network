'use client';
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import "./style.css"

import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import CreatePostForm from '@/components/CreatePostForm';
import { useComments } from '@/hooks/useComments';
import { userApi, postApi } from '@/utils/api'
import ChatWebSocket from "@/components/ChatWebSocket";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [username, setUsername] = useState('User');
  const [userAvatar, setUserAvatar] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  // Groups state
  const [groups, setGroups] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ title: '', description: '' });

  // Use custom comment hook
  const {
    showComments,
    comments,
    loadingComments,
    handleComment,
    handleSendComment
  } = useComments(setPosts);

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    const handleScroll = async () => {
      if ((document.body.offsetHeight - (window.innerHeight + window.scrollY)) < 100) {
        try {
          const data = await postApi.fetchPosts(false);
          if (data && data.length > 0) {
            setPosts(prevPosts => [...prevPosts, ...data]);
          }
        } catch (error) {
          console.error('Error fetching more posts:', error);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initializePage = async () => {
    try {
      // Fetch user status, posts, and groups at the same time
      const [userStatus, postsData] = await Promise.all([
        fetchUserStatus(),
        loadPosts()
      ]);
      // Fetch groups after user status is loaded
      fetchGroups();
    } catch (error) {
      console.error('Error initializing page:', error);
      setError('Failed to load page');
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const data = await userApi.fetchUserStatus();
      if (data && data.status && data.name) {
        console.log("dkhlat");
        setUsername(data.name);
        setUserAvatar(data.avatar || "");
        setCurrentUserId(data.user_id);
        return data;
      } else {
        console.error('Failed to fetch user status:', data?.error);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await postApi.fetchPosts(true);
      if (data) {
        setPosts(data || []);
        setLoading(false);
        return data;
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
      setLoading(false);
    }
  };

  // Groups functions
  const fetchGroups = async () => {
    try {
      const res = await fetch('http://localhost:8080/groupPage', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      setGroups(data.Groups || []);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  const handleCreateGroup = async (e) => {

    e.preventDefault();

    if (groupForm.description == "" || groupForm.title == "") {
      setError("fill group title and description")
      return
    }

    try {
      await fetch('http://localhost:8080/create-group', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
      });
      setShowCreateGroupModal(false);
      setGroupForm({ title: '', description: '' });
      fetchGroups();
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await fetch('http://localhost:8080/join-group', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      fetchGroups();
    } catch (err) {
      console.error('Failed to join group', err);
    }
  };

  const acceptInvite = async (groupId) => {
    try {
      await fetch('http://localhost:8080/group/accept-invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      fetchGroups();
    } catch (err) {
      console.error('Failed to accept invite', err);
    }
  };

  const rejectInvite = async (groupId) => {
    try {
      await fetch('http://localhost:8080/group/reject-invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      fetchGroups();
    } catch (err) {
      console.error('Failed to reject invite', err);
    }
  };

  const handlePostCreated = () => {
    // Refresh posts after creating a new one
    loadPosts();
  };

  if (loading) {
    return <div>Loading posts...</div>;
  }

  // if (error) {
  //   return <div>Error: {error}</div>;
  // }

  return (
    <div>
      <Header />

      <div className="container">
        {/* Left Sidebar Container */}
        <div className="left-sidebar-container">
          {/* User Profile & Groups Sidebar */}
          <aside className="sidebar">
            {/* User Profile Section */}
            <Link href={`/Profile?id=${currentUserId}`} style={{ textDecoration: 'none' }}>
              <div className="contact">
                <Image
                  src={userAvatar ? `/${userAvatar}` : "/icon.jpg"}
                  alt="User Avatar"
                  width={28}
                  height={28}
                  priority
                  style={{ borderRadius: 50 }}
                />
                <span>{username}</span>
                <span className="online-indicator"></span>
              </div>
            </Link>

            {/* Groups Section */}
            <div className="groups-section">
              <div className="groups-header">
                <h3>Groups</h3>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="create-group-btn"
                  title="Create Group"
                >
                  +
                </button>
              </div>

              <div className="groups-list">
                {groups?.map(group => (
                  <div key={group.ID} className="group-item-sidebar">
                    {group.IsCreator ? (
                      <Link href={`/Groups?group=${group.ID}`} className="group-link">
                        <div className="group-content">
                          <strong className="group-title">{group.Title}</strong>
                          <small className="group-description">{group.Description}</small>
                          <span className="group-status admin">Admin</span>
                        </div>
                      </Link>
                    ) : group.IsMember ? (
                      <Link href={`/Groups?group=${group.ID}`} className="group-link">
                        <div className="group-content">
                          <strong className="group-title">{group.Title}</strong>
                          <small className="group-description">{group.Description}</small>
                          <span className="group-status member">Member</span>
                        </div>
                      </Link>
                    ) : group.IsRequested ? (
                      <div className="group-content">
                        <strong className="group-title">{group.Title}</strong>
                        <small className="group-description">{group.Description}</small>
                        <span className="group-status pending">Pending</span>
                      </div>
                    ) : group.IsInvited ? (
                      <div className="group-content">
                        <strong className="group-title">{group.Title}</strong>
                        <small className="group-description">{group.Description}</small>
                        <div className="group-actions">
                          <button
                            onClick={() => acceptInvite(group.ID)}
                            className="accept-btn-small"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectInvite(group.ID)}
                            className="reject-btn-small"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group-content">
                        <strong className="group-title">{group.Title}</strong>
                        <small className="group-description">{group.Description}</small>
                        <button
                          onClick={() => handleJoinGroup(group.ID)}
                          className="join-btn-small"
                        >
                          Join
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Main Content */}
        <main className="main-content" id="main-content">
          {/* Create Post Button */}
          <div className="create-post">
            <button onClick={() => setShowCreatePost(true)}>+ Create a post</button>
          </div>

          {/* Create Post Form */}
          {showCreatePost && (
            <CreatePostForm
              onPostCreated={handlePostCreated}
              onClose={() => setShowCreatePost(false)}
            />
          )}

          {/* Posts Display */}
          <div className="posts-container">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.ID}
                  post={post}
                  currentUserId={currentUserId}
                  showComments={showComments}
                  comments={comments}
                  loadingComments={loadingComments}
                  onCommentClick={handleComment}
                  onSendComment={handleSendComment}
                />
              ))
            ) : (
              <div className="post">
                <p>No posts found</p>
              </div>
            )}
          </div>
        </main>

        {/* Chat Sidebar */}
        <div className="side-chat">
          <ChatWebSocket username={username} />
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleCreateGroup}>
              <h2>Create a New Group</h2>
              <label>
                Title:
                <input
                  type="text"
                  value={groupForm.title}
                  onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
                  required
                />
              </label>
              <label>
                Description:
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  required
                />
              </label>
              <div style={{color: 'red'}}>{error}</div>
              <div className="modal-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateGroupModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}