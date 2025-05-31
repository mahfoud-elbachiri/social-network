

'use client';
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [username, setUsername] = useState('User'); // You can get this from auth context
  
  const categories = [
    'all', 'Tech Support', 'General Discussion', 'Tutorials', 
    'Gaming', 'Hobbies & Interests', 'Job Listings', 'Announcements'
  ];

  useEffect(() => {
    // Call HomeHandeler when component mounts
    HomeHandeler(setPosts, setLoading, setError);
  }, []);

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
    
    // Get selected categories
    const selectedCategories = Array.from(e.target.querySelectorAll('input[name="categories"]:checked'))
      .map(input => input.value);

    const formData = new FormData();
    formData.append('title', form.get('title'));
    formData.append('content', form.get('content'));
    formData.append('categories', selectedCategories.join(','));

    try {
      const res = await fetch('http://localhost:8080/pubpost', {
        method: 'POST',
        body: formData,
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

  const handleReaction = async (postId, type, currentStatus) => {
    try {
      const formData = new FormData();
      formData.append('id', postId);
      formData.append('type', 'post');
      formData.append('reaction', type);

      const res = await fetch('http://localhost:8080/reactione', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();
      if (data.status) {
        // Refresh posts to update reaction counts
        HomeHandeler(setPosts, setLoading, setError);
      }
    } catch (error) {
      console.error('Reaction error:', error);
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
            src="/icon.jpg" 
            alt="Forum Logo" 
            width={52} 
            height={52}
            priority
            style={{cursor: 'pointer', display: 'block'}}
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
          <div className="contact">
            <span className="material-icons">account_circle</span>
            <span>{username}</span>
            <span className="online-indicator"></span>
          </div>
          
          <h3>Category</h3>
          <div className="category-list">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`cat ${selectedCategory === cat ? 'active' : ''}`}
                value={cat}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
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

                <div className="form-group">
                  <label>Select Categories</label>
                  <div className="category-grid">
                    {categories.slice(1).map(cat => (
                      <label key={cat} className="category-checkbox">
                        <input type="checkbox" name="categories" value={cat} />
                        {cat}
                      </label>
                    ))}
                  </div>
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
                    <span className="material-icons">account_circle</span>
                    <span>{post.Username}</span>
                    <span style={{color: '#6c757d'}}>{formatDate(post.CreatedAt)}</span>
                  </div>
                  
                  <h4>{post.Title}</h4>
                  <p>{post.Content}</p>
                  <i style={{color: '#b3b3b3'}}>Categories: [{post.Categories}]</i>
                  
                  <div className="post-actions">
                    <div className="reactions">
                      <div className="like-button" data-status={post.Have === 'like' ? 'on' : 'off'}>
                        <span 
                          className="material-icons"
                          onClick={() => handleReaction(post.ID, 'like', post.Have)}
                          style={{cursor: 'pointer'}}
                        >
                          {post.Have === 'like' ? 'thumb_up' : 'thumb_up_off_alt'}
                        </span>
                        <b>{post.Like}</b>
                      </div>
                      
                      <div className="like-button" data-status={post.Have === 'dislike' ? 'on' : 'off'}>
                        <span 
                          className="material-icons"
                          onClick={() => handleReaction(post.ID, 'dislike', post.Have)}
                          style={{cursor: 'pointer'}}
                        >
                          {post.Have === 'dislike' ? 'thumb_down' : 'thumb_down_off_alt'}
                        </span>
                        <b>{post.DisLike}</b>
                      </div>
                    </div>
                    
                    <div id="comment" className="of" posteid={post.ID}>
                      {post.Nembre} 💬
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="input-wrapper">
                    <textarea 
                      placeholder="Write a comment..." 
                      className="comment-input" 
                      data-idpost={post.ID}
                    />
                    <button className="send-button">
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

        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers.get('content-type'));
        
        // Check if response is empty or not JSON
        const text = await res.text();
        console.log('Raw response:', text);
        
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
