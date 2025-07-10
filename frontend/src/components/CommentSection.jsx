
import Link from "next/link";
import Image from "next/image";
import { useState } from 'react';
import { formatDate, getProfileLink } from '../utils/helpers';

const CommentSection = ({ 
  postId, 
  showComments, 
  comments, 
  loadingComments, 
  onSendComment, 
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  if (!showComments[postId]) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.getElementById(`comment-file-${postId}`);
    if (fileInput) fileInput.value = '';
  };

  return (
    <>
      {/* Comments Section */}
      <div className="comments-section">
        {loadingComments[postId] ? (
          <div className="loading-comments">Loading comments...</div>
        ) : (
          <>
            {comments[postId] && comments[postId].length > 0 ? (
              <div className="comments-list">
                {comments[postId].map((comment) => (
                  <div key={comment.ID} className="comment-item">                    <div className="comment-header">
                      <Link href={getProfileLink(comment.UserID)} style={{textDecoration: 'none', color: 'inherit'}}>
                        <strong style={{cursor: 'pointer'}}>{comment.Username}</strong>
                      </Link>
                      <span className="comment-date">
                        {formatDate(comment.CreatedAt)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.Content}</p>
                    {comment.Avatar && (
                      <div className="comment-image">
                        <Image 
                          src={`/${comment.Avatar}`} 
                          alt="Comment attachment" 
                          width={200} 
                          height={200} 
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            marginTop: '8px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-comments">No comments yet</div>
            )}
          </>
        )}
      </div>      {/* Comment Input */}
      <div className="input-wrapper">
        <textarea 
        maxLength={100}
          placeholder="Write a comment..." 
          className="comment-input" 
          data-idpost={postId}
          id={`comment-textarea-${postId}`}
        />
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="image-preview-wrapper">
            <div className="image-preview">
              <Image 
                src={imagePreview} 
                alt="Preview" 
                width={100} 
                height={100} 
                style={{
                  maxWidth: '100px',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
              <button 
                className="remove-image-btn"
                onClick={clearImage}
                type="button"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="comment-actions">
          {/* File Input */}
          <input
            type="file"
            id={`comment-file-${postId}`}
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          
          <button 
            className="image-upload-btn"
            onClick={() => document.getElementById(`comment-file-${postId}`).click()}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
              <polyline points="21,15 16,10 5,21" strokeWidth="2"/>
            </svg>
          </button>

          <button 
            className="send-button"
            onClick={(e) => {
              const textarea = document.getElementById(`comment-textarea-${postId}`);
              if (textarea && (textarea.value.trim() || selectedImage)) {
                const commentText = textarea.value;
                onSendComment(postId, commentText, selectedImage);
                textarea.value = '';
                clearImage();
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default CommentSection;