'use client';
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [username, setUsername] = useState('User'); // You can get this from auth context
  const [userAvatar, setUserAvatar] = useState("");
  useEffect(() => {
    FetchUserStatus();
    // Call HomeHandeler when component mounts
    HomeHandeler(setPosts, setLoading, setError);
  }, []);

  useEffect(() => {
    const handleScroll = async () => {
      if ((document.body.offsetHeight - (window.innerHeight + window.scrollY)) < 100) {
        const formData = new FormData();
        formData.delete('lastdata');
        try {
          const res = await fetch('http://localhost:8080/getpost', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          const data = await res.json();
          if (data && data.length > 0) {
            setPosts(prevPosts => [...prevPosts, ...data]);
          }
        } catch (error) {
          console.error('Error fetching more posts:', error);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const FetchUserStatus = async () => {
    try {
      const res = await fetch('http://localhost:8080/statuts', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status && data.name) {
        setUsername(data.name);
        setUserAvatar(data.avatar || "");
        console.log("hhhhh",data.avatar)
      } else {
        console.error('Failed to fetch user status:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
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
      
      // Check for authentication errors
      if (data && data.token === false) {
        console.error('Unauthorized access, redirecting to login...');
        window.location.href = "/";
        return;
      }
      
      // Check if data has error or status false
      if (data && (data.error || data.status === false)) {
        console.error('Error fetching comments:', data.error);
        setError(data.error);
      } else {
        // Store comments for this post (data is the comments array)
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
    
    // Toggle comments visibility
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    // If comments are being shown and we don't have them yet, fetch them
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
        // Refresh comments for this post using the reusable function
        await fetchCommentsForPost(postId);
          
        // Update post comment count
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    try {
      const res = await fetch('http://localhost:8080/pubpost', {
        method: 'POST',
        body: form,
        credentials: 'include'
      });

      const data = await res.json();
      if (data.status) {
        setShowCreatePost(false);
        // Refresh posts
        HomeHandeler(setPosts, setLoading, setError);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to create post');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
        
      {/* Header */}
      <header className="header">
        
        <Link href="/Profile">
          <Image 
             src={userAvatar ? `/${userAvatar}` : "/icon.jpg"}
            alt="Forum Logo" 
            width={52} 
            height={52}
            priority
            style={{borderRadius : 50 ,cursor: 'pointer', display: 'block'}}
          />
        </Link>
        <nav>
          <li><Link href="/Followers">Followers</Link></li>
          <li><Link href="/Profile">Profile</Link></li>
          <li><Link href="/Groups">Groups</Link></li>
          <li><Link href="/Notification">Notification</Link></li>
          <li><Link href="/Chats">Chats</Link></li>
      </nav>
          
        <button id="logout" onClick={handleLogout}>logout</button>
      </header>

      <div className="container">
        {/* Sidebar */}
        <aside className="sidebar">
           <Link href="/Profile" style={{textDecoration: 'none'}}>
          <div className="contact">
             
            <Image
              src={userAvatar ? `/${userAvatar}` : "/icon.jpg"}
              alt="User Avatar"
              width={28}
              height={28}
              priority
              style={{borderRadius : 50}}
            />
            <span>{username}</span>
            <span className="online-indicator"></span>
          </div>
          </Link>
        </aside>
        
        {/* Main Content */}
        <main className="main-content" id="main-content">
          {/* Create Post Button */}
          <div className="create-post">
            <button onClick={() => setShowCreatePost(true)}>+ Create a post</button>
          </div>

          {/* Create Post Form */}
          {showCreatePost && (
            <div className="form-container">
              <form name="creatpost" onSubmit={handleCreatePost}>
                <div className="form-group">
                  <div>
                    <span 
                      className="material-icons" 
                      id="close"
                      onClick={() => setShowCreatePost(false)}
                      style={{cursor: 'pointer'}}
                    >
                      close
                    </span>
                    <label>Post Title</label>
                    <input 
                      type="text" 
                      name="title" 
                      className="form-control" 
                      placeholder="Enter post title" 
                      required 
                    />
                  </div>
                </div>
                <br />
                <div className="post-imagee">
                <label>add Image or gif (Optional)</label>
                <br />
                <input type="file" name="avatar" accept="image/*" />
                </div>
<br />
                <div className="radio-group-inline">
                  <label className="radio-option-inline">
                    <input type="radio" name="privacy" value="public" defaultChecked />
                    <span> Public</span>
                  </label>
                  <label className="radio-option-inline">
                    <input type="radio" name="privacy" value="private" />
                    <span> Private</span>
                  </label>
                  <label className="radio-option-inline">
                    <input type="radio" name="privacy" value="almost private" />
                    <span> almost private</span>
                  </label>
                </div>


                <div className="form-group">
                  <label>Post Content</label>
                  <textarea 
                    className="form-control" 
                    name="content" 
                    rows="5" 
                    placeholder="Write your post content" 
                    required
                  />
                </div>
                
                <p id="error-message-creatpost"></p>
                <button type="submit" className="submit-btn">Submit Post</button>
              </form>
            </div>
          )}

          {/* Posts Display */}
          <div className="posts-container">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.ID} className="post" postid={post.ID}>
                  <div className="post-header">
                    <Image
                      src={post.UserAvatar ? `/${post.UserAvatar}` : "/icon.jpg"}
                      alt="Post Author Avatar"
                      width={28}
                      height={28}
                      priority
                      style={{borderRadius: 50}}
                    />
                    <div className="post-header-text">
                      <span>{post.Username}</span>
                      <span style={{color: '#6c757d'}}> {formatDate(post.CreatedAt)}</span>
                    </div>
                  </div>
                  
                  <h4>{post.Title}</h4>
                  <p>{post.Content}</p>
                  
                  {/* Display post image if it exists */}
                  {post.Avatar && (
                    <div className="post-image">
                      <Image
                        src={`/${post.Avatar}`}
                        alt="Post Image"
                        width={400}
                        height={300}
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '400px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginTop: '10px'
                        }}
                      />
                    </div>
                  )}
                  
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
                          } else {
                          return
                        }
                        } else {
                          return
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
                <p>No posts found</p>
              </div>
            )}
          </div>
        </main>

        {/* Contacts Sidebar */}
        <aside className="contacts" style={{paddingTop: '0'}}>
          <div style={{marginBottom: '1rem'}}>
            <span className="material-icons" id="cancel">cancel</span>
            <h3>Chat</h3>
          </div>
          <div 
            id="contact-list"
            style={{
              height: `${typeof window !== 'undefined' ? window.innerHeight / 4 : 200}px`,
              overflowY: 'auto',
              border: '3px solid rgb(226, 226, 226)',
              padding: '15px',
              borderRadius: '20px'
            }}
          >
            {/* Contact list content */}
          </div>
        </aside>
      </div>
    </div>
  );
}

export async function HomeHandeler(setPosts, setLoading, setError) {  
    try {
        const formData = new FormData();
        formData.append('lastdata', true);

        const res = await fetch('http://localhost:8080/getpost', { 
            method: 'POST', 
            body: formData,
            credentials: 'include'
        });

      
        // Check if response is empty or not JSON
        const text = await res.text();
        
        if (!text) {
            console.error('Empty response from server, redirecting to login...');
            window.location.href = "/";
            return;
        }
        
        let data;
        try {
            data = JSON.parse(text);

        } catch (e) {
            console.error('Failed to parse JSON:', text);
            console.error('Redirecting to login...');
            window.location.href = "/";
            return;
        }
        
        console.log('Data received:', data);
        
        if (data.login === false) {
            console.error('Unauthorized access, redirecting to login...');
            window.location.href = "/";
            return;
        }

        if (data.error) {
            console.error('Backend error:', data.error);
            setError(data.error);
            setLoading(false);
            return;
        }
        
        // Success - update posts state
        setPosts(data || []);
        setLoading(false);
        
    } catch (error) {
        console.error('Error:', error);
        setError(error.message);
        setLoading(false);
    }
}
