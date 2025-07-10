"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./style.css";
import { getSocket } from "@/sock/GetSocket";
import Header from "@/components/Header";
import UserNotFound from "@/components/UserNotFound";


export default function HomePage() {

  // Step 1: Initialize WebSocket connection and router
  const socket = getSocket();
  const chatMessagesRef = useRef(null);
  const router = useRouter();

  // Step 2: Define main component state variables
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Step 3: Define event form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    datetime: "",
  });
  const [eventError, setEventError] = useState("");

  // Step 4: Define post creation state
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);

  // Step 5: Define comment-related state
  const [commentInputs, setCommentInputs] = useState({});
  const [commentImages, setCommentImages] = useState({});
  const [commentImagePreviews, setCommentImagePreviews] = useState({});

  // Step 6: Define chat-related state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [chatOffset, setChatOffset] = useState(0);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const [creatPostError, setCreatPostError] = useState()

  const [creatComeError, setCreatComeError] = useState()

  // Step 7: WebSocket connection state
  const [i, setI] = useState(false);

  // Step 8: Function to scroll chat to bottom
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Step 9: Setup WebSocket connection and message handling
  useEffect(() => {
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setI(true);
    };

    // Handle incoming WebSocket messages
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat_message" && data.group_id === selectedGroup) {
        setChatMessages((prev) => [...prev, data]);

        // Increment unread count if chat is not visible
        if (!showChat) {
          setUnreadMessages((prev) => prev + 1);
        }
      }
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ content: "broadcast" }));
    } else {
      console.warn("❌ WebSocket not ready, cannot send message yet");
    }
  }, [i, selectedGroup, showChat]);

  // Step 10: Reset unread messages when chat is opened and auto-scroll
  useEffect(() => {
    if (showChat) setUnreadMessages(0);

    setChatMessages(prev => prev.slice(prev.length - 10));
    setHasMoreMessages(true);
    setChatOffset(10);
    // Scroll to bottom when chat is opened
    scrollToBottom(); // Small delay to ensure DOM is updated

  }, [showChat, !showChat]);

  // Step 11: Auto-scroll when new messages arrive
  useEffect(() => {
    if (showChat && chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages, showChat]);

  // Step 12: Handle URL changes and browser navigation
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

  // Step 13: Fetch group data by ID
  const fetchGroupById = async (groupId) => {
    try {
      const res = await fetch(`http://localhost:8080/group?id=${groupId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        if (!data.login || data.error) {
          router.push('/login')
          return
        }
      }

      const data = await res.json()
      console.log("========++++>>>", data);




      setGroupData(data)
      setSelectedGroup(groupId);
      setLoading(false);

      // Fetch chat messages for this group
      let offset = 0
      await fetchChatMessages(groupId, offset);

      // Update URL without reloading the page
      const newUrl = `${window.location.pathname}?group=${groupId}`;
      window.history.pushState({ groupId }, "", newUrl);
    } catch (err) {
      // console.error(`Failed to fetch group ${groupId}`, err);
      setLoading(false);
    }
  };
  // useEffect(()=>{
  //   const  fetchDta = async()=>{
  //        const urlParams = new URLSearchParams(window.location.search);
  //     const groupId = urlParams.get("group");
  //     await fetchChatMessages(groupId,0);
  //   }
  //   fetchDta()

  // },[!showChat])
  // Step 14: Fetch chat messages for the selected group
  const fetchChatMessages = async (groupId, offset, append = false) => {
    try {
      setIsLoadingMoreMessages(true);
      const res = await fetch(`http://localhost:8080/group/chat?group_id=${groupId}&num=${offset}`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const messages = await res.json();

        if (messages && messages.length > 0) {
          if (append) {
            // Prepend older messages to the beginning of the array
            setChatMessages(prev => [...messages, ...prev]);
          } else {
            // Replace all messages (initial load)
            setChatMessages(messages || []);
          }

          // Update offset for next batch
          setChatOffset(offset + 10);

          // Check if there are more messages
          if (messages.length < 10) {
            setHasMoreMessages(false);
          }
        } else {
          // No more messages available
          setHasMoreMessages(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat messages", err);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  // Step 15: Handle sending chat messages

  const handleSendChatMessag = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return;
    setChatOffset(prev => prev + 1)
    socket.send(JSON.stringify({ content: chatInput.trim(), group_id: selectedGroup, type: "groupChat" }))
    setChatInput("")
  }

  // Step 15.5: Handle chat scroll for loading more messages
  const handleChatScroll = async (e) => {
    const { scrollTop } = e.target;

    // If scrolled to top and there are more messages and not already loading
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMoreMessages) {
      // Store current scroll height to maintain scroll position
      const previousScrollHeight = chatMessagesRef.current.scrollHeight;

      // Fetch more messages
      await fetchChatMessages(selectedGroup, chatOffset, true);

      // Restore scroll position after new messages are loaded
      setTimeout(() => {
        if (chatMessagesRef.current) {
          const newScrollHeight = chatMessagesRef.current.scrollHeight;
          chatMessagesRef.current.scrollTop = newScrollHeight - previousScrollHeight;
        }
      }, 100);
    }
  };

  // Step 15.6: Reset chat state when group changes
  useEffect(() => {
    if (selectedGroup) {
      setChatMessages([]);
      setChatOffset(0);
      setHasMoreMessages(true);
    }
  }, [selectedGroup]);

  // Step 16: Handle accepting join requests
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

  // Step 17: Handle rejecting join requests
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

  // Step 18: Handle inviting users to the group
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

  // Step 19: Handle event creation with validation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setEventError('');

    if (eventForm.title.trim() === "" || eventForm.description.trim() === "" ) {
      setEventError("❌ Fill form !!")
      return
    }

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

        // Return early without throwing so console stays clean
        return;
      }

      // Success - clear form and refresh group data
      setEventForm({ title: '', description: '', datetime: '' });
      fetchGroupById(selectedGroup);
    } catch (err) {
      // Only log unexpected errors
      console.error('Unexpected error:', err);
      setEventError("❌ Something went wrong. Please try again.");
    }
  };

  // Step 20: Handle event response (going/not going)
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

  // Step 21: Handle post image selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPostImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Step 22: Handle comment image selection and preview
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

  // dont edit this . for docker container
  const getGroupImageUrl = (imageURL) => {
    if (!imageURL) return null;

    // Remove leading slash if present and use relative path
    // This will use the rewrite rules in next.config.mjs
    const cleanPath = imageURL.startsWith('/') ? imageURL.substring(1) : imageURL;
    return `/${cleanPath}`;
  };

  // Step 23: Remove comment image preview
  const removeCommentImage = (postId) => {
    const newCommentImages = { ...commentImages };
    const newCommentImagePreviews = { ...commentImagePreviews };
    delete newCommentImages[postId];
    delete newCommentImagePreviews[postId];
    setCommentImages(newCommentImages);
    setCommentImagePreviews(newCommentImagePreviews);
  };

  // Step 24: Handle creating new posts
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (postContent.trim() === "") {
      setCreatPostError("Fill description of the post")
      return
    }

    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("group_id", selectedGroup);
      if (postImage) {
        formData.append("image", postImage);
      }

      const data = await fetch("http://localhost:8080/group/create-post", {
        method: "POST",
        credentials: "include",
        body: formData,
      });



      setPostContent("");
      setPostImage(null);
      setPostImagePreview(null);
      fetchGroupById(selectedGroup);

      if (!data.ok) {

        setCreatPostError(data.statusText)

        return
      } else {
        setCreatPostError("")
      }

    } catch (err) {

      console.error("Failed to create post", err);
    }
  };

  // Step 25: Handle creating comments on posts
  const handleCreateComment = async (postId, content) => {

    if (content.trim() === "") {
      setCreatComeError("Fill comment")
      return
    }

    try {
      const formData = new FormData();
      formData.append("post_id", postId);
      formData.append("content", content);
      formData.append("group_id", selectedGroup);

      // Add image if present
      if (commentImages[postId]) {
        formData.append("image", commentImages[postId]);
      }

      const data = await fetch("http://localhost:8080/group/create-comment", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!data.ok) {

        setCreatComeError(data.statusText)

        return
      } else {
        setCreatComeError("")
      }

      // Clear comment input and image
      setCommentInputs({ ...commentInputs, [postId]: "" });
      removeCommentImage(postId);
      fetchGroupById(selectedGroup);
    } catch (err) {
      console.error("Failed to create comment", err);
    }
  };

  console.log("groups data:", groupData);

  // Step 26: Format chat message timestamps
  const formatChatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Step 27: Handle navigation back to groups list
  const backToGroups = () => {
    setSelectedGroup(null);
    setGroupData(null);

    // Update URL to remove group parameter
    const newUrl = window.location.pathname;
    window.history.pushState({}, "", newUrl);
  };

  // Step 28: Main render logic - Group Detail View
  if (selectedGroup && groupData) {
    const group = groupData.Group;
    const isAdmin = groupData.IsAdmin;
    const isMemberOrCreator = group.IsCreator || group.IsMember;

    return (
      <>
        <Header />

        <div className="group-page-container">
          {/* Step 29: Back Navigation */}
          <div className="back-nav">
            <button onClick={() => router.push("/Home")} className="back-btn">
              ← Back to Home
            </button>
          </div>

          {/* Step 30: Group Header */}
          <div className="group-header">
            <h2>{group.Title}</h2>
            <p className="group-description">{group.Description}</p>
          </div>

          {/* Step 31: Only allow access if creator or member */}
          {isMemberOrCreator ? (
            <>
              {/* Step 32: Chat Toggle Button with unread count */}
              <div className="chat-toggle-container">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="chat-toggle-btn"
                  style={{
                    position: 'relative',
                    backgroundColor: showChat ? '#4CAF50' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginBottom: '20px'
                  }}
                >
                  💬 {showChat ? 'Hide Chat' : 'Show Chat'}
                  {unreadMessages > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      backgroundColor: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadMessages}
                    </span>
                  )}
                </button>
              </div>

              {/* Step 33: Chat Section - Only visible when toggled */}
              {showChat && (
                <div className="chat-section" style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div className="chat-header" style={{
                    padding: '15px',
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#fff',
                    borderRadius: '8px 8px 0 0'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>💬 Group Chat</h3>
                  </div>

                  {/* Step 34: Chat Messages Display */}
                  <div
                    ref={chatMessagesRef}
                    className="chat-messages"
                    style={{
                      height: '300px',
                      overflowY: 'auto',
                      padding: '15px',
                      backgroundColor: '#fff',
                      scrollBehavior: 'smooth' // Smooth scrolling animation
                    }}
                    onScroll={handleChatScroll} // Attach scroll handler
                  >
                    {/* Loading indicator for older messages */}
                    {isLoadingMoreMessages && (
                      <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        Loading more messages...
                      </div>
                    )}

                    {/* No more messages indicator */}
                    {!hasMoreMessages && chatMessages.length > 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        color: '#888',
                        fontSize: '12px',
                        borderBottom: '1px solid #eee',
                        marginBottom: '10px'
                      }}>
                        — Beginning of conversation —
                      </div>
                    )}

                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg, index) => (
                        <div key={index} className="chat-message" style={{
                          marginBottom: '15px',
                          padding: '10px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '8px',
                          borderLeft: '3px solid #2196F3'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '5px'
                          }}>
                            <strong style={{ color: '#333' }}>{msg.username}</strong>
                            <small style={{ color: '#666' }}>
                              {formatChatTime(msg.timestamp)}
                            </small>
                          </div>
                          <div style={{ color: '#555' }}>{msg.message}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: '#666',
                        fontStyle: 'italic',
                        marginTop: '50px'
                      }}>
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>

                  {/* Step 35: Chat Input Form */}
                  <form style={{
                    padding: '15px',
                    borderTop: '1px solid #ddd',
                    backgroundColor: '#fff',
                    borderRadius: '0 0 8px 8px'
                  }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        maxLength={1000}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your message..."
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        required
                      />
                      <button
                        onClick={(e) => handleSendChatMessag(e)}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 36: Group Members Section */}
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

              {/* Step 37: Create Event Form */}
              <div className="group-section">
                <h3 className="section-title">Create Event</h3>
                <form onSubmit={handleCreateEvent}>
                  <label>Title:</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    required
                  />
                  <br />
                  <label>Description:</label>
                  <textarea
                  maxLength={100}
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

                  {/* Step 38: Event creation error display */}
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

              {/* Step 39: List Group Events */}
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
                        {/* Step 40: Show user's current response */}
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

              {/* Step 41: Group Posts Section */}
              <div className="group-section">
                <h3 className="section-title">Group Posts</h3>

                {/* Step 42: Create Post Form */}
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

                  {/* Step 43: Post Image Preview */}
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

                  {creatPostError && (
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
                      ⚠️ {creatPostError}
                    </div>
                  )}

                  <button type="submit">Post</button>
                </form>

                {/* Step 44: Display List of Posts */}
                {groupData.Posts && groupData.Posts.length > 0 ? (
                  <ul className="post-list">
                    {groupData.Posts.map((post, index) => (
                      <li key={index} className="post-item">
                        <div className="post-header">
                          <strong>{post.Username}</strong>
                          <small>{post.CreatedAt}</small>
                        </div>
                        <p className="post-content">{post.Content}</p>

                        {/* Step 45: Display Post Image if exists */}
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

                        {/* Step 46: Comment Form with Image Support */}
                        <div className="comment-form">

                          {creatComeError && (
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
                              ⚠️ {creatComeError}
                            </div>
                          )}

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
                              maxLength={100}
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

                            {/* Step 47: Comment Image Preview */}
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

                        {/* Step 48: Display Comment List */}
                        {post.Comments && post.Comments.length > 0 ? (
                          <ul className="comment-list">
                            {post.Comments.map((comment, commentIndex) => (
                              <li key={commentIndex} className="comment-item">
                                <div className="comment-content">
                                  <strong>{comment.Username}</strong>:{" "}
                                  {comment.Content}
                                  <small>{comment.CreatedAt}</small>
                                </div>

                                {/* Step 49: Display Comment Image if exists */}
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
            // Step 50: Show access denied message for non-members
            <div className="no-access-message">
              🔒 You are not a member of this group and cannot view its details.
            </div>
          )}

          {/* Step 51: Join Requests Section - Only visible to Admin */}
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
        </div>
      </>
    );
  }

  // Show loading state
  if (loading) {
    return <div className="loading">Loading group details...</div>;
  }

  // If no group data, show UserNotFound component
  if (!groupData) {
    return (
      <>
        <Header />
        <UserNotFound />
      </>
    );
  }

  // This return statement is never reached due to the redirects above
  return null;
}