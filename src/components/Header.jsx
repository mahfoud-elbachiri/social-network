import Link from "next/link";
import Image from "next/image";
import { handleLogout } from '@/utils/helpers';

const Header = ({ userAvatar, currentPage = 'home' }) => {
  const getProfileLink = () => {
    return currentPage === 'profile' ? '/Home' : '/Profile';
  };

  const getProfileLinkText = () => {
    return currentPage === 'profile' ? 'Home' : 'Profile';
  };

  // Ensure we have a valid avatar path
  const getAvatarSrc = () => {
    if (!userAvatar || userAvatar === "") {
      return "/icon.jpg";
    }
    // If userAvatar already starts with /, use as is, otherwise add /
    return userAvatar.startsWith('/') ? userAvatar : `/${userAvatar}`;
  };

  return (
    <header className="header">
      <Link href={getProfileLink()}>
        <Image 
          src={getAvatarSrc()}
          alt="Navigation Logo" 
          width={52} 
          height={52}
          priority
          style={{borderRadius: 50, cursor: 'pointer', display: 'block'}}
        />
      </Link>
      <nav>
        <li><Link href="/Followers">Followers</Link></li>
        <li><Link href="/Explore">Explore</Link></li>
        <li><Link href={getProfileLink()}>{getProfileLinkText()}</Link></li>
        <li><Link href="/Groups">Groups</Link></li>
        <li><Link href="/Notification">Notification</Link></li>
        <li><Link href="/Chats">Chats</Link></li>
       
      </nav>
      <button id="logout" onClick={handleLogout}>logout</button>
    </header>
  );
};

export default Header;