
import Link from "next/link";
import { formatDate, getProfileLink } from '../utils/helpers';

const CommentSection = ({ 
  postId, 
  showComments, 
  comments, 
  loadingComments, 
  onSendComment, 
  currentUserId 
}) => {
  if (!showComments[postId]) return null;

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
                  <div key={comment.ID} className="comment-item">
                    <div className="comment-header">
                      <Link href={getProfileLink(comment.UserID, currentUserId)} style={{textDecoration: 'none', color: 'inherit'}}>
                        <strong style={{cursor: 'pointer'}}>{comment.Username}</strong>
                      </Link>
                      <span className="comment-date">
                        {formatDate(comment.CreatedAt)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.Content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-comments">No comments yet</div>
            )}
          </>
        )}
      </div>

      {/* Comment Input */}
      <div className="input-wrapper">
        <textarea 
          placeholder="Write a comment..." 
          className="comment-input" 
          data-idpost={postId}
          id={`comment-textarea-${postId}`}
        />
        <button 
          className="send-button"
          onClick={(e) => {
            const textarea = document.getElementById(`comment-textarea-${postId}`);
            if (textarea && textarea.value) {
              const commentText = textarea.value;
              if (commentText.trim()) {
                onSendComment(postId, commentText);
                textarea.value = '';
              }
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </>
  );
};

export default CommentSection;