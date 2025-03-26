// src/lib/firebase-mock.js
import mockUsers from "@/app/mock/users";

// Mock Firestore functions
export const getDoc = async (docRef) => {
  const userId = docRef._path.segments[1];
  const userData = mockUsers[userId];

  return {
    exists: () => !!userData,
    data: () => userData,
    id: userId
  };
};

export const setDoc = async (docRef, data, options = {}) => {
  const userId = docRef._path.segments[1];
  
  if (options.merge) {
    mockUsers[userId] = {
      ...mockUsers[userId],
      ...data
    };
  } else {
    mockUsers[userId] = data;
  }
  
  console.log("Mock setDoc called with:", { userId, data });
  return Promise.resolve();
};

export const doc = (db, collection, id) => {
  return {
    _path: {
      segments: [collection, id]
    }
  };
};