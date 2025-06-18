"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { handleLogout } from '@/utils/helpers';
import { userApi } from '@/utils/api';

const Header = () => {
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const data = await userApi.fetchUserStatus();
      if (data && data.status && data.avatar) {
        setUserAvatar(data.avatar);
      }
    } catch (error) {
      console.error('Error fetching user info in header:', error);
    }
  };
  // Ensure we have a valid avatar path
  const getAvatarSrc = () => {
    return userAvatar ? `/${userAvatar}` : "/icon.jpg";
  };

  return (
    <header className="header">
      <Link href="/Profile">
        <Image 
          src={getAvatarSrc()}
          alt="User Avatar" 
          width={52} 
          height={52}
          priority
          style={{borderRadius: 50, cursor: 'pointer', display: 'block'}}
        />
      </Link>
      <nav>
        <li><Link href="/Home">Home</Link></li>
        <li><Link href="/Explore">Explore</Link></li>
        
        <li><Link href="/Groups">Groups</Link></li>
        <li><Link href="/Notification">Notification</Link></li>
        <li><Link href="/Chats">Chats</Link></li>
      </nav>
      <button id="logout" onClick={handleLogout}>logout</button>
    </header>
  );
};

export default Header;