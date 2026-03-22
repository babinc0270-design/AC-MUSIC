import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCf4h2yR_bQCed0i5u2xTWCMibCdxVbla0',
  authDomain: 'ac-movies-ea6dc.firebaseapp.com',
  projectId: 'ac-movies-ea6dc',
  storageBucket: 'ac-movies-ea6dc.firebasestorage.app',
  messagingSenderId: '492226521122',
  appId: '1:492226521122:web:1c5533ffb0ba76c4af427b',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
