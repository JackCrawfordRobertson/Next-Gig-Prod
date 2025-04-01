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


export const getDocs = async (queryObj) => {
  if (queryObj.collection === "subscriptions") {
    const constraint = queryObj.constraints.find(
      (c) => c.field === "userId" && c.op === "=="
    );
    const userId = constraint?.value;
    const user = mockUsers[userId];

    if (!user) {
      return { empty: true, docs: [] };
    }

    

    return {
      empty: false,
      docs: [
        {
          id: user.subscriptionId || "mock-sub-id",
          data: () => ({
            userId,
            plan: user.subscriptionPlan || "mock",
            status: user.onTrial ? "trial" : "active",
            price: 10,
            currency: "GBP",
            startDate: user.subscriptionStartDate || new Date().toISOString(),
            trialEndDate: user.trialEndDate || new Date().toISOString(),
            paymentMethod: "paypal",
            fingerprint: "**** **** **** 1234",
            subscriptionId: user.subscriptionId,
          })
        }
      ]
    };


    
  }

  

  return { empty: true, docs: [] };
};
