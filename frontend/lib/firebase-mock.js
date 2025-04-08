// src/lib/firebase-mock.js
import mockUsers from "@/app/mock/users";

// Mock Firestore functions
export const getDoc = async (docRef) => {
  const userId = docRef._path.segments[1];
  const userData = mockUsers[userId];

  console.log('Mock getDoc - Query:', {
    userId,
    collection: docRef._path.segments[0],
    userData: userData ? 'Found' : 'Not Found',
    mockUsers // Log the entire mockUsers object
  });

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
  console.log("Mock setDoc:", userId, data);
  return Promise.resolve();
};

export const getStorage = () => {
  return { mock: true }; // placeholder object for compatibility
};

export const updateDoc = async (docRef, data) => {
  const userId = docRef._path.segments[1];
  mockUsers[userId] = {
    ...mockUsers[userId],
    ...data
  };
  console.log("Mock updateDoc:", userId, data);
  return Promise.resolve();
};

export const doc = (db, collection, id) => {
  return {
    _path: {
      segments: [collection, id]
    }
  };
};

export const collection = (db, name) => {
  return { name };
};

export const where = (field, op, value) => ({
  type: "where",
  field,
  op,
  value
});

export const query = (collectionRef, ...constraints) => ({
  collection: collectionRef.name,
  constraints
});

export const addDoc = async (collectionRef, data) => {
  const mockId = `mock-${Math.random().toString(36).substring(2, 15)}`;
  console.log("Mock addDoc:", collectionRef.name, data, mockId);
  return {
    id: mockId,
    path: `${collectionRef.name}/${mockId}`
  };
};

export const getDocs = async (queryObj) => {
  if (queryObj.collection === "subscriptions") {
    const constraint = queryObj.constraints.find(
      (c) => c.field === "userId" && c.op === "=="
    );
    const userId = constraint?.value;
    const user = mockUsers[userId];

    console.log('MOCK getDocs - User:', user);
    console.log('MOCK getDocs - Subscription Query:', {
      userId,
      collection: queryObj.collection,
      constraints: queryObj.constraints,
      mockUsers // Log the entire mockUsers object
    });

    // If no user found or user doesn't have a subscription
    if (!user) {
      return { empty: true, docs: [] };
    }

    // Log specific subscription-related fields
    console.log('Subscription-related fields:', {
      subscribed: user.subscribed,
      hadPreviousSubscription: user.hadPreviousSubscription,
      onTrial: user.onTrial,
      subscriptionId: user.subscriptionId
    });

    // Return subscription details directly from user object
    return {
      empty: !user.subscribed,
      docs: user.subscribed ? [
        {
          id: user.subscriptionId || "mock-sub-id",
          data: () => ({
            userId,
            plan: user.subscriptionPlan || "mock",
            status: user.onTrial ? "trial" : "active",
            price: 2.99,
            currency: "GBP",
            startDate: user.subscriptionStartDate || new Date().toISOString(),
            trialEndDate: user.trialEndDate || new Date().toISOString(),
            paymentMethod: user.subscriptionPlan || "paypal",
            fingerprint: "**** **** **** 1234",
            subscriptionId: user.subscriptionId,
            hadPreviousSubscription: user.hadPreviousSubscription || false,
            // Explicitly add these fields to ensure they're passed  
            subscribed: user.subscribed,
            onTrial: user.onTrial
          })
        }
      ] : []
    };
  }

  return { empty: true, docs: [] };
};