import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from 'lucide-react';
import { formatDate, getProfileLink } from '../utils/helpers';
import CommentSection from './CommentSection';

const PostCard = ({
  post,
  showComments,
  comments,
  loadingComments,
  onCommentClick,
  onSendComment,
}) => {
  return (
    <div className="post" postid={post.ID}>
      {/* Post Header - Author Info */}
      <div className="post-header">
        <Link href={getProfileLink(post.UserID)}>
          <Image
            src={post.UserAvatar ? `/${post.UserAvatar}` : "/icon.jpg"}
            alt="Post Author Avatar"
            width={40}
            height={40}
            priority
            style={{ borderRadius: '50%', cursor: 'pointer' }}
          />
        </Link>
        <div className="post-header-text">
          <Link href={getProfileLink(post.UserID)} style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="post-author-name">{post.Username}</span>
          </Link>
          <span className="post-date">{formatDate(post.CreatedAt)}</span>
          {/* Privacy indicator */}
          {post.Privacy && post.Privacy !== 'public' && (
            <span className={`privacy-badge ${post.Privacy.replace(' ', '-')}`}>
              {post.Privacy === 'private' && '🔒'}
              {post.Privacy === 'almost private' && '👥'}
              {post.Privacy}
            </span>
          )}
        </div>
      </div>

      {/* Post Title */}
      {post.Title && <h4 className="post-title">{post.Title}</h4>}

      {/* Post Image - BEFORE description */}
      {post.Avatar && (
        <div className="post-image">
          <Image
            src={`/${post.Avatar}`}
            alt="Post Image"
            width={600}
            height={400}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '500px',
              objectFit: 'cover',
              borderRadius: '12px',
            }}
          />
        </div>
      )}

      {/* Post Content/Description - AFTER image */}
      {post.Content && (
        <p className="post-content">{post.Content}</p>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className="comment-btn"
          data-posteid={post.ID}
          onClick={(e) => {
            e.currentTarget.setAttribute('posteid', post.ID);
            onCommentClick(e);
          }}
        >
          <MessageCircle size={20} />
          <span>{post.Nembre} Comments</span>
        </button>
      </div>

      {/* Comments Section */}
      <CommentSection
        postId={post.ID}
        showComments={showComments}
        comments={comments}
        loadingComments={loadingComments}
        onSendComment={onSendComment}
      />
    </div>
  );
};

export default PostCard;