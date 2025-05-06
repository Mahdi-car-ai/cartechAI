import React, { FC, useState } from "react";
import {
  Alert,
  TextInput,
  useWindowDimensions,
  TouchableOpacity,
  View,
  Text,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/NavigationTypes";
import CustomButton from "@/components/Button";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/components/plateSubmission/PlateSubmissionStyles";
import { LicensePlateResponse } from "@/components/plateSubmission/model/types/LicensePlateResponse";
import { US_STATES } from "@/components/plateSubmission/model/constants/US_STATES";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PlateSubmission: FC = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [stateCode, setStateCode] = useState("NY");
  const [showStatePicker, setShowStatePicker] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const windowDimensions = useWindowDimensions();

  const clearLicensePlate = () => {
    setLicensePlate("");
  };

  const toggleStatePicker = () => {
    setShowStatePicker(!showStatePicker);
  };

  const selectState = (itemValue: string) => {
    setStateCode(itemValue);
    setShowStatePicker(false);
  };

  const handlePlateSubmission = async () => {
    if (!licensePlate.trim()) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid license plate number.",
      );
      return;
    }

    if (!stateCode) {
      Alert.alert("Invalid Input", "Please select a state code.");
      return;
    }

    try {
      const apiKey = process.env.EXPO_PUBLIC_LICENSE_PLATE_API_KEY;
      const response = await axios.get<LicensePlateResponse>(
        `https://api.vehicledatabases.com/license-decode/${licensePlate}/${stateCode}`,
        {
          headers: {
            "x-AuthKey": apiKey,
          },
        },
      );

      if (response.data.status === "success" && response.data.data.intro.vin) {
        const vin = response.data.data.intro.vin;
        navigation.navigate("CarDetails", { vin });
      } else {
        Alert.alert(
          "Error",
          "Could not find vehicle information for this license plate.",
        );
      }
    } catch (error) {
      console.error("License plate lookup error:", error);
      Alert.alert("Error", "Failed to look up license plate information.");
    }
  };

  return (
    <>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { width: windowDimensions.width * 0.9 }]}
          placeholder="Enter License Plate"
          placeholderTextColor={"#ddd"}
          value={licensePlate}
          onChangeText={setLicensePlate}
          autoCapitalize="characters"
        />
        {licensePlate ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearLicensePlate}
          >
            <Ionicons name="close-circle" size={26} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.stateInput, { width: windowDimensions.width * 0.9 }]}
        onPress={toggleStatePicker}
      >
        <Text style={styles.stateText}>{stateCode || "Select State"}</Text>
        <Ionicons
          name={showStatePicker ? "chevron-up" : "chevron-down"}
          size={24}
          color="#999"
        />
      </TouchableOpacity>

      <Modal
        visible={showStatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleStatePicker}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={toggleStatePicker}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={US_STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.stateItem,
                    stateCode === item && styles.selectedStateItem,
                  ]}
                  onPress={() => selectState(item)}
                >
                  <Text
                    style={[
                      styles.stateItemText,
                      stateCode === item && styles.selectedStateItemText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      <CustomButton
        title="Look Up"
        icon="search"
        onPress={handlePlateSubmission}
      />
    </>
  );
};

export default PlateSubmission;
