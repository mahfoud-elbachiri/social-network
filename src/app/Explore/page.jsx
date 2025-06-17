'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Explore() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search = '') => {
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
          setUsers(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users');
    } finally {
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchValue = formData.get('search');
    await fetchUsers(searchValue);
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

 

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {/* Header */}
      <header className="header">
        <Link href="/Home">
          <Image 
            src="/icon.jpg"
            alt="Logo" 
            width={52} 
            height={52}
            priority
            style={{borderRadius: 50, cursor: 'pointer', display: 'block'}}
          />
        </Link>
        <nav>
          <li><Link href="/Home">Home</Link></li>
          <li><Link href="/Followers">Followers</Link></li>
          <li><Link href="/Profile">Profile</Link></li>
          <li><Link href="/Groups">Groups</Link></li>
          <li><Link href="/Notification">Notification</Link></li>
          <li><Link href="/Chats">Chats</Link></li>
        </nav>
        <button id="logout" onClick={handleLogout}>logout</button>
      </header>

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
                    <div className="user-info">
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
                    </div>
                    <button className="follow-btn">
                      Follow
                    </button>
                  </div>
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