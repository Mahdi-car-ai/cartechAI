import React, { useState, useEffect } from "react";
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
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import CustomButton from "@/components/Button";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Logo from "@/components/ui/Logo";
import { Icon } from "react-native-elements";
import api from "@/services/api";

// Import types
import {
  CarMake,
  CarModel,
  CarDetails,
  SelectOption,
  RootStackParamList,
} from "@/types/car";

// Import constants
import {
  FUEL_TYPES,
  ENGINE_CYLINDERS,
  TRANSMISSION_STYLES,
  DRIVE_TYPES,
  VEHICLE_TYPES,
  BODY_CLASSES,
} from "@/constants/carOptions";

// Import API services
import {
  fetchCarMakes,
  fetchCarModels,
  fetchVehicleVariableValues,
} from "@/services/carApi";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function EnterCarDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const width = useWindowDimensions().width * 0.9;
  const [carDetails, setCarDetails] = useState<CarDetails>({
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

  // Store raw engine displacement without "L" suffix
  const [engineDisplacementRaw, setEngineDisplacementRaw] = useState("");

  // State to track focused input
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Generic modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // State for options lists
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({
    fuelType: FUEL_TYPES,
    engineCylinders: ENGINE_CYLINDERS,
    transmissionStyle: TRANSMISSION_STYLES,
    driveType: DRIVE_TYPES,
    vehicleType: VEHICLE_TYPES,
    bodyClass: BODY_CLASSES,
  });

  // State for filtered options
  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>([]);

  // State for API loading state
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // State for make dropdown
  const [carMakes, setCarMakes] = useState<CarMake[]>([]);
  const [filteredMakes, setFilteredMakes] = useState<CarMake[]>([]);

  // State for model dropdown
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<CarModel[]>([]);

  // State for year dropdown
  const [years, setYears] = useState<string[]>([]);
  const [filteredYears, setFilteredYears] = useState<string[]>([]);

  // Generate years from current year to 1990
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let year = currentYear + 1; year >= 1990; year--) {
      yearsList.push(year.toString());
    }
    setYears(yearsList);
    setFilteredYears(yearsList);
  }, []);

  // Filter options based on search text
  useEffect(() => {
    if (activeModal === null) return;

    // Handle special cases
    if (activeModal === "make" && carMakes.length > 0) {
      setFilteredMakes(
        carMakes.filter((make) =>
          make.MakeName.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
      return;
    }

    if (activeModal === "model" && carModels.length > 0) {
      setFilteredModels(
        carModels.filter((model) =>
          model.Model_Name.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
      return;
    }

    if (activeModal === "modelYear" && years.length > 0) {
      setFilteredYears(years.filter((year) => year.includes(searchText)));
      return;
    }

    // Handle generic options
    if (options[activeModal]) {
      setFilteredOptions(
        options[activeModal].filter((option) =>
          option.name.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    }
  }, [searchText, activeModal, carMakes, carModels, years, options]);

  // Fetch data from API when opening a modal
  const openModal = async (field: string) => {
    setActiveModal(field);
    setSearchText("");

    // Special cases
    if (field === "make") {
      await loadCarMakes();
      return;
    }

    if (field === "model") {
      if (carDetails.make) {
        await loadCarModels();
      }
      return;
    }

    // Set filtered options for predefined lists
    if (options[field]) {
      setFilteredOptions(options[field]);
    } else {
      // For other fields that might need API calls in the future
      setFilteredOptions([]);
    }
  };

  const loadCarMakes = async () => {
    try {
      setLoading(true);
      const data = await fetchCarMakes();
      setCarMakes(data);
      setFilteredMakes(data);
    } catch (error) {
      console.error("Error loading car makes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCarModels = async () => {
    try {
      if (!carDetails.make) {
        return;
      }

      setLoading(true);
      const data = await fetchCarModels(carDetails.make);
      setCarModels(data);
      setFilteredModels(data);
    } catch (error) {
      console.error("Error loading car models:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (field: string, value: string) => {
    setCarDetails({ ...carDetails, [field]: value });
    setActiveModal(null);
    setSearchText("");

    // If make changes, reset model
    if (field === "make") {
      setCarDetails((prev) => ({ ...prev, model: "", make: value }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setCarDetails({ ...carDetails, [field]: value });
  };

  const isAnyFieldFilled = () => {
    return Object.values(carDetails).some((value) => value.trim() !== "");
  };

  const goToChat = async () => {
    try {
      setChatLoading(true);
      
      // Use api service to create chat with bot
      const response = await api.post(
        "/chats/create-with-bot"
      );

      // Add type assertion for the response data
      const chatId = response.data as string;

      console.log(chatId, "chatId");
      
      // Navigate to chat screen with the returned chat ID
      navigation.navigate("ChatScreen", {
        carDetails: carDetails,
        chatId: chatId,
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      Alert.alert("Error", "Failed to create chat. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Render field based on type
  const renderCarDetailField = (key: string) => {
    // Special case for model - disabled if no make is selected
    if (key === "model") {
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.input,
            { width: width },
            focusedInput === key && styles.inputFocused,
            !carDetails.make && styles.disabledInput,
          ]}
          onPress={() => carDetails.make && openModal(key)}
          disabled={!carDetails.make}
        >
          <Text
            style={[
              styles.inputText,
              !carDetails[key] && styles.placeholderText,
              !carDetails.make && styles.disabledText,
            ]}
          >
            {carDetails[key] ||
              key
                .replace(/([A-Z])/g, " $1")
                .trim()
                .replace(/\b\w/g, (char) => char.toUpperCase())}
          </Text>
        </TouchableOpacity>
      );
    }

    // Special case for engineDisplacement - regular text input
    if (key === "engineDisplacement") {
      // Show formatted value with L if not focused
      const displayValue =
        focusedInput === key ? engineDisplacementRaw : carDetails[key];

      return (
        <TextInput
          key={key}
          style={[
            styles.input,
            { width: width },
            focusedInput === key && styles.inputFocused,
          ]}
          placeholder="Engine Displacement"
          placeholderTextColor="#aaa"
          value={displayValue}
          onChangeText={(text) => {
            // Strip L if present
            const rawText = text.endsWith("L") ? text.slice(0, -1) : text;

            // Only allow numbers and a single decimal point
            let processedValue = rawText.replace(/[^0-9.]/g, "");

            // Convert special formats: 05 -> 0.5, .5 -> 0.5
            if (/^0\d$/.test(processedValue)) {
              processedValue = `0.${processedValue[1]}`;
            } else if (/^\.\d+$/.test(processedValue)) {
              processedValue = `0${processedValue}`;
            }

            // Prevent multiple decimal points
            const parts = processedValue.split(".");
            if (parts.length > 2) {
              processedValue = `${parts[0]}.${parts.slice(1).join("")}`;
            }

            // Update raw value
            setEngineDisplacementRaw(processedValue);

            // Update carDetails with raw value (no L) while focused
            handleChange(key, processedValue);
          }}
          onFocus={() => {
            setFocusedInput(key);
            // When focusing, remove L if present and store raw value
            if (carDetails[key].endsWith("L")) {
              setEngineDisplacementRaw(carDetails[key].slice(0, -1));
            } else {
              setEngineDisplacementRaw(carDetails[key]);
            }
          }}
          onBlur={() => {
            setFocusedInput(null);
            // When blurring, add L suffix
            if (engineDisplacementRaw) {
              const formattedValue = `${engineDisplacementRaw}L`;
              handleChange(key, formattedValue);
            }
          }}
          keyboardType="decimal-pad"
        />
      );
    }

    // Regular text inputs for trim, plantCity, and plantCountry
    if (key === "trim" || key === "plantCity" || key === "plantCountry") {
      return (
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
          onFocus={() => setFocusedInput(key)}
          onBlur={() => setFocusedInput(null)}
        />
      );
    }

    // For all other fields, render a touchable input that opens a modal
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.input,
          { width: width },
          focusedInput === key && styles.inputFocused,
        ]}
        onPress={() => openModal(key)}
      >
        <Text
          style={[styles.inputText, !carDetails[key] && styles.placeholderText]}
        >
          {carDetails[key] ||
            key
              .replace(/([A-Z])/g, " $1")
              .trim()
              .replace(/\b\w/g, (char) => char.toUpperCase())}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render the appropriate content for the active modal
  const renderModalContent = () => {
    if (!activeModal) return null;

    // Modal title based on activeModal
    const getModalTitle = () => {
      let title = activeModal
        .replace(/([A-Z])/g, " $1")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());

      if (activeModal === "model" && carDetails.make) {
        title = `Select ${title} for ${carDetails.make}`;
      } else {
        title = `Select ${title}`;
      }

      return title;
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={activeModal !== null}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.closeButton}
              >
                <Icon name="close" color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeModal}...`}
              placeholderTextColor="#aaa"
              value={searchText}
              onChangeText={setSearchText}
              keyboardType={activeModal === "modelYear" ? "numeric" : "default"}
            />

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#95ff77"
                style={styles.loader}
              />
            ) : (
              renderModalList()
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Render the appropriate list for the active modal
  const renderModalList = () => {
    if (!activeModal) return null;

    // Special case for make
    if (activeModal === "make") {
      return (
        <FlatList
          data={filteredMakes}
          keyExtractor={(item) => item.MakeId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => selectOption("make", item.MakeName)}
            >
              <Text style={styles.listItemText}>{item.MakeName}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      );
    }

    // Special case for model
    if (activeModal === "model") {
      return (
        <FlatList
          data={filteredModels}
          keyExtractor={(item) => item.Model_ID.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => selectOption("model", item.Model_Name)}
            >
              <Text style={styles.listItemText}>{item.Model_Name}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      );
    }

    // Special case for modelYear
    if (activeModal === "modelYear") {
      return (
        <FlatList
          data={filteredYears}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => selectOption("modelYear", item)}
            >
              <Text style={styles.listItemText}>{item}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      );
    }

    // Generic options list
    return (
      <FlatList
        data={filteredOptions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => selectOption(activeModal, item.name)}
          >
            <Text style={styles.listItemText}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.listItemDescription}>{item.description}</Text>
            ) : null}
          </TouchableOpacity>
        )}
        style={styles.list}
      />
    );
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
          {Object.keys(carDetails).map(renderCarDetailField)}
        </ScrollView>

        <CustomButton
          title="Chat"
          icon="chat"
          onPress={goToChat}
          style={styles.chatButton}
          disabled={!isAnyFieldFilled() || chatLoading}
          loading={chatLoading}
        />

        {/* Unified modal for all selection types */}
        {renderModalContent()}
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
    justifyContent: "center",
  },
  disabledInput: {
    borderColor: "#22241f",
    backgroundColor: "#22241f",
  },
  inputText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
  },
  disabledText: {
    color: "#555",
  },
  placeholderText: {
    color: "#aaa",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "#1a1c1b",
    borderRadius: 16,
    padding: 16,
    borderColor: "#2a2e2e",
    borderWidth: 1.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Aeonik",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  searchInput: {
    backgroundColor: "#2a2e2e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: "#fff",
    fontFamily: "Aeonik",
  },
  list: {
    flex: 1,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2e2e",
  },
  listItemText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
  },
  listItemDescription: {
    fontSize: 12,
    color: "#aaa",
    fontFamily: "Aeonik",
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
