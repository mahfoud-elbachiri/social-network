
import { useEffect, useState } from 'react';
import { FaUserPlus, FaUserXmark } from 'react-icons/fa6';


 const FollowButton = ({ targetUserid }) =>{
  const [following, setFollowing] = useState(null);


  useEffect(()=> {

      const checkfollow = async () => {
        try {
          const res = await fetch (`/api/isFollowing?id=${targetUserid}`,{
            credentials : 'include'
          })

          const data = await res.json()

          setFollowing(data.isFollowing)
        }catch (err){
          console.log("error while cheking follow satus:",err);
          
        }
      }
    checkfollow()
  },[targetUserid])

  const handleClick = async () => {
    try {
      const url = following ? `/api/unfollowRequest` : `/api/followRequest`;

      const response = await fetch(url, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          following_id: targetUserid
        })
      });
      
      if (!response.ok) {
       
        console.log("response:",await response.json());
        throw new Error('Request failed');
      } else {
        setFollowing(!following);
      }
    } catch (err) {
      console.error('Error:', err);
    }

  };

if (following === null) return null;

  return (
    <button className={`follow-button ${following ? 'following' : ''}`} onClick={handleClick}>
      {following ? (
        <>
          <FaUserXmark /> Unfollow
        </>
      ) : (
        <>
          <FaUserPlus /> Follow
        </>
      )}
    </button>
  );
}

export default FollowButton;