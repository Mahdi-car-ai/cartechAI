import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import LottieView from "lottie-react-native"; // Import Lottie
import CustomButton from "@/components/Button";
import Logo from "@/components/ui/Logo";
import VinSubmission from "@/components/vinSubmission/VinSubmission";
import { RootStackParamList } from "@/types/NavigationTypes";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleEnterCarDetails = () => {
    navigation.navigate("EnterCarDetails");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Logo />
          <View style={{ marginVertical: 16 }}>
            <Text
              style={[
                styles.prompt,
                { marginBottom: 0, paddingHorizontal: 16 },
              ]}
            >
              Provide Car Details for Better AI Assistance
            </Text>
          </View>

          <CustomButton
            title="Enter Car Details"
            icon="edit-note"
            backgroundColor="#2a2e2e"
            color="#fff"
            iconColor="#fff"
            onPress={handleEnterCarDetails}
          />
          <Text style={styles.subtitle}>OR</Text>
          <VinSubmission />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    fontFamily: "Aeonik",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1c1b",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  animation: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 32,
    fontFamily: "Aeonik",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },
  prompt: {
    fontFamily: "Aeonik",
    fontSize: 32,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Aeonik",
    fontSize: 12,
    color: "#555D58",
    textAlign: "center",
  },
});
