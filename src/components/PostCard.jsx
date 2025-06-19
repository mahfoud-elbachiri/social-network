import Link from "next/link";
import Image from "next/image";
import { formatDate, getProfileLink } from '../utils/helpers';
import CommentSection from './CommentSection';

const PostCard = ({ 
  post, 
  currentUserId, 
  showComments, 
  comments, 
  loadingComments, 
  onCommentClick, 
  onSendComment 
}) => {
  return (
    <div className="post" postid={post.ID}>
      <div className="post-header">
        <Link href={getProfileLink(post.UserID, currentUserId)}>
          <Image
            src={post.UserAvatar ? `/${post.UserAvatar}` : "/icon.jpg"}
            alt="Post Author Avatar"
            width={28}
            height={28}
            priority
            style={{borderRadius: 50, cursor: 'pointer'}}
          />
        </Link>        <div className="post-header-text">
          <Link href={getProfileLink(post.UserID, currentUserId)} style={{textDecoration: 'none', color: 'inherit'}}>
            <span style={{cursor: 'pointer'}}>{post.Username}</span>
          </Link>
          <span style={{color: '#6c757d'}}> {formatDate(post.CreatedAt)}</span>
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
      
      <h4>{post.Title}</h4>
      <p>{post.Content}</p>
      
      {/* Display post image if it exist */}
      {post.Avatar && (
        <div className="post-image">
          <Image
            src={`/${post.Avatar}`}
            alt="Post Image"
            width={400}
            height={300}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginTop: '10px'
            }}
          />
        </div>
      )}
      
      <div id="comment" className="of" posteid={post.ID} onClick={onCommentClick}>
        {post.Nembre} 💬
      </div>

      <CommentSection
        postId={post.ID}
        showComments={showComments}
        comments={comments}
        loadingComments={loadingComments}
        onSendComment={onSendComment}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default PostCard;