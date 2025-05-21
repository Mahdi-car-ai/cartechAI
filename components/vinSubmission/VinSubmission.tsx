import React, { FC, useState } from "react";
import {
  Alert,
  TextInput,
  useWindowDimensions,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { addVinToHistory } from "@/store/slices/vinHistorySlice";
import CustomButton from "@/components/Button/Button";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/NavigationTypes";
import VinHistoryModal from "./VinHistoryModal";
import VinScannerButton from "./VinScannerButton";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./VinSubmissionStyles";

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
          placeholder="Edit Car Details"
          placeholderTextColor={"#F9F9F9"}
          value={vin}
          maxLength={17}
          onChangeText={setVin}
          selectionColor={"#A3FE07"}
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
        title="Continue"
        // icon="search"
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

export default VinSubmission;
