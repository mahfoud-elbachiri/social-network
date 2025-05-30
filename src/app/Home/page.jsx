

import Link from "next/link";
export default function Home() {
  return (
    <nav>
      <li><Link href="/Followers">Followers</Link></li>
      <li><Link href="/Profile">Profile</Link></li>
      <li><Link href="/Groups">Groups</Link></li>
      <li><Link href="/Notification">Notification</Link></li>
      <li><Link href="/Chats">Chats</Link></li>
    </nav>
  );
}
