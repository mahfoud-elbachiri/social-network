'use client';
import { useEffect, useState } from "react";
import Image from "next/image";
import Sidebar from '@/components/Sidebar';
import FollowButton from "@/components/FollowButton";
import { useRouter } from 'next/navigation';
import { userApi } from '../../utils/api';
import { getSocket } from "@/sock/GetSocket";
import styles from './explore.module.css';


export default function Explore() {

  const socket = getSocket()

  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Store all users from backend
  const [currentUserId, setCurrentUserId] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

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


  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (currentUserId !== null) {
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

  const handleClearSearch = async () => {
    // Clear the search input
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
      searchInput.value = '';
    }
    await fetchAllUsers();
  };


  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />

      <div className="container">
        <main className="main-content">
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1>🔍 Explore</h1>
            <p>Discover and connect with people</p>
          </div>

          {/* Search Section */}
          <div className={styles['search-section']}>
            <form onSubmit={handleSearch} className={styles['search-form']}>
              <div className={styles['search-input-wrapper']}>
                <input
                  type="text"
                  name="search"
                  placeholder="Search users by first or last name..."
                  className={styles['search-input']}
                />
                <div className={styles['search-buttons']}>
                  <button type="submit" className={styles['search-btn']} >
                    🔍 Search
                  </button>
                  <button type="button" onClick={handleClearSearch} className={styles['clear-btn']}>
                    ✖️ Clear
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className={styles['users-container']}>
            {users.length > 0 ? (
              <div className={styles['users-grid']}>
                {users.map((user) => (
                  <div key={user.id} className={styles['user-card']}>
                    <div className={styles['user-info']} onClick={(e) => handleCardClick(user.id, e)}>
                      <Image
                        src={user.avatar ? `/${user.avatar}` : "/icon.jpg"}
                        alt={`${user.nickname || user.first_name} avatar`}
                        width={40}
                        height={40}
                        priority
                        style={{ borderRadius: 50 }}
                      />
                      <div className={styles['user-details']}>
                        <h3>
                          {user.nickname ? `@${user.nickname}` : `${user.first_name} ${user.last_name}`}
                        </h3>
                        <p>{user.first_name} {user.last_name}</p>
                        <span className={`privacy-badge ${user.is_private ? 'private' : 'public'}`}>
                          {user.is_private ? '🔒 Private' : '🌍 Public'}
                        </span>
                      </div>
                      {console.log("id", user)}
                    </div>
                    <FollowButton
                      targetUserid={String(user.id)}
                      isPrivateView={user.is_private}
                    />                  </div>
                ))}
              </div>
            ) : (
              <div className={styles['no-users']}>
                <p>No users found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}