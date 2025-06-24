'use client';
import { useCallback, useEffect, useState } from 'react';
import "./style.css";

export default function HomePage() {
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', description: '', datetime: '' });
  const [postContent, setPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/groupPage', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      setGroups(data.Groups || []);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  }, []);

  // Handle URL changes and browser navigation
  useEffect(() => {
    const handlePopState = (event) => {
      const urlParams = new URLSearchParams(window.location.search);
      const groupId = urlParams.get('group');
      
      if (groupId) {
        fetchGroupById(parseInt(groupId));
      } else {
        setSelectedGroup(null);
        setGroupData(null);
      }
    };

    // Check URL on component mount
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('group');
    if (groupId) {
      fetchGroupById(parseInt(groupId));
    }

    // Listen for browser back/forward buttons
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8080/create-group', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowModal(false);
      setForm({ title: '', description: '' });
      fetchGroups();
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  const handleJoin = async (groupId) => {
    console.log(`Joining group with ID: ${groupId}`);
    
    try {
      await fetch('http://localhost:8080/join-group', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      fetchGroups();
    } catch (err) {
      console.error('Failed to join group', err);
    }
  };

  const acceptInvite = async (groupId) => {
    try {
      await fetch('http://localhost:8080/group/accept-invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      fetchGroups();
    } catch (err) {
      console.error('Failed to accept invite', err);
    }
  };

  const rejectInvite = async (groupId) => {
    try {
      await fetch('http://localhost:8080/group/reject-invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      fetchGroups();
    } catch (err) {
      console.error('Failed to reject invite', err);
    }
  };

  const fetchGroupById = async (groupId) => {
    try {
      const res = await fetch(`http://localhost:8080/group?id=${groupId}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await res.json();
      setGroupData(data);
      setSelectedGroup(groupId);
      
      // Update URL without reloading the page
      const newUrl = `${window.location.pathname}?group=${groupId}`;
      window.history.pushState({ groupId }, '', newUrl);
      
    } catch (err) {
      console.error(`Failed to fetch group ${groupId}`, err);
    }
  };

  const handleAcceptRequest = async (userId, groupId) => {
    console.log(`Accepting request from user ${userId} for group ${groupId}`);
    try {
      await fetch('http://localhost:8080/group/accept', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, group_id: groupId }),
      });
      fetchGroupById(groupId);
    } catch (err) {
      console.error('Failed to accept request', err);
    }
  };

  const handleRejectRequest = async (userId, groupId) => {
    try {
      await fetch('http://localhost:8080/group/reject', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, group_id: groupId }),
      });
      fetchGroupById(groupId);
    } catch (err) {
      console.error('Failed to reject request', err);
    }
  };

  const handleInviteUser = async (userId, groupId) => {
    try {
      await fetch('http://localhost:8080/group/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, group_id: groupId }),
      });
      fetchGroupById(groupId);
    } catch (err) {
      console.error('Failed to invite user', err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8080/group/create-event', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventForm, group_id: selectedGroup }),
      });
      setEventForm({ title: '', description: '', datetime: '' });
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error('Failed to create event', err);
    }
  };

  const handleEventRespond = async (eventId, response) => {
    try {
      await fetch('http://localhost:8080/group/event-respond', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, response }),
      });
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error('Failed to respond to event', err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8080/group/create-post', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent, group_id: selectedGroup }),
      });
      setPostContent('');
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  const handleCreateComment = async (postId, content) => {
    try {
      await fetch('http://localhost:8080/group/create-comment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content, group_id: selectedGroup }),
      });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error('Failed to create comment', err);
    }
  };

  const backToGroups = () => {
    setSelectedGroup(null);
    setGroupData(null);
    
    // Update URL to remove group parameter
    const newUrl = window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

  // Group Detail View
  if (selectedGroup && groupData) {
    const group = groupData.Group;
    const isAdmin = groupData.IsAdmin;
    const isMemberOrCreator = group.IsCreator || group.IsMember;

    return (
      <div className="group-page-container">
        {/* Back Navigation */}
        <div className="back-nav">
          <button onClick={backToGroups} className="back-btn">← Back to Groups</button>
        </div>

        {/* Group Header */}
        <div className="group-header">
          <h2>{group.Title}</h2>
          <p className="group-description">{group.Description}</p>
        </div>

        {isMemberOrCreator ? (
          <>
            {/* Group Members Section */}
            <div className="group-section">
              <h3 className="section-title">Group Members</h3>
              {groupData.Members && groupData.Members.length > 0 ? (
                <ul className="member-list">
                  {groupData.Members.map((member, index) => (
                    <li key={index} className="member-item">
                      <div className="member-info">
                        <div className="member-name">{member.Username}</div>
                        <div className="member-role">{member.Role}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No members yet.</div>
              )}
            </div>

            {/* Create Event Form */}
            <div className="group-section">
              <h3 className="section-title">Create Event</h3>
              <form onSubmit={handleCreateEvent}>
                <label>Title:</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                /><br />
                <label>Description:</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                /><br />
                <label>Date/Time:</label>
                <input
                  type="datetime-local"
                  value={eventForm.datetime}
                  onChange={(e) => setEventForm({ ...eventForm, datetime: e.target.value })}
                  required
                /><br />
                <button type="submit">Create Event</button>
              </form>
            </div>

            {/* List Events */}
            <div className="group-section">
              <h3 className="section-title">Group Events</h3>
              {groupData.Events && groupData.Events.length > 0 ? (
                <ul className="event-list">
                  {groupData.Events.map((event, index) => (
                    <li key={index} className="event-item">
                      <strong>{event.Title}</strong> - {event.DateTime}<br />
                      <small>{event.Description}</small><br />
                      <div style={{ display: 'inline' }}>
                        <button onClick={() => handleEventRespond(event.ID, 'going')}>
                          ✅ Going
                        </button>
                        <button onClick={() => handleEventRespond(event.ID, 'not_going')}>
                          ❌ Not Going
                        </button>
                      </div>
                      {event.UserResponse === 'going' && (
                        <div style={{ color: 'green', marginTop: '5px' }}>✅ You're going</div>
                      )}
                      {event.UserResponse === 'not_going' && (
                        <div style={{ color: 'red', marginTop: '5px' }}>❌ You're not going</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No events yet.</div>
              )}
            </div>

            {/* Group Posts Section */}
            <div className="group-section">
              <h3 className="section-title">Group Posts</h3>

              {/* Create Post */}
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write something to the group..."
                  required
                /><br />
                <button type="submit">Post</button>
              </form>

              {/* List of Posts */}
              {groupData.Posts && groupData.Posts.length > 0 ? (
                <ul className="post-list">
                  {groupData.Posts.map((post, index) => (
                    <li key={index} className="post-item">
                      <div className="post-header">
                        <strong>{post.Username}</strong>
                        <small>{post.CreatedAt}</small>
                      </div>
                      <p className="post-content">{post.Content}</p>

                      {/* Comment Form */}
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateComment(post.ID, commentInputs[post.ID] || '');
                      }}>
                        <input
                          type="text"
                          value={commentInputs[post.ID] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.ID]: e.target.value })}
                          placeholder="Write a comment..."
                          required
                        />
                        <button type="submit">Comment</button>
                      </form>

                      {/* Comment List */}
                      {post.Comments && post.Comments.length > 0 ? (
                        <ul className="comment-list">
                          {post.Comments.map((comment, commentIndex) => (
                            <li key={commentIndex} className="comment-item">
                              <strong>{comment.Username}</strong>: {comment.Content}
                              <small>{comment.CreatedAt}</small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="empty-state">No comments yet.</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No posts yet.</div>
              )}
            </div>
          </>
        ) : (
          <div className="no-access-message">
            🔒 You are not a member of this group and cannot view its details.
          </div>
        )}

        {/* Admin Sections */}
        {isAdmin && (
          <>
            {/* Join Requests Section */}
            <div className="group-section">
              <h3 className="section-title">Join Requests</h3>
              {groupData.RequestedMembers && groupData.RequestedMembers.length > 0 ? (
                <ul className="member-list">
                  {groupData.RequestedMembers.map((request, index) => (
                    <li key={index} className="request-item">
                      <div className="request-info">
                        <div className="request-username">{request.Username}</div>
                        <div className="request-status">{request.Status}</div>
                      </div>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleAcceptRequest(request.UserID, group.ID)}
                          className="accept-btn"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request.UserID, group.ID)}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No pending join requests.</div>
              )}
            </div>

            {/* Invite Users Section */}
            <div className="group-section">
              <h3 className="section-title">Invite Users</h3>
              {groupData.InvitableUsers && groupData.InvitableUsers.length > 0 ? (
                <ul className="member-list">
                  {groupData.InvitableUsers.map((user, index) => (
                    <li key={index} className="invite-item">
                      <div className="invite-username">{user.Username}</div>
                      {user.Invited ? (
                        <button type="button" className="invite-btn" disabled>
                          Invited
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleInviteUser(user.UserID, group.ID)}
                          className="invite-btn"
                        >
                          Invite
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No users available for invitation.</div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Groups List View
  return (
    <div className="group-home">
      <div className="group-logo">
        <button onClick={() => setShowModal(true)} className="btn">
          Create Group
        </button>
      </div>

      <div className="search-box">
        <input type="text" placeholder="Search group..." />
      </div>

      <div className="group-contacts">
        <h3>groups</h3>
        <ul>
          {groups?.map(group => (
            <li key={group.ID}>
              {group.IsCreator ? (
                <div onClick={() => fetchGroupById(group.ID)} className="group-item clickable">
                  <strong>{group.Title}</strong><br />
                  <small>{group.Description}</small><br />
                  <span style={{ fontSize: '12px', color: 'gray' }}>You are the admin</span>
                </div>
              ) : group.IsMember ? (
                <div onClick={() => fetchGroupById(group.ID)} className="group-item clickable">
                  <strong>{group.Title}</strong><br />
                  <small>{group.Description}</small><br />
                  <span style={{ color: 'green', fontWeight: 'bold', marginTop: '5px', display: 'inline-block' }}>
                    You are a member of this group
                  </span>
                </div>
              ) : group.IsRequested ? (
                <div className="group-item">
                  <strong>{group.Title}</strong><br />
                  <small>{group.Description}</small><br />
                  <span style={{ color: 'orange', fontStyle: 'italic', marginTop: '5px', display: 'inline-block' }}>
                    Your request is pending
                  </span>
                </div>
              ) : group.IsInvited ? (
                <div className="group-item">
                  <strong>{group.Title}</strong><br />
                  <small>{group.Description}</small><br />
                  <div style={{ display: 'inline', marginTop: '5px' }}>
                    <button onClick={() => acceptInvite(group.ID)}>Accept</button>
                    <button onClick={() => rejectInvite(group.ID)}>Reject</button>
                  </div>
                </div>
              ) : (
                <div className="group-item">
                  <strong>{group.Title}</strong><br />
                  <small>{group.Description}</small><br />
                  <div style={{ marginTop: '5px' }}>
                    <button onClick={() => handleJoin(group.ID)}>Join</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div id="create-group-form" className="modal">
          <form onSubmit={handleCreateGroup}>
            <h2>Create a New Group</h2>
            <label>
              Title:
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Description:
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}