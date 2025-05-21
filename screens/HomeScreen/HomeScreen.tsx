import React from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomButton from "@/components/Button/Button";
import Logo from "@/components/ui/Logo";
import DecodeSwitcher from "@/components/DecodeSwitcher/DecodeSwitcher";
import { RootStackParamList } from "@/types/NavigationTypes";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();

  const handleEnterCarDetails = () => {
    navigation.navigate("EnterCarDetails");
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/ellipse.png")}
        style={styles.imageOverlay}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Logo size={71.11} />

            <View style={{ marginVertical: 32 }}>
              <Text
                style={[
                  styles.prompt,
                  { marginBottom: 0, paddingHorizontal: 16 },
                ]}
              >
                AI-Powered Solutions for Every Car Problem
              </Text>
            </View>

            <CustomButton
              title="Edit Car Details"
              backgroundColor="#2a2e2e"
              color="#fff"
              iconColor="#fff"
              style={{ height: 48 }}
              onPress={handleEnterCarDetails}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.subtitle}>Or</Text>
              <View style={styles.line} />
            </View>

            <DecodeSwitcher />
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1a1c1b", // Main background color
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
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
    color: "#fff",
    textAlign: "center",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    width: "80%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#4E4E4E",
    marginHorizontal: 8,
  },
});
