import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsm-_zhMcZWF7QYCLAxliHzbCHY6R1Hlk",
  authDomain: "cartechai.firebaseapp.com",
  projectId: "cartechai",
  storageBucket: "cartechai.firebasestorage.app",
  messagingSenderId: "631048456486",
  appId: "1:631048456486:web:200f169a916e21ef53d9e7",
  measurementId: "G-8FNE17BKV3"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Correctly initialize Auth with AsyncStorage for persistence in React Native
initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ Use getAuth(app) AFTER initializing it
const auth = getAuth(app);

export { app, auth };
