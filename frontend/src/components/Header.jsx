"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { handleLogout } from '@/utils/helpers';
import { userApi } from '@/utils/api';
import NotificationPopup from './NotificationPopup';
import { getSocket } from '@/sock/GetSocket';

const Header = () => {
  const [userAvatar, setUserAvatar] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Chat notification states
  const [chatNotification, setChatNotification] = useState(null);
  const [username, setUsername] = useState("");
  const socket = getSocket();
  useEffect(() => {
    fetchUserInfo();
    fetchNotificationCount();
    
    const notificationInterval = setInterval(() => {
      fetchNotificationCount();
    }, 1000); 

    return () => clearInterval(notificationInterval);
  }, []);

  // Chat notification logic
  const showChatNotification = (sender) => {
    let id
    clearTimeout(id)
    setChatNotification({ sender });

    id = setTimeout(() => {
        setChatNotification(null);
    }, 5000);
  }

  useEffect(() => {
    if (!username || !socket) return;

    socket.onopen = () => {
        console.log('✅ Global Chat Notifications WebSocket connected')
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ content: "broadcast" }));
    }

    const handleMessage = (event) => {
        const data = JSON.parse(event.data)
        
        // Only handle direct messages for notifications (not group chat)
        if (data.type !== "users" && data.receiver === username && !data.group_id && data.sender) {
            showChatNotification(data.sender)
        }
    }

    socket.addEventListener('message', handleMessage);

    return () => {
        socket.removeEventListener('message', handleMessage);
    }
  }, [username, socket]);

  const fetchUserInfo = async () => {
    try {
      const data = await userApi.fetchUserStatus();
      if (data && data.status) {
        if (data.avatar) {
          setUserAvatar(data.avatar);
        }
        if (data.user_id) {
          setCurrentUserId(data.user_id);
        }
        if (data.name) {
          setUsername(data.name);
        }
      }
    } catch (error) {
      console.error('Error fetching user info in header:', error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('http://localhost:8080/notifications', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          setNotificationCount(data.count || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotificationPopup(true);
  };

  const handleNotificationUpdate = () => {
    // Refresh notification count when notifications are updated
    fetchNotificationCount();
  };

  // Ensure we have a valid avatar path
  const getAvatarSrc = () => {
    return userAvatar ? `/${userAvatar}` : "/icon.jpg";
  };
  return (
    <header className="header">
      <Link href={`/Profile?id=${currentUserId}`} >
        <Image 
          src={getAvatarSrc()}
          alt="User Avatar" 
          width={52} 
          height={52}
          priority
          style={{borderRadius: 50, cursor: 'pointer', display: 'block'}}
        />      </Link>   
          <Link href="/Home" >
            <Image 
              src="/icons-home.png" 
              alt="Home" 
              width={50} 
              height={50}
              className="nav-icon"
            />
          </Link>
          <Link href="/Explore">
            <Image 
              src="/explore.png" 
              alt="Explore" 
              width={36} 
              height={36}
              className="nav-icon"
            />
          </Link>

          <div className="notification-wrapper">
            <button 
              onClick={handleNotificationClick} 
              className="notification-button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
            >
              <Image 
                src="/notifications.png" 
                alt="Notification" 
                width={42} 
                height={42}
                className="nav-icon"
              />
              {notificationCount > 0 && (
                <span className="notification-badge">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>

      <button id="logout" onClick={handleLogout}>logout</button>
      
      {/* Chat Notification Popup */}
      {chatNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#333',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontSize: '14px',
          maxWidth: '300px'
        }}>
          <strong>{chatNotification.sender}</strong> sent you a message...
        </div>
      )}
      
      {/* Notification Popup */}
      <NotificationPopup 
        isOpen={showNotificationPopup}
        onClose={() => setShowNotificationPopup(false)}
        onNotificationUpdate={handleNotificationUpdate}
      />
    </header>
  );
};

export default Header;