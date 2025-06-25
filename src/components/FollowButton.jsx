
import { useEffect, useState } from 'react';
import { FaUserPlus, FaUserXmark,FaUserClock } from 'react-icons/fa6';


 const FollowButton = ({ targetUserid ,isPrivateView}) =>{
  const [following, setFollowing] = useState(null);
const [IsPanding , setIsPanding] = useState(null)


  useEffect(()=> {
      const checkfollow = async () => {
        
        try {          const res = await fetch (`/api/isFollowing?id=${targetUserid}`,{
            credentials : 'include'
          })

          const data = await res.json()
          setFollowing(data.isFollowing)
          setIsPanding(data.IsPanding)
        }catch (err){
          console.log("error while cheking follow satus:",err);
          
        }}
    checkfollow()
  },[targetUserid , isPrivateView])
  const handleClick = async () => {
    console.log("1",targetUserid);
    try {      let url;
        if (IsPanding || following) {
        // If pending or following, cancel/unfollow
        url = `/api/unfollowRequest`;
      } else {
        // If not following and not pending, send follow request
        url = `/api/followRequest`;
      }

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
        if (IsPanding) {
          // Cancel pending request
          setFollowing(false);
          setIsPanding(false);
        } else if (following) {
          // User is unfollowing
          setFollowing(false);
          setIsPanding(false);
        } else {
          // User is following
          if (isPrivateView) {
            // Private profile - set as pending
            setFollowing(false);
            setIsPanding(true);
          } else {
            // Public profile - follow immediately
            setFollowing(true);
            setIsPanding(false);
          }
        }
      }
    } catch (err) {
      console.error('Error:', err)
    }
  };


const getButtonClass = () => {
    if (IsPanding) return 'follow-button pending';
    if (following) return 'follow-button following';
    return 'follow-button';
  };  const buttonStatu =  () =>{
    // If pending, show pending status
    if (IsPanding) {
      return (
        <>
          <FaUserClock /> cansel request
        </>
      );
    }

    // If following, show unfollow
    if (following) {
      return (
        <>
          <FaUserXmark /> Unfollow
        </>
      );
    }

    // If not following, show follow
    return (
      <>
        <FaUserPlus /> Follow
      </>
    );
  }
if (following === null) return null;

  


  return (
    <button className={ getButtonClass()} onClick={handleClick}>
       
      {
        buttonStatu()
 
       }
    </button>
  );
}

export default FollowButton;