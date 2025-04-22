import { getFirestore, collection, query, where, getDocs, addDoc, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app, auth } from "../config/firebaseConfig";

export const createChat = async (carDetails) => {
  try {
    const db = getFirestore(app);
    const user = auth.currentUser;

    if (!user) throw new Error("User not authenticated");

    const chatRef = await addDoc(collection(db, "chats"), {
      user_id: user.uid,
      carDetails: carDetails,
      participants: [user.uid],
      created_at: serverTimestamp(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days expiration
    });
    
    return chatRef.id; 
  } catch (error) {
    console.error("Error creating chat:", error);
    return null;
  }
};

export const addMessage = async (chatId, sender, message, images = [], youtubeVideo = null) => {
  try {
    if (!chatId) throw new Error("Chat ID is required");

    const db = getFirestore();
    const messageData = {
      sender,
      message,
      
      timestamp: serverTimestamp(),
    };

    // Add images if available
    if (images.length > 0) {
      messageData.images = images;
    }

    // Add YouTube video if available
    if (youtubeVideo) {
      messageData.youtubeVideo = youtubeVideo;
    }

    const messageRef = await addDoc(collection(db, "chats", chatId, "messages"), messageData);

    return messageRef.id;
  } catch (error) {
    console.error("Error adding message:", error);
    return null;
  }
};


export const getChats = async () => {
  try {
    const db = getFirestore(app); // Initialize Firestore
    const user = auth.currentUser; // Get the current user

    if (!user) throw new Error("User not authenticated");

    // Create a query to fetch chats where the user is a participant
    const chatsQuery = query(
      collection(db, "chats"), // Reference the "chats" collection
      where("participants", "array-contains", user.uid) // Filter by participants
    );

    // Execute the query
    const querySnapshot = await getDocs(chatsQuery);

    // Map the query results to an array of chat objects
    const chats = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
};

export const getMessagesByChatId = async (chatId) => {
  try {
    const db = getFirestore(app); // Initialize Firestore

    if (!chatId) throw new Error("Chat ID is required");

    // Create a reference to the messages subcollection within the specified chat
    const messagesRef = collection(db, "chats", chatId, "messages");

    // Create a query to fetch all messages in the subcollection, ordered by timestamp
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

    // Execute the query
    const querySnapshot = await getDocs(messagesQuery);

    // Map the query results to an array of message objects
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

   

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};