'use client'

import { useEffect, useRef, useState } from 'react'
import "./chat.css"
import { getSocket } from '@/sock/GetSocket'
import EmojiPicker from 'emoji-picker-react'
import Image from 'next/image'




export default function ChatWebSocket({ username }) {

    const socket = getSocket()

    const [i, setI] = useState(false)


    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const onEmojiClick = (emojiObject) => {
        setInput(input + emojiObject.emoji)
        setShowEmojiPicker(false)
    };
    const [notifications, setNotifications] = useState({});

    const [selectedUser, setSelectedUser] = useState()
    const [selectedUserAvatar, setSelectedUserAvatar] = useState(null)
    const [UsersList, setUsersList] = useState()
    const [input, setInput] = useState('')
    // const [sock, setSock] = useState()
    const [messages, setMessages] = useState([])
    const [oldMessages, setOldMessages] = useState([])
    const [yes, setYes] = useState()

    const [offset, setOffset] = useState(0)

    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, yes]);

    useEffect(() => {
        setOffset(0)
        if (selectedUser) {
            getOldMessages(username, selectedUser, 0, true)
            setMessages([])
        }
    }, [selectedUser]);


    const getOldMessages = async (sender, receiver, offset, firstime = true) => {
        try {
            const response = await fetch("http://localhost:8080/getChats", {
                method: 'POST',
                body: JSON.stringify({ sender, receiver, offset, firstime }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data) {
                if (firstime) {
                    setYes(true)
                    setOldMessages(data)
                } else {
                    setOldMessages(prvData => [...prvData, ...data])
                }
            }



        } catch (error) {
            console.error(error);
        }
    }


    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop <= 10) {
                const prevScrollHeight = container.scrollHeight

                getOldMessages(username, selectedUser, offset, false)

                requestAnimationFrame(() => {
                    const newScrollHeight = container.scrollHeight
                    const diff = newScrollHeight - prevScrollHeight
                    container.scrollTop = diff
                })
            }
        }

        const debouncedScroll = debounce(handleScroll, 300)

        container.addEventListener("scroll", debouncedScroll)

        return () => {
            container.removeEventListener("scroll", debouncedScroll)
        }

    }, [username, selectedUser, offset])


    useEffect(() => {
        // const socket = new WebSocket('ws://localhost:8080/ws')
        // setSock(socket)



        socket.onopen = () => {
            console.log('✅ WebSocket connected')
            setI(true)
        }

        // console.log(i);

        // if (i) {
        //     console.log(2);
        //     socket.send(JSON.stringify({ content: "broadcast" }))
        // }

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ content: "broadcast" }));
        } else {
            console.warn("❌ WebSocket not ready, cannot send message yet");
        }

        socket.onmessage = (event) => {

            const data = JSON.parse(event.data)
            // console.log(data);
            if (data.type === "users") {
                setUsersList(data.users)
            } else {
                setMessages(prvData => [...prvData, data])
                // console.log(data.receiver, selectedUser, data.sender)

                // Only handle notification counts for the chat interface
                if (data.receiver === username && data.sender !== selectedUser) {
                    setNotifications(prev => ({
                        ...prev,
                        [data.sender]: (prev[data.sender] || 0) + 1
                    }));
                }
            }

            console.log(data);
        }

        console.log("gg");
        // socket.onclose = () => {
        //     console.log('🔌 WebSocket closed');
        // }

        // return () => {socket.send(JSON.stringify({ sender: sender, receiver: receiver, content: trimmedMessage }))
        //     socket.close();
        //     console.log('WebSocket disconnected');
        // };


    }, [i, selectedUser])
    useEffect(() => {
        if (selectedUser) {
            setNotifications(prev => {
                const newNotif = { ...prev };
                newNotif[selectedUser] = 0
                return newNotif
            })
        }

    }, [selectedUser])

    const sendMessage = (socket, sender, receiver) => {
        setOffset(prev => prev + 1)
        if (input.trim() === "") {
            return
        }

        let trimmedMessage = input.trim().replace(/\s+/g, ' ')
        socket.send(JSON.stringify({ sender: sender, receiver: receiver, content: trimmedMessage }))
        setInput("");
    }
    // components/PopUpNotification.tsx
    // components/PopUpNotification.jsx
    const onkkeydown = (e, socket, username, selectedUser) => {
        if (e.key === "Enter") sendMessage(socket, username, selectedUser)

    }
    const [showChat, setShowChat] = useState(false)


    return (

        <>
            <aside className="contacts" style={{ paddingTop: '0' }}>
                <div style={{ }}>
                    <h3 style={{ marginTop: "10px" }}>
                        <div >
                            <button
                                onClick={() => setShowChat(!showChat)}

                                style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
                            >
                                <Image
                                    src="/send.png"
                                    alt="send"
                                    width={42}
                                    height={42}
                                    className="nav-icon"
                                />
                                {/* {notificationCount > 0 && (
                                    <span className="notification-badge">
                                      {notificationCount > 99 ? '99+' : notificationCount}
                                    </span>
                                  )} */}
                            </button>
                        </div></h3>
                </div>

                <div
                    id="contact-list"
                    style={{
                        display: showChat ? "block" : "none",
                        height: '200px',
                        overflowY: 'auto',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '15px',
                        borderRadius: '12px',
                        backgroundColor: '#131313'
                    }}
                >
                    {/* Contact list content */}
                    <div>
                        {UsersList?.map((u, i) => (
                            <div key={i}>
                                {u.username === username ? (
                                    u.sort?.length > 0 ? (
                                        u.sort.filter(us => us.user !== username).map((user, i) => (
                                            <div key={i} className="list" onClick={() => {
                                                setSelectedUser(user.user)
                                                setSelectedUserAvatar(user.avatar)
                                            }}>
                                                <div>
                                                    <Image
                                                        src={user.avatar ? `/${user.avatar}` : "/icon.jpg"}
                                                        alt="Profile Avatar"
                                                        width={40}
                                                        height={40}
                                                        priority
                                                        style={{ borderRadius: 50 }}
                                                    />
                                                    <div style={{ position: 'relative' }}>
                                                        <p className="users">{user.user}
                                                            {notifications[user.user] > 0 && (
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
                                                                    {notifications[user.user]}
                                                                </span>
                                                            )}
                                                        </p></div>

                                                </div>

                                                <span className={user.online ? "online" : "offlin"}></span>
                                            </div>
                                        ))
                                    ) : (
                                        <></>
                                    )
                                ) : (
                                    <></>
                                )}
                            </div>
                        ))}
                    </div>


                </div>
            </aside>

            <div className="">
                {selectedUser ?
                    <div id='chat-{selectedUser}' className="chat-box">

                        <div className='chat-header-bar'>
                            <div className='chat-user-info'>
                                <Image
                                    src={selectedUserAvatar ? `/${selectedUserAvatar}` : "/icon.jpg"}
                                    alt={selectedUser}
                                    width={36}
                                    height={36}
                                    style={{ borderRadius: '50%' }}
                                />
                                <span className='chat-username'>{selectedUser}</span>
                            </div>
                            <button className='close-chat' onClick={() => {
                                setSelectedUser(null)
                                setSelectedUserAvatar(null)
                            }}>×</button>
                        </div>
                        <div className="messages" ref={messagesContainerRef}>

                            {/* old message */}
                            {[...oldMessages].reverse().filter(m =>
                                m.Sender === selectedUser || m.Receiver === selectedUser
                            ).map((msg, index) => (
                                <div key={index} className={`format-msg ${msg.Sender === username ? 'sent' : 'received'}`}>
                                    <p className="msg-text">{msg.Text}</p>
                                    <span className="msg-time">{msg.Time}</span>
                                </div>
                            ))}


                            {/* msg WebSocket */}
                            {messages.filter(m =>
                                m.sender === selectedUser || m.receiver === selectedUser
                            ).map((msg, index) => (

                                <div key={index} className={`format-msg ${msg.sender === username ? 'sent' : 'received'}`}>

                                    <p className="msg-text">{msg.content}</p>
                                    <span className="msg-time">{msg.Time}</span>
                                </div>
                            )

                            )}

                            <div ref={messagesEndRef} />
                        </div >

                        <div className="chat-input">

                            <div style={{ position: 'relative' }}>
                                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-button" >😊</button>

                                {showEmojiPicker && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '50px',
                                        left: '0',
                                        zIndex: 1002
                                    }}>
                                        <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                                    </div>
                                )}
                            </div>

                            <input onKeyDown={(e) => onkkeydown(e, socket, username, selectedUser)} onChange={(e) => setInput(e.target.value)} maxLength={1000} type="text" placeholder="Write a message..." value={input} />
                            <button onClick={() => sendMessage(socket, username, selectedUser)} className='send'>Send</button>
                        </div>
                    </div>
                    : <></>}
            </div>
        </>
    )
}
function debounce(func, delay = 500) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
