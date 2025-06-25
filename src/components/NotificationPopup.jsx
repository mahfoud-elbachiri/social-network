"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import './NotificationPopup.css';

const NotificationPopup = ({ isOpen, onClose, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      
      const notificationInterval = setInterval(() => {
        fetchNotifications();
      }, 1000); 

      // Cleanup interval when popup closes or component unmounts
      return () => clearInterval(notificationInterval);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/notifications', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      if (data.status) {
        setNotifications(data.notifications || []);
      } else {
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (followerId) => {
    try {
      const response = await fetch('http://localhost:8080/accept-follow-request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ follower_id: followerId.toString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept follow request');
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(notif => notif.id !== followerId));
      
      // Notify parent component about the update
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }

      console.log('Follow request accepted successfully');
    } catch (error) {
      console.error('Error accepting follow request:', error);
      setError('Failed to accept follow request');
    }
  };

  const handleRejectRequest = async (followerId) => {
    try {
      const response = await fetch('http://localhost:8080/reject-follow-request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ follower_id: followerId.toString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject follow request');
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(notif => notif.id !== followerId));
      
      // Notify parent component about the update
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }

      console.log('Follow request rejected successfully');
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      setError('Failed to reject follow request');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-popup-overlay" onClick={onClose}>
      <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Follow Requests</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="notification-content">
          {loading ? (
            <div className="notification-loading">Loading...</div>
          ) : error ? (
            <div className="notification-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No pending follow requests</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-user">
                    <Image
                      src={notification.avatar ? `/${notification.avatar}` : "/icon.jpg"}
                      alt={`${notification.first_name} avatar`}
                      width={40}
                      height={40}
                      className="notification-avatar"
                    />
                    <div className="notification-details">
                      <div className="notification-name">
                        {notification.first_name} {notification.last_name}
                      </div>
                      <div className="notification-nickname">@{notification.nickname}</div>
                      <div className="notification-time">{formatDate(notification.created_at)}</div>
                    </div>
                  </div>
                  
                  <div className="notification-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => handleAcceptRequest(notification.id)}
                      disabled={loading}
                    >
                      Accept
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleRejectRequest(notification.id)}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
