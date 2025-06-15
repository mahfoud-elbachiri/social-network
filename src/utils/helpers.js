

// Format date for display
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

// Generate profile link based on user ID
export const getProfileLink = (userId, currentUserId) => {
  if (userId === currentUserId) {
    return '/Profile'; // Own profile
  }
  return `/Profile?id=${userId}`; // Other user's profile
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