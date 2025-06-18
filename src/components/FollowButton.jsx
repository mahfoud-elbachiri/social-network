
import { useEffect, useState } from 'react';
import { FaUserPlus, FaUserXmark,FaUserClock } from 'react-icons/fa6';


 const FollowButton = ({ targetUserid ,isPrivateView}) =>{
  const [following, setFollowing] = useState(null);
const [isPrivat , setIsprivat] = useState(null)
const [IsPanding , setIsPanding] = useState(null)
  useEffect(()=> {
    
      const checkfollow = async () => {
        try {
          const res = await fetch (`/api/isFollowing?id=${targetUserid}`,{
            credentials : 'include'
          })

          const data = await res.json()
          console.log("vivo:",isPrivateView);
          
          setFollowing(data.isFollowing)
          setIsprivat(data.isPrivat)
          setIsPanding(data.IsPanding)
        }catch (err){
          console.log("error while cheking follow satus:",err);
          
        }
      }
    checkfollow()
  },[targetUserid , isPrivateView])

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

       
         if (!isPrivat){

           setFollowing(!following);
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
  };
  const buttonStatu =  () =>{
    /*
  console.log("ispanding :" , IsPanding );
  console.log("following : :" , following );
 console.log("isprivat : :" , isPrivat );
*/
    if (isPrivateView) {

       if (!following) { 
          return (
            <>
              <FaUserPlus /> Follow
            </>
           )

       }else {
         return (
               <>
              <FaUserClock /> panding
              </>
           )
       }
       
    }
   
    if (!following) {
        return (
         <>
          <FaUserPlus /> Follow
        </>
       )
    }
    if (following) {
       return (
         <>
          <FaUserXmark /> Unfollow
        </>
       )
    }
    

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