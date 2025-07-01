"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./style.css";
import { getSocket } from "@/sock/GetSocket";
import Header from "@/components/Header";
import { useSearchParams } from 'next/navigation'

export default function HomePage() {
  const socket = getSocket();

  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [messages, setMessages] = useState([])
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    datetime: "",
  });
  const [input, setInput] = useState("")
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentImages, setCommentImages] = useState({});
  const [commentImagePreviews, setCommentImagePreviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  const [i, setI] = useState(false);

  useEffect(() => {
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setI(true);
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ content: "broadcast" }));
    } else {
      console.warn("❌ WebSocket not ready, cannot send message yet");
    }
  }, [i]);

  // Handle URL changes and browser navigation
  useEffect(() => {
    const handlePopState = (event) => {
      const urlParams = new URLSearchParams(window.location.search);
      const groupId = urlParams.get("group");

      if (groupId) {
        fetchGroupById(parseInt(groupId));
      } else {
        // Redirect to Home if no group ID is provided
        router.push("/Home");
      }
    };

    // Check URL on component mount
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get("group");
    if (groupId) {
      fetchGroupById(parseInt(groupId));
    } else {
      // Redirect to Home if no group ID is provided
      router.push("/Home");
      return;
    }

    // Listen for browser back/forward buttons
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  const fetchGroupById = async (groupId) => {
    try {
      const res = await fetch(`http://localhost:8080/group?id=${groupId}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      setGroupData(data);
      setSelectedGroup(groupId);
      setLoading(false);

      // Update URL without reloading the page
      const newUrl = `${window.location.pathname}?group=${groupId}`;
      window.history.pushState({ groupId }, "", newUrl);
    } catch (err) {
      console.error(`Failed to fetch group ${groupId}`, err);
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (userId, groupId) => {
    console.log(`Accepting request from user ${userId} for group ${groupId}`);
    try {
      await fetch("http://localhost:8080/group/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, group_id: groupId }),
      });
      fetchGroupById(groupId);
    } catch (err) {
      console.error("Failed to accept request", err);
    }
  };

  const handleRejectRequest = async (userId, groupId) => {
    try {
      await fetch("http://localhost:8080/group/reject", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, group_id: groupId }),
      });
      fetchGroupById(groupId);
    } catch (err) {
      console.error("Failed to reject request", err);
    }
  };

  const handleInviteUser = async (userId, groupId) => {
    try {
      await fetch("http://localhost:8080/group/invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, group_id: groupId }),
      });
      fetchGroupById(groupId);
    } catch (err) {
      console.error("Failed to invite user", err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setEventError('');

    try {
      const res = await fetch('http://localhost:8080/group/create-event', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventForm, group_id: selectedGroup }),
      });

      if (!res.ok) {
        const text = await res.text();

        // Handle specific backend error message
        if (text.includes("Cannot create an event in the past")) {
          setEventError("❌ You cannot create an event in the past.");
        } else {
          setEventError("❌ Failed to create event.");
        }

        // ✅ Return early without throwing so console stays clean
        return;
      }

      // ✅ Success
      setEventForm({ title: '', description: '', datetime: '' });
      fetchGroupById(selectedGroup);
    } catch (err) {
      // Only log unexpected errors
      console.error('Unexpected error:', err);
      setEventError("❌ Something went wrong. Please try again.");
    }
  };


  const handleEventRespond = async (eventId, response) => {
    try {
      await fetch("http://localhost:8080/group/event-respond", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, response }),
      });
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error("Failed to respond to event", err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPostImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCommentImageChange = (postId, e) => {
    const file = e.target.files[0];
    if (file) {
      setCommentImages({ ...commentImages, [postId]: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setCommentImagePreviews({
          ...commentImagePreviews,
          [postId]: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCommentImage = (postId) => {
    const newCommentImages = { ...commentImages };
    const newCommentImagePreviews = { ...commentImagePreviews };
    delete newCommentImages[postId];
    delete newCommentImagePreviews[postId];
    setCommentImages(newCommentImages);
    setCommentImagePreviews(newCommentImagePreviews);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("group_id", selectedGroup);
      if (postImage) {
        formData.append("image", postImage);
      }

      await fetch("http://localhost:8080/group/create-post", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      setPostContent("");
      setPostImage(null);
      setPostImagePreview(null);
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error("Failed to create post", err);
    }
  };

  const handleCreateComment = async (postId, content) => {
    try {
      const formData = new FormData();
      formData.append("post_id", postId);
      formData.append("content", content);
      formData.append("group_id", selectedGroup);

      // Add image if present
      if (commentImages[postId]) {
        formData.append("image", commentImages[postId]);
      }

      await fetch("http://localhost:8080/group/create-comment", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      // Clear comment input and image
      setCommentInputs({ ...commentInputs, [postId]: "" });
      removeCommentImage(postId);
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error("Failed to create comment", err);
    }
  };

  const backToGroups = () => {
    setSelectedGroup(null);
    setGroupData(null);

    // Update URL to remove group parameter
    const newUrl = window.location.pathname;
    window.history.pushState({}, "", newUrl);
  };

  // dont edit this . for docker container
  const getGroupImageUrl = (imageURL) => {
    if (!imageURL) return null;
    
    // Remove leading slash if present and use relative path
    // This will use the rewrite rules in next.config.mjs
    const cleanPath = imageURL.startsWith('/') ? imageURL.substring(1) : imageURL;
    return `/${cleanPath}`;
  };

  const [id, setId] = useState(null);
 
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get("group");
    setId(groupId);
    console.log('Current group id:', id);

  }, [id])
  
  const sendMssg = (socket) => {
    if (input.trim() === "") {
      return
    }
    let trimdMssg = input.trim().replace(/\s+/g, ' ')
    socket.send(JSON.stringify({ type: "groupChat", content: trimdMssg, group_id: id }))
    setInput("")
  }
  socket.onmessage = (event) => {
     const data = JSON.parse(event.data)
     if (data.grp){
      setMessages(prvData => [...prvData, data])
     }
     console.log(data);
     
  }


  // Group Detail View
  if (selectedGroup && groupData) {
    const group = groupData.Group;
    const isAdmin = groupData.IsAdmin;
    const isMemberOrCreator = group.IsCreator || group.IsMember;

    return (
      <>
        <Header />

        <div className="group-page-container">
          {/* Back Navigation */}
          <div className="back-nav">
            <button onClick={() => router.push("/Home")} className="back-btn">
              ← Back to Home
            </button>
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
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    required
                  />
                  <br />
                  <label>Description:</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value,
                      })
                    }
                  />
                  <br />
                  <label>Date/Time:</label>
                  <input
                    type="datetime-local"
                    value={eventForm.datetime}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, datetime: e.target.value })
                    }
                    required
                  />
                  <br />
                  <button type="submit">Create Event</button>

                  {eventError && (
                    <div
                      style={{
                        color: "red",
                        backgroundColor: "#ffe6e6",
                        border: "1px solid red",
                        borderRadius: "5px",
                        padding: "8px",
                        marginTop: "10px",
                        maxWidth: "400px",
                      }}
                    >
                      ⚠️ {eventError}
                    </div>
                  )}
                </form>
              </div>

              {/* List Events */}
              <div className="group-section">
                <h3 className="section-title">Group Events</h3>
                {groupData.Events && groupData.Events.length > 0 ? (
                  <ul className="event-list">
                    {groupData.Events.map((event, index) => (
                      <li key={index} className="event-item">
                        <strong>{event.Title}</strong> - {event.DateTime}
                        <br />
                        <small>{event.Description}</small>
                        <br />
                        <div style={{ display: "inline" }}>
                          <button
                            onClick={() =>
                              handleEventRespond(event.ID, "going")
                            }
                          >
                            ✅ Going
                          </button>
                          <button
                            onClick={() =>
                              handleEventRespond(event.ID, "not_going")
                            }
                          >
                            ❌ Not Going
                          </button>
                        </div>
                        {event.UserResponse === "going" && (
                          <div style={{ color: "green", marginTop: "5px" }}>
                            ✅ You're going
                          </div>
                        )}
                        {event.UserResponse === "not_going" && (
                          <div style={{ color: "red", marginTop: "5px" }}>
                            ❌ You're not going
                          </div>
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
                  />
                  <br />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  {postImagePreview && (
                    <div style={{ margin: "10px 0" }}>
                      <Image
                        src={postImagePreview}
                        alt="Preview"
                        width={200}
                        height={200}
                        style={{ objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPostImage(null);
                          setPostImagePreview(null);
                        }}
                        style={{ marginLeft: "10px" }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}

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

                        {post.ImageURL && (
                          <div style={{ margin: "10px 0" }}>
                            <Image
                              src={getGroupImageUrl(post.ImageURL)}
                              alt="Post image"
                              width={400}
                              height={300}
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        )}

                        {/* Comment Form with Image Support */}
                        <div className="comment-form">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleCreateComment(
                                post.ID,
                                commentInputs[post.ID] || ""
                              );
                            }}
                          >
                            <input
                              type="text"
                              value={commentInputs[post.ID] || ""}
                              onChange={(e) =>
                                setCommentInputs({
                                  ...commentInputs,
                                  [post.ID]: e.target.value,
                                })
                              }
                              placeholder="Write a comment..."
                              required
                            />

                            <div style={{ margin: "5px 0" }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleCommentImageChange(post.ID, e)
                                }
                                style={{ fontSize: "12px" }}
                              />
                            </div>

                            {commentImagePreviews[post.ID] && (
                              <div style={{ margin: "5px 0" }}>
                                <Image
                                  src={commentImagePreviews[post.ID]}
                                  alt="Comment preview"
                                  width={100}
                                  height={100}
                                  style={{ objectFit: "cover" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCommentImage(post.ID)}
                                  style={{
                                    marginLeft: "5px",
                                    fontSize: "12px",
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            )}

                            <button type="submit">Comment</button>
                          </form>
                        </div>

                        {/* Comment List */}
                        {post.Comments && post.Comments.length > 0 ? (
                          <ul className="comment-list">
                            {post.Comments.map((comment, commentIndex) => (
                              <li key={commentIndex} className="comment-item">
                                <div className="comment-content">
                                  <strong>{comment.Username}</strong>:{" "}
                                  {comment.Content}
                                  <small>{comment.CreatedAt}</small>
                                </div>

                                {comment.ImageURL && (
                                  <div style={{ margin: "5px 0" }}>
                                    <Image
                                      src={getGroupImageUrl(comment.ImageURL)}
                                      alt="Comment image"
                                      width={150}
                                      height={150}
                                      style={{ objectFit: "cover" }}
                                    />
                                  </div>
                                )}
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

          {/* Join Requests: only visible to Admin */}
          {isAdmin && (
            <div className="group-section">
              <h3 className="section-title">Join Requests</h3>
              {groupData.RequestedMembers &&
                groupData.RequestedMembers.length > 0 ? (
                <ul className="member-list">
                  {groupData.RequestedMembers.map((request, index) => (
                    <li key={index} className="request-item">
                      <div className="request-info">
                        <div className="request-username">
                          {request.Username}
                        </div>
                        <div className="request-status">{request.Status}</div>
                      </div>
                      <div className="action-buttons">
                        <button
                          onClick={() =>
                            handleAcceptRequest(request.UserID, group.ID)
                          }
                          className="accept-btn"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRejectRequest(request.UserID, group.ID)
                          }
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
          )}

          {/* Invite Users: visible to all group members */}
          {isMemberOrCreator && (
            <div className="group-section">
              <h3 className="section-title">Invite Users</h3>
              {groupData.InvitableUsers &&
                groupData.InvitableUsers.length > 0 ? (
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
                          onClick={() =>
                            handleInviteUser(user.UserID, group.ID)
                          }
                          className="invite-btn"
                        >
                          Invite
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  No users available for invitation.
                </div>
              )}
            </div>
          )}

          <div className="group-section">
            <h2>Group  Chat </h2>

            <div className="chat-box">
              <div className="messages" >


              </div >

              <div className="chat-input">

                <button className="emoji-button" >😊</button>

                <input onChange={(e) => setInput(e.target.value)} onKeyDown={(e)=> {if (e.key === "Enter") {sendMssg(socket) }}} value={input} type="text" placeholder="Write a message..." />
                <button onClick={() => sendMssg(socket)
                }  className='send'>Send</button>
              </div>
            </div>


          </div>

        </div>
      </>
    );
  }

  // Show loading state
  if (loading) {
    return <div className="loading">Loading group details...</div>;
  }

  // If no group data, redirect to home (this shouldn't normally happen due to useEffect redirect)
  if (!groupData) {
    router.push("/Home");
    return null;
  }

  // This return statement is never reached due to the redirects above
  return null;
}