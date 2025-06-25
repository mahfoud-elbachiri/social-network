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

  const handleAcceptRequest = async (notification) => {
    try {
      let url, body;
      
      if (notification.type === 'follow') {
        url = 'http://localhost:8080/accept-follow-request';
        body = { follower_id: notification.id.toString() };
      } else if (notification.type === 'group') {
        url = 'http://localhost:8080/accept-group-invitation';
        body = { group_id: notification.group_id.toString() };
      } else if (notification.type === 'group_join') {
        url = 'http://localhost:8080/accept-group-join-request';
        body = { 
          group_id: notification.group_id.toString(),
          requester_id: notification.requester_user_id.toString()
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to accept ${notification.type} request`);
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(notif => 
        notification.type === 'follow' 
          ? notif.id !== notification.id 
          : notif.id !== notification.id
      ));
      
      // Notify parent component about the update
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }

      console.log(`${notification.type} request accepted successfully`);
    } catch (error) {
      console.error(`Error accepting ${notification.type} request:`, error);
      setError(`Failed to accept ${notification.type} request`);
    }
  };

  const handleRejectRequest = async (notification) => {
    try {
      let url, body;
      
      if (notification.type === 'follow') {
        url = 'http://localhost:8080/reject-follow-request';
        body = { follower_id: notification.id.toString() };
      } else if (notification.type === 'group') {
        url = 'http://localhost:8080/reject-group-invitation';
        body = { group_id: notification.group_id.toString() };
      } else if (notification.type === 'group_join') {
        url = 'http://localhost:8080/reject-group-join-request';
        body = { 
          group_id: notification.group_id.toString(),
          requester_id: notification.requester_user_id.toString()
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject ${notification.type} request`);
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(notif => 
        notification.type === 'follow' 
          ? notif.id !== notification.id 
          : notif.id !== notification.id
      ));
      
      // Notify parent component about the update
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }

      console.log(`${notification.type} request rejected successfully`);
    } catch (error) {
      console.error(`Error rejecting ${notification.type} request:`, error);
      setError(`Failed to reject ${notification.type} request`);
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
          <h3>Notifications</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="notification-content">
          {loading ? (
            <div className="notification-loading">Loading...</div>
          ) : error ? (
            <div className="notification-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No pending notifications</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div key={`${notification.type}-${notification.id}`} className="notification-item">
                  <div className="notification-user">
                    <Image
                      src={
                        notification.type === 'follow' 
                          ? (notification.avatar ? `/${notification.avatar}` : "/icon.jpg")
                          : notification.type === 'group'
                          ? (notification.inviter_avatar ? `/${notification.inviter_avatar}` : "/icon.jpg")
                          : notification.type === 'event'
                          ? (notification.creator_avatar ? `/${notification.creator_avatar}` : "/icon.jpg")
                          : (notification.requester_avatar ? `/${notification.requester_avatar}` : "/icon.jpg")
                      }
                      alt={
                        notification.type === 'follow' 
                          ? `${notification.first_name} avatar`
                          : notification.type === 'group'
                          ? `${notification.inviter_first_name} avatar`
                          : notification.type === 'event'
                          ? `${notification.creator_first_name} avatar`
                          : `${notification.requester_first_name} avatar`
                      }
                      width={40}
                      height={40}
                      className="notification-avatar"
                    />
                    <div className="notification-details">
                      <div className="notification-name">
                        {notification.type === 'follow' 
                          ? `${notification.first_name} ${notification.last_name}`
                          : notification.type === 'group'
                          ? `${notification.inviter_first_name} ${notification.inviter_last_name}`
                          : notification.type === 'event'
                          ? `${notification.creator_first_name} ${notification.creator_last_name}`
                          : `${notification.requester_first_name} ${notification.requester_last_name}`
                        }
                      </div>
                      <div className="notification-nickname">
                        {notification.type === 'follow' 
                          ? `@${notification.nickname}`
                          : notification.type === 'group'
                          ? `@${notification.inviter_nickname}`
                          : notification.type === 'event'
                          ? `@${notification.creator_nickname}`
                          : `@${notification.requester_nickname}`
                        }
                      </div>
                      {notification.type === 'group' && (
                        <div className="notification-group">
                          Invited you to group: <strong>{notification.group_name}</strong>
                        </div>
                      )}
                      {notification.type === 'group_join' && (
                        <div className="notification-group">
                          Wants to join your group: <strong>{notification.group_name}</strong>
                        </div>
                      )}
                      {notification.type === 'event' && (
                        <div className="notification-group">
                          Created a new event: <strong>{notification.event_title}</strong> in <strong>{notification.group_name}</strong>
                        </div>
                      )}
                      <div className="notification-time">{formatDate(notification.created_at)}</div>
                    </div>
                  </div>
                  
                  {notification.type !== 'event' && (
                    <div className="notification-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleAcceptRequest(notification)}
                        disabled={loading}
                      >
                        Accept
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectRequest(notification)}
                        disabled={loading}
                      >
                        Reject
                      </button>
                    </div>
                  )}
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