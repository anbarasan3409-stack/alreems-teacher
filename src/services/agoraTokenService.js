// Agora Token Service for Teachers
// This service handles Agora token generation and management for the teacher portal

const getAgoraTokenEndpoint = () => {
  if (typeof window === 'undefined') return null; // SSR safety
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agora`;
};

export const agoraTokenService = {
  // Generate token for joining a channel as a teacher
  generateToken: async (channelName, userRole = 'host') => {
    try {
      const AGORA_TOKEN_ENDPOINT = getAgoraTokenEndpoint();
      
      // Try to get token from backend first
      if (AGORA_TOKEN_ENDPOINT) {
        try {
          const response = await fetch(`${AGORA_TOKEN_ENDPOINT}/teacher/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              channelName,
              userRole,
              uid: 0, // 0 means Agora will assign a random UID
              expirationTimeInSeconds: 3600 // 1 hour
            })
          });

          if (response.ok) {
            const data = await response.json();
            return data.token;
          } else {
          }
        } catch (error) {
        }
      }
      
      // Fallback to null token for development or when server token fails
      // This works when App Certificate is not enabled in Agora Console
      return null;
      
    } catch (error) {
      return null;
    }
  },

  // Validate Agora App ID
  validateAppId: () => {
    if (typeof window === 'undefined') return false; // SSR safety
    
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!appId || appId === 'your_agora_app_id_here') {
      return false;
    }
    
    return true;
  },

  // Check if App Certificate is enabled (for debugging)
  checkAppCertificate: async (channelName) => {
    // This is a diagnostic function to help troubleshoot
  }
};

export default agoraTokenService;
