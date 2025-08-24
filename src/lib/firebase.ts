import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAL-9EyB_sC_-MnOVRQM7o3OV89i_WqUEM",
  authDomain: "ictn-b1394.firebaseapp.com",
  projectId: "ictn-b1394",
  storageBucket: "ictn-b1394.firebasestorage.app",
  messagingSenderId: "963013998882",
  appId: "1:963013998882:web:bcfb1792664097acc64d7b",
  measurementId: "G-JHZVQQ2H4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
