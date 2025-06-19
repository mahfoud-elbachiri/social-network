import { useEffect, useState } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';

const FollowList = ({ isOpen, onClose, activeTab = 'followers',targetUserId }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchFollowData();
      setCurrentTab(activeTab);
    }
  }, [isOpen, activeTab, targetUserId]);

  const fetchFollowData = async () => {
    try {
      const url = targetUserId 
        ? `http://localhost:8080/follow-data?id=${targetUserId}`
        : 'http://localhost:8080/follow-data';
        
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (data && data.status) {
        setFollowers(data.followers.users || []);
        setFollowing(data.following.users || []);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const handleUserClick = (userId) => {
    onClose();
    router.push(`/Profile?id=${userId}`);
  };

  if (!isOpen) return null;

  const currentList = currentTab === 'followers' ? followers : following;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="popup-tabs">
            <button 
              className={currentTab === 'followers' ? 'active' : ''}
              onClick={() => setCurrentTab('followers')}
            >
              Followers ({followers.length})
            </button>
            <button 
              className={currentTab === 'following' ? 'active' : ''}
              onClick={() => setCurrentTab('following')}
            >
              Following ({following.length})
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="popup-list">
          {currentList.length > 0 ? (
            currentList.map((user) => (
              <div key={user.id} className="popup-user" onClick={() => handleUserClick(user.id)}>
                <Image 
                  src={user.avatar ? `/${user.avatar}` : "/icon.jpg"} 
                  alt={user.first_name}
                  width={32}
                  height={32}
                  style={{borderRadius: 50}}
                />
                <div className="popup-user-info">
                  <div className="popup-user-name">{user.first_name} {user.last_name}</div>
                  <div className="popup-user-handle">@{user.nickname}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="popup-empty">No {currentTab} found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowList;