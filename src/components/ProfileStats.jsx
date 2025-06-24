import { useEffect, useState } from 'react';
import FollowList from '@/components/Followlist';

const ProfileStats = ({ postsCount, isPrivateView, isOwnProfile, targetUserId }) => {
  const [followData, setFollowData] = useState({ 
    followers: { count: 0 }, 
    following: { count: 0 } 
  });
  const [showPopup, setShowPopup] = useState(false);
  const [popupTab, setPopupTab] = useState('followers');

  useEffect(() => {
    fetchFollowData();
  }, [targetUserId]);

  const fetchFollowData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/follow-data?id=${targetUserId}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (data && data.status) {
        console.log("data for follow :",data);
        
        setFollowData(data);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const openPopup = (tab) => {
    setPopupTab(tab);
    setShowPopup(true);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  return (
    <>
      <aside className="contacts">
        <div style={{marginBottom: '1rem'}}>
          <h3>Profile Stats</h3>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <strong>{postsCount}</strong>
            <span>Posts</span>
          </div>
          <div className="stat-item clickable-stat" onClick={() => openPopup('followers')}>
            <strong>{followData.followers.count}</strong>
            <span>Followers</span>
          </div>
          <div className="stat-item clickable-stat" onClick={() => openPopup('following')}>
            <strong>{followData.following.count}</strong>
            <span>Following</span>
          </div>
        </div>
        {isPrivateView && !isOwnProfile && (
          <div style={{
            marginTop: '1rem',
            padding: '0.5rem',
            background: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#6c757d',
            textAlign: 'center'
          }}>
            Some stats are private
          </div>
        )}
      </aside>

      <FollowList 
        isOpen={showPopup}
        onClose={handlePopupClose}
        activeTab={popupTab}
        targetUserId={targetUserId}
      />
    </>
  );
};

export default ProfileStats;