// components/ProfileCard.jsx
import Image from "next/image";
import FollowButton from '@/components/FollowButton';

const ProfileCard = ({ 
  profile, 
  isOwnProfile, 
  onPrivacyToggle, 
  updatingPrivacy, 
  isPrivateView = false, 
  isPrivatePosts = false,
  targetid 
}) => (
  <div className="profile-card">
    <div className="profile-header">
      <Image
        src={profile.avatar ? `/${profile.avatar}` : "/icon.jpg"}
        alt="Profile Avatar"
        width={80}
        height={80}
        priority
        style={{borderRadius: 50}}
      />
      <div className="profile-info">
        <h2>{profile.first_name} {profile.last_name}</h2>
        <p className="nickname">@{profile.nickname}</p>
        
        {/* Only show privacy toggle for own profile */}
        {isOwnProfile && (
          <div className="privacy-toggle">
            <span className={`privacy-badge ${profile.is_private ? 'private' : 'public'}`}>
              {profile.is_private ? '🔒 Private' : '🌍 Public'}
            </span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={profile.is_private}
                onChange={onPrivacyToggle}
                disabled={updatingPrivacy}
              />
              <span className="slider"></span>
            </label>
            {updatingPrivacy && <span className="updating-text">Updating...</span>}
          </div>
        )}
        
        {/* Show privacy status for other users */}
        {!isOwnProfile && (
          <div className="privacy-status">
            <span className={`privacy-badge ${profile.is_private ? 'private' : 'public'}`}>
              {profile.is_private ? '🔒 Private' : '🌍 Public'}
            </span>
            <FollowButton targetUserid={targetid} isPrivateView={isPrivateView} />
          </div>
        )}
      </div>
    </div>
    
     {/* Show detailed info only if not private posts or if is own profile */}
    {(isOwnProfile || !isPrivatePosts) && (
      <div className="profile-details">
        <div className="detail-item">
          <strong>Email:</strong> {profile.email}
        </div>
        <div className="detail-item">
          <strong>Age:</strong> {profile.age}
        </div>
        <div className="detail-item">
          <strong>Gender:</strong> {profile.gender}
        </div>
        {profile.about_me && (
          <div className="detail-item">
            <strong>About:</strong> {profile.about_me}
          </div>
        )}
      </div>
    )}
    
    {/* Show message for private profile or private posts */}
    {(isPrivatePosts) && !isOwnProfile && (
      <div className="private-details-message">
        <p>🔒 Additional details are private</p>
      </div>
    )}
  </div>
);

export default ProfileCard;