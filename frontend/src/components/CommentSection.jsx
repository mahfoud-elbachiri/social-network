
import Link from "next/link";
import Image from "next/image";
import { useState } from 'react';
import { Send, ImagePlus, X } from 'lucide-react';
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
    const fileInput = document.getElementById(`comment-file-${postId}`);
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="comments-section">
      {/* Comments List */}
      {loadingComments[postId] ? (
        <div className="loading-comments">Loading comments...</div>
      ) : (
        <>
          {comments[postId] && comments[postId].length > 0 ? (
            <div className="comments-list">
              {comments[postId].map((comment) => (
                <div key={comment.ID} className="comment-item">
                  <div className="comment-header">
                    <Link href={getProfileLink(comment.UserID)} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <strong>{comment.Username}</strong>
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

      {/* Comment Input Area */}
      <div className="comment-input-wrapper">
        <div className="comment-input-row">
          {/* Hidden File Input */}
          <input
            type="file"
            id={`comment-file-${postId}`}
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          {/* Image Upload Button */}
          <button
            className="comment-icon-btn"
            onClick={() => document.getElementById(`comment-file-${postId}`).click()}
            type="button"
            title="Add image"
          >
            <ImagePlus size={20} />
          </button>

          {/* Textarea */}
          <textarea
            maxLength={100}
            placeholder="Write a comment..."
            className="comment-textarea"
            data-idpost={postId}
            id={`comment-textarea-${postId}`}
            rows={1}
          />

          {/* Send Button */}
          <button
            className="comment-send-btn"
            onClick={(e) => {
              const textarea = document.getElementById(`comment-textarea-${postId}`);
              if (textarea && (textarea.value.trim() || selectedImage)) {
                const commentText = textarea.value;
                onSendComment(postId, commentText, selectedImage);
                textarea.value = '';
                clearImage();
              }
            }}
            title="Send comment"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="comment-image-preview">
            <Image
              src={imagePreview}
              alt="Preview"
              width={80}
              height={80}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
            <button
              className="comment-remove-image"
              onClick={clearImage}
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;