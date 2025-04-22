import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "react-native-elements";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import Logo from "@/components/ui/Logo";
import { auth } from "@/config/firebaseConfig";

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePostCreation = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    const db = getFirestore();
    const postData = {
      title,
      title_lowercase: title.toLowerCase(), // Add lowercase version of the title
      description,
      user_id: auth.currentUser!.uid,
      status: "open", // Default status is open
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "community_posts"), postData);
      Alert.alert("Success", "Your post has been added.");
      navigation.goBack(); // Go back to the community screen
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Could not create post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Logo />
        </View>
      </View>
     
      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Enter post title"
        placeholderTextColor="#aaa"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Describe your issue..."
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handlePostCreation} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post</Text>}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate("CommunityScreen")}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1c1b",
    padding: 16,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center", // Center the logo
    alignItems: "center",
    marginBottom: 20,
  },
  logoWrapper: {
    alignItems: "center", // Center the logo horizontally
  },
  input: {
    backgroundColor: "#2a2e2e",
    color: "#fff",
    fontSize: 16,
    fontFamily: "Aeonik",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#95ff77",
    paddingVertical: 14,
  
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    color: "#1a1c1b",
    fontFamily: "Aeonik",
  },
  cancelButton: {
    backgroundColor: "#2a2e2e",
    
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Aeonik",
    color: "#fff",
    
  },
});

export default CreatePostScreen;