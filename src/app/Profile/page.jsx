'use client';
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:8080/profile', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await res.json();
      if (data.status) {
        setProfile(data.profile);
        setPosts(data.posts || []);
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = async () => {
    if (updatingPrivacy) return;
    
    setUpdatingPrivacy(true);
    try {
      const response = await fetch('http://localhost:8080/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'update_privacy',
          is_private: !profile.is_private 
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.status) {
        // Update the profile state locally
        setProfile(prev => ({
          ...prev,
          is_private: !prev.is_private
        }));
      } else {
        setError(data.error || 'Failed to update privacy setting');
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
      setError('Failed to update privacy setting');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const fetchCommentsForPost = async (postId) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    
    try {
      const response = await fetch('http://localhost:8080/getcomment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_id: postId.toString() }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data && data.token === false) {
        console.error('Unauthorized access, redirecting to login...');
        window.location.href = "/";
        return;
      }
      
      if (data && (data.error || data.status === false)) {
        console.error('Error fetching comments:', data.error);
        setError(data.error);
      } else {
        setComments(prev => ({
          ...prev,
          [postId]: Array.isArray(data) ? data : []
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
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
      const response = await fetch('http://localhost:8080/sendcomment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: commentText, 
          post_id: postId.toString() 
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data && data.token === false) {
        console.error('Unauthorized access, redirecting to login...');
        window.location.href = "/";
        return;
      }

      if (data && data.status) {
        await fetchCommentsForPost(postId);
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.ID == postId 
              ? { ...post, Nembre: post.Nembre + 1 }
              : post
          )
        );
      } else {
        console.error('Error sending comment:', data.error);
        setError(data.error);
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      setError('Failed to send comment');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8080/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <header className="header">
        <Link href="/Home">
          <Image 
            src={profile.avatar ? `/${profile.avatar}` : "/icon.jpg"}
            alt="Profile Avatar" 
            width={52} 
            height={52}
            priority
            style={{borderRadius: 50, cursor: 'pointer', display: 'block'}}
          />
        </Link>
        <nav>
          <li><Link href="/Followers">Followers</Link></li>
          <li><Link href="/Groups">Groups</Link></li>
          <li><Link href="/Notification">Notification</Link></li>
          <li><Link href="/Chats">Chats</Link></li>
          <li><Link href="/Home">Home</Link></li>
        </nav>
        <button id="logout" onClick={handleLogout}>logout</button>
      </header>

      <div className="container">
        {/* Profile Info Sidebar */}
        <aside className="sidebar">
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
                
                <div className="privacy-toggle">
                  <span className={`privacy-badge ${profile.is_private ? 'private' : 'public'}`}>
                  {profile.is_private ? '🔒 Private' : '🌍 Public'}
                </span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={profile.is_private}
                      onChange={togglePrivacy}
                      disabled={updatingPrivacy}
                    />
                    <span className="slider"></span>
                  </label>
                  {updatingPrivacy && <span className="updating-text">Updating...</span>}
                </div>
              </div>
            </div>
            
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
          </div>
        </aside>
        
        {/* Main Content - Posts */}
        <main className="main-content" id="main-content">
          <div className="profile-posts-header">
            <h3>Posts by {profile.first_name} ({posts.length})</h3>
          </div>

          <div className="posts-container">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.ID} className="post" postid={post.ID}>
                  <div className="post-header">
                    <span>{post.Username}</span>
                    <span style={{color: '#6c757d'}}>{formatDate(post.CreatedAt)}</span>
                  </div>
                  
                  <h4>{post.Title}</h4>
                  <p>{post.Content}</p>
                  
                  <div id="comment" className="of" posteid={post.ID}
                    onClick={handleComment}>
                    {post.Nembre} 💬
                  </div>

                  {/* Comments Section */}
                  {showComments[post.ID] && (
                    <div className="comments-section">
                      {loadingComments[post.ID] ? (
                        <div className="loading-comments">Loading comments...</div>
                      ) : (
                        <>
                          {comments[post.ID] && comments[post.ID].length > 0 ? (
                            <div className="comments-list">
                              {comments[post.ID].map((comment) => (
                                <div key={comment.ID} className="comment-item">
                                  <div className="comment-header">
                                    <strong>{comment.Username}</strong>
                                    <span className="comment-date">
                                      {formatDate(comment.CreatedAt)}
                                    </span>
                                  </div>
                                  <p className="comment-text">{comment.Content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-comments">No comments yet</div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="input-wrapper">
                    <textarea 
                      placeholder="Write a comment..." 
                      className="comment-input" 
                      data-idpost={post.ID}
                      id={`comment-textarea-${post.ID}`}
                    />
                    <button 
                      className="send-button"
                      onClick={(e) => {
                        const textarea = document.getElementById(`comment-textarea-${post.ID}`);
                        if (textarea && textarea.value) {
                          const commentText = textarea.value;
                          if (commentText.trim()) {
                            handleSendComment(post.ID, commentText);
                            textarea.value = '';
                          }
                        }
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="post">
                <p>No posts found for this user</p>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - could be used for other info or stats */}
        <aside className="contacts">
          <div style={{marginBottom: '1rem'}}>
            <h3>Profile Stats</h3>
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <strong>{posts.length}</strong>
              <span>Posts</span>
            </div>
            <div className="stat-item">
              <strong>0</strong>
              <span>Followers</span>
            </div>
            <div className="stat-item">
              <strong>0</strong>
              <span>Following</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}