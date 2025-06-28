'use client';
import { useEffect, useState } from "react";
import Image from "next/image";
import Header from '@/components/Header';
import FollowButton from "@/components/FollowButton";
import { useRouter } from 'next/navigation';
import { userApi } from '../../utils/api';
import { getSocket } from "@/sock/GetSocket";


export default function Explore() {

  const socket = getSocket()

  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Store all users from backend
  const [currentUserId, setCurrentUserId] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ content: "broadcast" }));
    } else {
      console.warn("❌ WebSocket not ready, cannot send message yet");
    }

    initializeData();
  }, []);

  // Filter users whenever allUsers or currentUserId changes
  useEffect(() => {
    if (allUsers.length > 0 && currentUserId !== null) {
      const filteredUsers = allUsers.filter(user => user.id !== currentUserId);
      setUsers(filteredUsers);
    }
  }, [allUsers, currentUserId]);

  const initializeData = async () => {
    await Promise.all([
      fetchCurrentUser(),
      fetchAllUsers()
    ]);
  };

  const fetchCurrentUser = async () => {
    try {
      const userData = await userApi.fetchUserStatus();
      if (userData && userData.user_id) {
        setCurrentUserId(userData.user_id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchAllUsers = async (search = '') => {
    try {
      const url = search 
        ? `http://localhost:8080/getusers?search=${encodeURIComponent(search)}`
        : 'http://localhost:8080/getusers';
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data) ? data : [];
        setAllUsers(usersArray);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users');
    }
  };

  const handleCardClick = (userId, e) => {
    
    if (e.target.closest('.follow-button')) {
      return;
    }
    router.push(`/Profile?id=${userId}`);
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchValue = formData.get('search');
    await fetchAllUsers(searchValue);
  };
 

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Header />

      <div className="container">
        <main className="main-content">
          {/* Search Section */}
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  name="search"
                  placeholder="Search users by first or last name..."
                  className="search-input"
                />
                <div className="search-buttons">
                  <button type="submit" className="search-btn" >
                    🔍 Search
                  </button>
                  
                </div>
              </div>
            </form>
          </div>
          
          <div className="users-container">
            {users.length > 0 ? (                
              <div className="users-grid">
                {users.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-info" onClick={ (e) => handleCardClick(user.id ,e )}>
                      <Image 
                        src={user.avatar ? `/${user.avatar}` : "/icon.jpg"} 
                        alt={`${user.nickname || user.first_name} avatar`}
                        width={40}
                        height={40}
                        priority
                        style={{borderRadius: 50}}
                      />
                      <div className="user-details">
                        <h3>
                          {user.nickname ? `@${user.nickname}` : `${user.first_name} ${user.last_name}`}
                        </h3>
                        <p>{user.first_name} {user.last_name}</p>
                        <span className={`privacy-badge ${user.is_private ? 'private' : 'public'}`}>
                          {user.is_private ? '🔒 Private' : '🌍 Public'}
                        </span>
                      </div>
                      {console.log("id",user)}
                    </div>
                     <FollowButton 
                      targetUserid={String(user.id)} 
                      isPrivateView={user.is_private}
                    />                  </div>
                ))}
              </div>
            ) : (
              <div className="no-users">
                <p>No users found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}