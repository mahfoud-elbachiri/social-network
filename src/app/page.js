import Link from "next/link";
export default function Home() {
  return (
    <nav>
      <li><Link href="/Followers">Followers</Link></li>
      <li><Link href="/Profile">Profile</Link></li>
      <li><Link href="/Posts">Posts</Link></li>
      <li><Link href="/Groups">Groups</Link></li>
      <li><Link href="/Notification">Notification</Link></li>
      <li><Link href="/Chats">Chats</Link></li>
    </nav>
    // <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    // </div>
  );
}

