

'use client';
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  
  useEffect(() => {
    // Call HomeHandeler when component mounts
    HomeHandeler();
  }, []);

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

export function HomeHandeler() {    

    fetch('http://localhost:8080/getpost', { 
        method: 'POST', 
         headers: {
                    'Content-Type': 'application/json',
                },
        credentials: 'include' // Include cookies for authentication
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log('Data received:', data);
        // Call HomeListener if it exists
        if (typeof HomeListener === 'function') {
            HomeListener(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// You'll need to define HomeListener function or import it
function HomeListener(data) {
    // Handle the data received from the API
    console.log('Processing data in HomeListener:', data);
    // Add your logic here to handle the posts data
}
