import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import CustomButton from "@/components/Button";
import { useNavigation } from "@react-navigation/native";
import Logo from "@/components/ui/Logo";
import { Icon } from "react-native-elements";

export default function EnterCarDetailsScreen() {
  const navigation = useNavigation();
  const width = useWindowDimensions().width * 0.9;
  const [carDetails, setCarDetails] = useState({
    make: "",
    model: "",
    modelYear: "",
    fuelType: "",
    engineCylinders: "",
    engineDisplacement: "",
    vehicleType: "",
    trim: "",
    transmissionStyle: "",
    driveType: "",
    bodyClass: "",
    plantCity: "",
    plantCountry: "",
  });

  // State to track focused input
  const [focusedInput, setFocusedInput] = useState(null);

  const handleChange = (field, value) => {
    setCarDetails({ ...carDetails, [field]: value });
  };

  const isAnyFieldFilled = () => {
    return Object.values(carDetails).some((value) => value.trim() !== "");
  };

  const goToChat = () => {
    navigation.navigate("ChatScreen", { carDetails: carDetails });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", paddingTop: 50 },
        ]}
      >
        <Logo />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(carDetails).map((key) => (
            <TextInput
              key={key}
              style={[
                styles.input,
                { width: width },
                focusedInput === key && styles.inputFocused, 
              ]}
              placeholder={key
                .replace(/([A-Z])/g, " $1")
                .trim()
                .replace(/\b\w/g, (char) => char.toUpperCase())}
              placeholderTextColor="#aaa"
              value={carDetails[key]}
              onChangeText={(text) => handleChange(key, text)}
              onFocus={() => setFocusedInput(key)} // Set focused input
              onBlur={() => setFocusedInput(null)} // Clear focused input
            />
          ))}
        </ScrollView>

        <CustomButton
          title="Chat"
          icon="chat"
          onPress={goToChat}
          style={styles.chatButton}
          disabled={!isAnyFieldFilled()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 24,
    height: "100%",
    justifyContent: "center",
    backgroundColor: "#1a1c1b",
  },
  chatButton: {
    width: "auto",
    paddingHorizontal: 16,
  },
  subtitle: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Aeonik",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    alignSelf: "center",
    fontSize: 16,
    borderColor: "#2a2e2e",
    borderWidth: 1.5,
    color: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    fontFamily: "Aeonik",
  },
  inputFocused: {
    borderColor: "#95ff77", 
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  backButton: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});