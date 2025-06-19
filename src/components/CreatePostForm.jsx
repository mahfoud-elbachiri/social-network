import { useState, useEffect } from 'react';
import { postApi } from '../utils/api'

const CreatePostForm = ({ onPostCreated, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  // Fetch followers when privacy is set to private
  useEffect(() => {
    if (privacy === 'private') {
      fetchFollowers();
    } else {
      setSelectedFollowers([]);
    }
  }, [privacy]);

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const response = await fetch('http://localhost:8080/follow-data', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (data && data.status) {
        setFollowers(data.followers.users || []);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setError('Failed to load followers');
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handlePrivacyChange = (newPrivacy) => {
    setPrivacy(newPrivacy);
  };

  const handleFollowerToggle = (followerId) => {
    setSelectedFollowers(prev => {
      if (prev.includes(followerId)) {
        return prev.filter(id => id !== followerId);
      } else {
        return [...prev, followerId];
      }
    });
  };

  const handleSelectAllFollowers = () => {
    if (selectedFollowers.length === followers.length) {
      setSelectedFollowers([]);
    } else {
      setSelectedFollowers(followers.map(f => f.id));
    }
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation: Private posts must have selected followers
    if (privacy === 'private' && followers.length > 0 && selectedFollowers.length === 0) {
      setError('Please select at least one follower for private posts.');
      setIsSubmitting(false);
      return;
    }

    const form = new FormData(e.target);

    // Add selected followers for private posts
    if (privacy === 'private' && selectedFollowers.length > 0) {
      form.append('selected_followers', JSON.stringify(selectedFollowers));
    }

    try {
      const data = await postApi.createPost(form);
      
      if (data && data.status) {
        onClose();
        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        setError(data?.error || 'Failed to create post');
      }
    } catch (error) {
      setError('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <form name="creatpost" onSubmit={handleSubmit}>
        <div className="form-group">
          <div>
            <span 
              className="material-icons" 
              id="close"
              onClick={onClose}
              style={{cursor: 'pointer'}}
            >
              close
            </span>
            <label>Post Title</label>
            <input 
              type="text" 
              name="title" 
              className="form-control" 
              placeholder="Enter post title" 
              required 
              disabled={isSubmitting}
            />
          </div>
        </div>
        <br />
        
        <div className="post-imagee">
          <label>add Image or gif (Optional)</label>
          <br />
          <input 
            type="file" 
            name="avatar" 
            accept="image/*" 
            disabled={isSubmitting}
          />
        </div>
        <br />
          <div className="radio-group-inline">
          <label className="radio-option-inline">
            <input 
              type="radio" 
              name="privacy" 
              value="public" 
              checked={privacy === 'public'}
              onChange={(e) => handlePrivacyChange(e.target.value)}
              disabled={isSubmitting}
            />
            <span> Public</span>
          </label>
          <label className="radio-option-inline">
            <input 
              type="radio" 
              name="privacy" 
              value="private" 
              checked={privacy === 'private'}
              onChange={(e) => handlePrivacyChange(e.target.value)}
              disabled={isSubmitting}
            />
            <span> Private</span>
          </label>
          <label className="radio-option-inline">
            <input 
              type="radio" 
              name="privacy" 
              value="almost private" 
              checked={privacy === 'almost private'}
              onChange={(e) => handlePrivacyChange(e.target.value)}
              disabled={isSubmitting}
            />
            <span> Almost Private</span>
          </label>
        </div>

        {/* Follower Selection for Private Posts */}
        {privacy === 'private' && (
          <div className="follower-selection">
            <div className="follower-selection-header">
              <h4>Select followers who can see this post:</h4>
              {loadingFollowers ? (
                <p>Loading followers...</p>
              ) : followers.length > 0 ? (
                <div className="select-all-container">
                  <button 
                    type="button" 
                    onClick={handleSelectAllFollowers}
                    className="select-all-btn"
                    disabled={isSubmitting}
                  >
                    {selectedFollowers.length === followers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="selected-count">
                    {selectedFollowers.length} of {followers.length} selected
                  </span>
                </div>
              ) : (
                <p style={{color: '#666', fontStyle: 'italic'}}>
                  You don't have any followers yet.
                </p>
              )}
            </div>

            {followers.length > 0 && (
              <div className="followers-list">
                {followers.map((follower) => (
                  <div key={follower.id} className="follower-item">
                    <label className="follower-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFollowers.includes(follower.id)}
                        onChange={() => handleFollowerToggle(follower.id)}
                        disabled={isSubmitting}
                      />
                      <div className="follower-info">
                        <img 
                          src={follower.avatar ? `/${follower.avatar}` : "/icon.jpg"} 
                          alt={follower.first_name}
                          className="follower-avatar"
                        />
                        <div className="follower-details">
                          <span className="follower-name">
                            {follower.first_name} {follower.last_name}
                          </span>
                          <span className="follower-nickname">
                            @{follower.nickname}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {privacy === 'private' && selectedFollowers.length === 0 && followers.length > 0 && (
              <p className="warning-message">
                ⚠️ Please select at least one follower to see this private post.
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Post Content</label>
          <textarea 
            className="form-control" 
            name="content" 
            rows="5" 
            placeholder="Write your post content" 
            required
            disabled={isSubmitting}
          />
        </div>
        
        {error && (
          <p id="error-message-creatpost" style={{color: 'red'}}>
            {error}
          </p>
        )}
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Submit Post'}
        </button>
      </form>
    </div>
  );
};

export default CreatePostForm;  