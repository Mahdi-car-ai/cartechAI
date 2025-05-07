import React, { FC, useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { addVinToHistory } from "@/store/slices/vinHistorySlice";
import CustomButton from "@/components/Button";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/NavigationTypes";
import VinHistoryModal from "./VinHistoryModal";
import VinScannerButton from "./VinScannerButton";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const VinSubmission: FC = () => {
  const [vin, setVin] = useState("");
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const handleVinSubmission = () => {
    if (!vin.trim()) {
      Alert.alert("Invalid Input", "Please enter a valid VIN.");
      return;
    }
    // Add to history
    dispatch(addVinToHistory(vin.trim()));
    navigation.navigate("CarDetails", { vin });
  };

  const handleSelectVin = (selectedVin: string) => {
    setVin(selectedVin);
  };

  const handleVinDetected = (detectedVin: string) => {
    setVin(detectedVin);
  };

  return (
    <>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { width: useWindowDimensions().width * 0.9 }]}
          placeholder="Enter VIN (e.g., 1HGCM82633A123456)"
          placeholderTextColor={"#ddd"}
          value={vin}
          maxLength={17}
          onChangeText={setVin}
          // onFocus={() => setHistoryModalVisible(true)}
        />
        <VinScannerButton onVinDetected={handleVinDetected} />
        {vin ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setVin("")}
          >
            <Ionicons name="close-circle" size={26} color="#999" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setHistoryModalVisible(true)}
          >
            <Ionicons name="time-outline" size={26} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <CustomButton
        title="Look Up"
        icon="search"
        onPress={handleVinSubmission}
      />

      <VinHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        onSelectVin={handleSelectVin}
      />
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    fontFamily: "Aeonik",
    padding: 16,
    fontSize: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    textAlign: "center",
  },
  clearButton: {
    position: "absolute",
    right: "3%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 5,
  },
  historyButton: {
    position: "absolute",
    right: "3%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 5,
  },
});

export default VinSubmission;
