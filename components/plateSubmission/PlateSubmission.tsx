import React, { FC, useState, useEffect } from "react";
import {
  Alert,
  TextInput,
  useWindowDimensions,
  TouchableOpacity,
  View,
  Text,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { useDispatch } from "react-redux";
import { addLicensePlateToHistory } from "@/store/slices/licensePlateHistorySlice";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/NavigationTypes";
import CustomButton from "@/components/Button";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/components/plateSubmission/PlateSubmissionStyles";
import { LicensePlateResponse } from "@/components/plateSubmission/model/types/LicensePlateResponse";
import { US_STATES } from "@/components/plateSubmission/model/constants/US_STATES";
import LicensePlateHistoryModal from "@/components/plateSubmission/licensePlateHistoryModal/LicensePlateHistoryModal";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PlateSubmission: FC = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [stateCode, setStateCode] = useState("NY");
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [licensePlateHistoryVisible, setLicensePlateHistoryVisible] =
    useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [filteredStates, setFilteredStates] = useState(US_STATES);

  const navigation = useNavigation<NavigationProp>();
  const windowDimensions = useWindowDimensions();
  const dispatch = useDispatch();

  useEffect(() => {
    if (stateSearch) {
      const filtered = US_STATES.filter((state) =>
        state.toLowerCase().includes(stateSearch.toLowerCase()),
      );
      setFilteredStates(filtered);
    } else {
      setFilteredStates(US_STATES);
    }
  }, [stateSearch]);

  const clearLicensePlate = () => {
    setLicensePlate("");
  };

  const toggleStatePicker = () => {
    setShowStatePicker(!showStatePicker);
    setStateSearch("");
    setFilteredStates(US_STATES);
  };

  const selectState = (itemValue: string) => {
    setStateCode(itemValue);
    setShowStatePicker(false);
  };

  const handleHistorySelect = (plate: string, state: string) => {
    setLicensePlate(plate);
    setStateCode(state);
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

    dispatch(
      addLicensePlateToHistory({
        plate: licensePlate.trim(),
        state: stateCode,
      }),
    );

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
        ) : (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setLicensePlateHistoryVisible(true)}
          >
            <Ionicons name="time-outline" size={26} color="#999" />
          </TouchableOpacity>
        )}
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
        <TouchableWithoutFeedback onPress={toggleStatePicker}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select State</Text>
                <TouchableOpacity onPress={toggleStatePicker}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#999"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search states..."
                  value={stateSearch}
                  onChangeText={setStateSearch}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                {stateSearch ? (
                  <TouchableOpacity onPress={() => setStateSearch("")}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <FlatList
                data={filteredStates}
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
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomButton
        title="Look Up"
        icon="search"
        onPress={handlePlateSubmission}
      />

      <LicensePlateHistoryModal
        visible={licensePlateHistoryVisible}
        onClose={() => setLicensePlateHistoryVisible(false)}
        onSelectEntry={handleHistorySelect}
      />
    </>
  );
};

export default PlateSubmission;
