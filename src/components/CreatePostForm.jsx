import { useState } from 'react';
import { postApi } from '../utils/api'

const CreatePostForm = ({ onPostCreated, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = new FormData(e.target);

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
              defaultChecked 
              disabled={isSubmitting}
            />
            <span> Public</span>
          </label>
          <label className="radio-option-inline">
            <input 
              type="radio" 
              name="privacy" 
              value="private" 
              disabled={isSubmitting}
            />
            <span> Private</span>
          </label>
          <label className="radio-option-inline">
            <input 
              type="radio" 
              name="privacy" 
              value="almost private" 
              disabled={isSubmitting}
            />
            <span> almost private</span>
          </label>
        </div>

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