// lib/dev-helpers.js
import mockUsers from "@/app/mock/users";

// Default mock user ID - this should be the main test user ID
export const DEFAULT_MOCK_USER_ID = "OS6veyhaPARd9KeCnXU11re06Dq2";

// Get a mock session for development mode
export const getMockSession = () => {
  const userId = DEFAULT_MOCK_USER_ID;
  const user = mockUsers[userId];
  
  if (!user) {
    console.error(`Mock user with ID ${userId} not found!`);
    return null;
  }
  
  return {
    user: {
      id: userId,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      subscribed: user.subscribed,
      onTrial: user.onTrial,
      trialEndDate: user.trialEndDate,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionId: user.subscriptionId
    }
  };
};

// Helper to check if we're in dev mode
export const isDevMode = () => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  
  // Client-side check
  const hostname = window.location.hostname;
  return process.env.NODE_ENV === 'development' && 
    (hostname === 'localhost' || hostname === '127.0.0.1');
};