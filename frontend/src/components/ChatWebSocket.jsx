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
    
    const [notification, setNotification] = useState(null)
    const [selectedUser, setSelectedUser] = useState()
    const [UsersList, setUsersList] = useState()
    const [input, setInput] = useState('')
    // const [sock, setSock] = useState()
    const [messages, setMessages] = useState([])
    const [oldMessages, setOldMessages] = useState([])
    const [yes, setYes] = useState()

    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, yes]);

    useEffect(() => {
        if (selectedUser) {
            getOldMessages(username, selectedUser, 0)
            setMessages([])
        }
    }, [selectedUser]);


    const getOldMessages = async (sender, receiver, num = 1) => {
        try {
            const response = await fetch("http://localhost:8080/getChats", {
                method: 'POST',
                body: JSON.stringify({ sender, receiver, num }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data) {
                if (num === 0) {
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

                getOldMessages(username, selectedUser)

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

    }, [username, selectedUser])


    const showNotification = (sender) => {
        let id
        console.log(25);
       clearTimeout(id) 
    setNotification({ sender });

     id = setTimeout(() => {
        setNotification(null);
    }, 5000);
}

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
            console.log(data);
            if (data.type === "users") {
                setUsersList(data.users)
            } else {
                setMessages(prvData => [...prvData, data])
                console.log(data.receiver,selectedUser)
                
                if (data.sender != selectedUser && data.receiver === username){

                    showNotification(data.receiver)
                }
            }

            console.log(data);
        }

        console.log("gg");
        // socket.onclose = () => {
        //     console.log('🔌 WebSocket closed');
        // }

        // return () => {
        //     socket.close();
        //     console.log('WebSocket disconnected');
        // };


    }, [i,selectedUser])

    const sendMessage = (socket, sender, receiver) => {

        if (input.trim() === "") {
            return
        }

        let trimmedMessage = input.trim().replace(/\s+/g, ' ')
        socket.send(JSON.stringify({ sender: sender, receiver: receiver, content: trimmedMessage }))
        setInput("");
    }


    return (

        <>
          
            <aside className="contacts" style={{ paddingTop: '0' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ marginTop: "10px" }}>Chat</h3>
                </div>
                <div
                    id="contact-list"
                    style={{
                        height: `${typeof window !== 'undefined' ? window.innerHeight / 4 : 200}px`,
                        overflowY: 'auto',
                        border: '3px solid rgb(226, 226, 226)',
                        padding: '15px',
                        borderRadius: '20px'
                    }}
                >
                    {/* Contact list content */}
                    <div>
                        {UsersList?.map((u, i) => (
                            <div key={i}>
                                {u.username === username ? (
                                    u.sort?.length > 0 ? (
                                        u.sort.filter(us => us.user !== username).map((user, i) => (
                                            <div key={i} className="list" onClick={() => setSelectedUser(user.user)}>
                                                <div>
                                                    <Image
                                                        src={user.avatar ? `/${user.avatar}` : "/icon.jpg"}
                                                        alt="Profile Avatar"
                                                        width={40}
                                                        height={40}
                                                        priority
                                                        style={{ borderRadius: 50 }}
                                                    />
                                                    <p className="users">{user.user}</p>
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

                        <h3 className='tagg'>Chat with {selectedUser}  <button className='close-chat' onClick={() => setSelectedUser(null)}>x</button> </h3>
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

                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-button" >😊</button>

                            {showEmojiPicker && (
                                <EmojiPicker onEmojiClick={onEmojiClick} />
                            )}

                            <input onChange={(e) => setInput(e.target.value)} type="text" placeholder="Write a message..." value={input} />
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
