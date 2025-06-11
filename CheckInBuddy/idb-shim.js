// idb-shim.js - Minimal shim for idb package on React Native
// This package is only needed for Firebase web functionality

// Provide minimal stubs that won't break if Firebase tries to use them
export const openDB = () => Promise.reject(new Error('IndexedDB not available on React Native'));
export const deleteDB = () => Promise.reject(new Error('IndexedDB not available on React Native'));
export const wrap = (value) => value;
export const unwrap = (value) => value;

// Default export
export default {
  openDB,
  deleteDB,
  wrap,
  unwrap
}; 