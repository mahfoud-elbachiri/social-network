'use client';
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

 
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import CreatePostForm from '@/components/CreatePostForm';
import { useComments } from '@/hooks/useComments';
import { userApi, postApi } from '@/utils/api'

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [username, setUsername] = useState('User');
  const [userAvatar, setUserAvatar] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

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
      // Fetch user status and posts in same time
      const [userStatus, postsData] = await Promise.all([
        fetchUserStatus(),
        loadPosts()
      ]);
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

  const handlePostCreated = () => {
    // Refresh posts after creating a new one
    loadPosts();
  };

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Header  targetUserId ={currentUserId}/>

      <div className="container">
        {/* Sidebar */}
        <aside className="sidebar">
          <Link href={`/Profile?id=${currentUserId}`} style={{textDecoration: 'none'}}>
            <div className="contact">
              <Image
                src={userAvatar ? `/${userAvatar}` : "/icon.jpg"}
                alt="User Avatar"
                width={28}
                height={28}
                priority
                style={{borderRadius: 50}}
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

        {/* Contacts Sidebar */}
        <aside className="contacts" style={{paddingTop: '0'}}>
          <div style={{marginBottom: '1rem'}}>
            <span className="material-icons" id="cancel"></span>
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