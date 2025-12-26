"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import {
    Home,
    Search,
    Bell,
    MessageCircle,
    User,
    Users,
    LogOut,
    PenSquare,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { handleLogout } from '@/utils/helpers';
import { userApi } from '@/utils/api';
import NotificationPopup from './NotificationPopup';
import { getSocket } from '@/sock/GetSocket';
import styles from './sidebar.module.css';

const Sidebar = ({ onCreatePost }) => {
    const pathname = usePathname();
    const [userAvatar, setUserAvatar] = useState("");
    const [username, setUsername] = useState("User");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Chat notification states
    const [chatNotification, setChatNotification] = useState(null);
    const [messageCount, setMessageCount] = useState(0);
    const socket = getSocket();

    useEffect(() => {
        fetchUserInfo();
        fetchNotificationCount();

        const notificationInterval = setInterval(() => {
            fetchNotificationCount();
        }, 1000);

        return () => clearInterval(notificationInterval);
    }, []);

    // Chat notification logic
    const showChatNotification = (sender) => {
        let id;
        clearTimeout(id);
        setChatNotification({ sender });
        setMessageCount(prev => prev + 1);

        id = setTimeout(() => {
            setChatNotification(null);
        }, 5000);
    };

    useEffect(() => {
        if (!username || !socket) return;

        socket.onopen = () => {
            console.log('✅ Global Chat Notifications WebSocket connected');
        };

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ content: "broadcast" }));
        }

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type !== "users" && data.receiver === username && !data.group_id && data.sender) {
                showChatNotification(data.sender);
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [username, socket]);

    const fetchUserInfo = async () => {
        try {
            const data = await userApi.fetchUserStatus();
            if (data && data.status) {
                if (data.avatar) setUserAvatar(data.avatar);
                if (data.user_id) setCurrentUserId(data.user_id);
                if (data.name) setUsername(data.name);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const fetchNotificationCount = async () => {
        try {
            const response = await fetch('http://localhost:8080/notifications', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status) {
                    setNotificationCount(data.count || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    };

    const handleNotificationClick = () => {
        setShowNotificationPopup(true);
    };

    const handleNotificationUpdate = () => {
        fetchNotificationCount();
    };

    const getAvatarSrc = () => {
        return userAvatar ? `/${userAvatar}` : "/icon.jpg";
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Morning";
        if (hour < 18) return "Afternoon";
        return "Evening";
    };

    const toggleContactList = () => {
        const contactList = document.getElementById('contact-list');
        if (contactList) {
            contactList.style.display = contactList.style.display === 'block' ? 'none' : 'block';
        }
        // Reset message count when opening messages
        setMessageCount(0);
    };

    const navItems = [
        { href: '/Home', icon: Home, label: 'Feed', active: pathname === '/Home' },
        { href: '/Explore', icon: Search, label: 'Search', active: pathname === '/Explore' },
        {
            href: '#',
            icon: Bell,
            label: 'Notifications',
            active: false,
            badge: notificationCount,
            onClick: handleNotificationClick
        },
        {
            href: '#',
            icon: MessageCircle,
            label: 'Messages',
            active: false,
            badge: messageCount,
            onClick: toggleContactList
        },
        { href: `/Profile?id=${currentUserId}`, icon: User, label: 'Profile', active: pathname === '/Profile' },
        { href: '/Groups', icon: Users, label: 'Groups', active: pathname?.startsWith('/Groups') },
    ];

    return (
        <>
            <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
                {/* Logo & Collapse Toggle */}
                <div className={styles.sidebarHeader}>
                    <Link href="/Home" className={styles.logo}>
                        <Image
                            src="/nexus-logo.png"
                            alt="Nexus Network Logo"
                            width={32}
                            height={32}
                            className={styles.logoIcon}
                        />
                        {!isCollapsed && <span className={styles.logoText}>Nexus Network</span>}
                    </Link>
                    <button
                        className={styles.collapseBtn}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* User Profile Section */}
                <Link href={`/Profile?id=${currentUserId}`} className={styles.userSection}>
                    <Image
                        src={getAvatarSrc()}
                        alt="User Avatar"
                        width={44}
                        height={44}
                        priority
                        className={styles.userAvatar}
                    />
                    {!isCollapsed && (
                        <div className={styles.userInfo}>
                            <span className={styles.greeting}>{getGreeting()},</span>
                            <span className={styles.userName}>{username}!</span>
                        </div>
                    )}
                </Link>

                {/* Navigation Items */}
                <nav className={styles.nav}>
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isLink = item.href && item.href !== '#';

                        const content = (
                            <>
                                <div className={styles.navIconWrapper}>
                                    <Icon size={22} />
                                    {item.badge > 0 && (
                                        <span className={styles.badge}>
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                            </>
                        );

                        if (item.onClick) {
                            return (
                                <button
                                    key={index}
                                    className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                                    onClick={item.onClick}
                                >
                                    {content}
                                </button>
                            );
                        }

                        return isLink ? (
                            <Link
                                key={index}
                                href={item.href}
                                className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                            >
                                {content}
                            </Link>
                        ) : (
                            <button
                                key={index}
                                className={`${styles.navItem} ${item.active ? styles.active : ''}`}
                            >
                                {content}
                            </button>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className={styles.divider} />

                {/* Bottom Section */}
                <div className={styles.bottomSection}>
                    {/* Create Post Button */}
                    {onCreatePost && (
                        <button
                            className={styles.createPostBtn}
                            onClick={onCreatePost}
                        >
                            <PenSquare size={20} />
                            {!isCollapsed && <span>Create a Post</span>}
                        </button>
                    )}

                    {/* Logout Button */}
                    <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Chat Notification Popup */}
            {chatNotification && (
                <div className={styles.chatNotification}>
                    <strong>{chatNotification.sender}</strong> sent you a message...
                </div>
            )}

            {/* Notification Popup */}
            <NotificationPopup
                isOpen={showNotificationPopup}
                onClose={() => setShowNotificationPopup(false)}
                onNotificationUpdate={handleNotificationUpdate}
                notificationCount={notificationCount}
            />
        </>
    );
};

export default Sidebar;
