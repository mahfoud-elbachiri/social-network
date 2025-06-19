

export const API_BASE_URL = 'http://localhost:8080';

// Generic API request handler
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      ...options
    });

    const text = await response.text();
    
    if (!text) {
      console.error('Empty response from server, redirecting to login...');
      window.location.href = "/";
      return null;
    }    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', text);
      console.error('Redirecting to login...');
      window.location.href = "/";
      return null;
    }

    // Check for authentication errors - ensure data is not null
    if (data && (data.login === false || data.token === false)) {
      console.error('Unauthorized access, redirecting to login...');
      window.location.href = "/";
      return null;
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

// User related API calls
export const userApi = {
  // Get current user status
  fetchUserStatus: async () => {
    return await apiRequest('/statuts', {
      method: 'GET'
    });
  },

  // Get current user status (alias for compatibility)
  fetchCurrentUserStatus: async () => {
    return await apiRequest('/statuts', {
      method: 'GET'
    });
  },

  // Get user profile (own or others)
  fetchProfile: async (userId = null) => {
    const requestBody = { action: 'get_profile' };
    if (userId) {
      requestBody.user_id = userId;
    }

    return await apiRequest('/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
  },

  // Update privacy settings
  updatePrivacy: async (isPrivate) => {
    return await apiRequest('/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_privacy',
        is_private: isPrivate
      })
    });
  },

  // Logout user
  logout: async () => {
    return await apiRequest('/logout', {
      method: 'POST'
    });
  }
};

// Post related API calls
export const postApi = {
  // Get posts (for home feed)
  fetchPosts: async (isInitial = true) => {
    const formData = new FormData();
    if (isInitial) {
      formData.append('lastdata', true);
    }

    return await apiRequest('/getpost', {
      method: 'POST',
      body: formData
    });
  },

  // Create new post
  createPost: async (formData) => {
    return await apiRequest('/pubpost', {
      method: 'POST',
      body: formData
    });
  }
};

// Comment related API calls
export const commentApi = {
  // Get comments for a post
  fetchComments: async (postId) => {
    return await apiRequest('/getcomment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId.toString() })
    });
  },

  // Send a comment
  sendComment: async (postId, content) => {
    return await apiRequest('/sendcomment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        post_id: postId.toString()
      })
    });
  }
};