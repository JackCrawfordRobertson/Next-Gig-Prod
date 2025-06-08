// src/lib/storage-mock.js

let mockStorage = {};

export const getStorage = () => {
  return { mock: true }; // Simple object for compatibility
};

export const ref = (storage, path) => {
  return {
    storage,
    path,
  };
};

export const uploadBytes = async (storageRef, file) => {
  mockStorage[storageRef.path] = file;
  return {
    metadata: {
      name: file.name,
      size: file.size,
      contentType: file.type,
    },
  };
};

export const getDownloadURL = async (storageRef) => {
  const file = mockStorage[storageRef.path];
  if (!file) throw new Error("File not found");
  return `https://example.com/${storageRef.path}`;
};
