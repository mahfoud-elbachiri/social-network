

// Format date for display
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

 
export const getProfileLink = (userId, currentUserId) => {
  return `/Profile?id=${userId}`; 
};

//  logout 
export const handleLogout = async () => {
  try {
    await fetch('http://localhost:8080/logout', {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = "/";
  } catch (error) {
    console.error('Logout error:', error);
  }
};

//  redirecting to login
export const redirectToLogin = () => {
  window.location.href = "/";
};

// Check if user is authenticated from response
export const isAuthenticated = (data) => {
  return data && data.login !== false && data.token !== false;
};