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
import { RootStackParamList } from "@/types/NavigationTypes";

import { VehicleDatabaseCarDetails } from "@/types/car";
import { CarDetails as ScreenCarDetails } from "@/types/car";

import {
  fetchCarYears,
  fetchCarMakes,
  fetchCarModels,
  fetchCarTrims,
  fetchCarSpecifications,
} from "@/services/carApi";
import { styles } from "@/screens/EnterCarDetails/ui/EnterCarDetailsStyles";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function EnterCarDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const width = useWindowDimensions().width * 0.9;
  const [carDetails, setCarDetails] = useState<ScreenCarDetails>({
    modelYear: "",
    make: "",
    model: "",
    trim: "",
    fuelType: "",
    engineCylinders: "",
    engineDisplacement: "",
    vehicleType: "",
    transmissionStyle: "",
    driveType: "",
    bodyClass: "",
    plantCity: "",
    plantCountry: "",
  });

  const [specifications, setSpecifications] =
    useState<VehicleDatabaseCarDetails | null>(null);

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [specLoading, setSpecLoading] = useState(false);
  const [years, setYears] = useState<string[]>([]);
  const [filteredYears, setFilteredYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [filteredMakes, setFilteredMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [filteredTrims, setFilteredTrims] = useState<string[]>([]);

  // State to control showing detailed specifications
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (activeModal === null) return;

    switch (activeModal) {
      case "modelYear":
        setFilteredYears(years.filter((year) => year.includes(searchText)));
        break;
      case "make":
        setFilteredMakes(
          makes.filter((make) =>
            make.toLowerCase().includes(searchText.toLowerCase()),
          ),
        );
        break;
      case "model":
        setFilteredModels(
          models.filter((model) =>
            model.toLowerCase().includes(searchText.toLowerCase()),
          ),
        );
        break;
      case "trim":
        setFilteredTrims(
          trims.filter((trim) =>
            trim.toLowerCase().includes(searchText.toLowerCase()),
          ),
        );
        break;
      default:
        break;
    }
  }, [searchText, activeModal, years, makes, models, trims]);

  const loadYears = async () => {
    try {
      setLoading(true);
      const data = await fetchCarYears();
      setYears(data);
      setFilteredYears(data);
    } catch (error) {
      console.error("Error loading years:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMakes = async () => {
    try {
      if (!carDetails.modelYear) {
        return;
      }

      setLoading(true);
      const data = await fetchCarMakes(carDetails.modelYear);
      setMakes(data);
      setFilteredMakes(data);
    } catch (error) {
      console.error("Error loading makes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      if (!carDetails.modelYear || !carDetails.make) {
        return;
      }

      setLoading(true);
      const data = await fetchCarModels(carDetails.modelYear, carDetails.make);
      setModels(data);
      setFilteredModels(data);
    } catch (error) {
      console.error("Error loading models:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrims = async () => {
    try {
      if (!carDetails.modelYear || !carDetails.make || !carDetails.model) {
        return;
      }

      setLoading(true);
      const data = await fetchCarTrims(
        carDetails.modelYear,
        carDetails.make,
        carDetails.model,
      );
      setTrims(data);
      setFilteredTrims(data);
    } catch (error) {
      console.error("Error loading trims:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificationsWithData = async (
    year: string,
    make: string,
    model: string,
    trim: string,
  ) => {
    try {
      if (!year || !make || !model || !trim) {
        return;
      }

      setLoading(true);
      setSpecLoading(true);
      const data = await fetchCarSpecifications(year, make, model, trim);

      if (data) {
        setSpecifications(data);

        // Only update fields that don't already have user-entered values
        setCarDetails((prev) => ({
          ...prev,
          // Only set API values if the corresponding field is empty
          fuelType: prev.fuelType || data.engine?.displacement_l_ci || "",
          engineCylinders:
            prev.engineCylinders ||
            data.engine?.engine_model?.replace(/[^0-9]/g, "") ||
            "",
          engineDisplacement:
            prev.engineDisplacement ||
            (data.engine?.["displacement_(l_ci)"]
              ? `${data.engine["displacement_(l_ci)"]}L`
              : ""),
          vehicleType: prev.vehicleType || data.basic?.vehicle_size || "",
          transmissionStyle:
            prev.transmissionStyle ||
            data.transmission?.transmission_style ||
            "",
          driveType: prev.driveType || data.drivetrain?.drive_type || "",
          bodyClass: prev.bodyClass || data.basic?.vehicle_size || "",
          // These fields are typically entered manually, preserve them
          plantCity: prev.plantCity || "",
          plantCountry: prev.plantCountry || "",
        }));
      }
    } catch (error: any) {
      console.error("Error loading specifications:", error);

      // Перевірка, чи помилка у форматі JSON рядка з повідомленням 'You don't have access to this API'
      let errorObj = error;
      if (typeof error === "string") {
        try {
          errorObj = JSON.parse(error);
        } catch (e) {
          // Ігноруємо помилку парсингу
        }
      }

      if (
        error?.message === "You don't have access to this API." ||
        error?.statusCode === 401 ||
        (error?.response && error?.response.status === 401) ||
        errorObj?.statusCode === 401 ||
        errorObj?.message === "You don't have access to this API."
      ) {
        Alert.alert(
          "Access Error",
          "You don't have access to this vehicle data API. Please check your API credentials or subscription.",
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load vehicle specifications. Please try again later.",
          [{ text: "OK" }],
        );
      }
    } finally {
      setLoading(false);
      setSpecLoading(false);
    }
  };

  const loadSpecifications = async () => {
    try {
      if (
        !carDetails.modelYear ||
        !carDetails.make ||
        !carDetails.model ||
        !carDetails.trim
      ) {
        return;
      }

      setLoading(true);
      setSpecLoading(true);
      const data = await fetchCarSpecifications(
        carDetails.modelYear,
        carDetails.make,
        carDetails.model,
        carDetails.trim,
      );

      if (data) {
        setSpecifications(data);

        // Only update fields that don't already have user-entered values
        setCarDetails((prev) => ({
          ...prev,
          // Only set API values if the corresponding field is empty
          fuelType: prev.fuelType || data.engine?.displacement_l_ci || "",
          engineCylinders:
            prev.engineCylinders ||
            data.engine?.engine_model?.replace(/[^0-9]/g, "") ||
            "",
          engineDisplacement:
            prev.engineDisplacement ||
            (data.engine?.["displacement_(l_ci)"]
              ? `${data.engine["displacement_(l_ci)"]}L`
              : ""),
          vehicleType: prev.vehicleType || data.basic?.vehicle_size || "",
          transmissionStyle:
            prev.transmissionStyle ||
            data.transmission?.transmission_style ||
            "",
          driveType: prev.driveType || data.drivetrain?.drive_type || "",
          bodyClass: prev.bodyClass || data.basic?.vehicle_size || "",
          // These fields are typically entered manually, preserve them
          plantCity: prev.plantCity || "",
          plantCountry: prev.plantCountry || "",
        }));
      }
    } catch (error: any) {
      console.error("Error loading specifications:", error);

      // Перевірка, чи помилка у форматі JSON рядка з повідомленням 'You don't have access to this API'
      let errorObj = error;
      if (typeof error === "string") {
        try {
          errorObj = JSON.parse(error);
        } catch (e) {
          // Ігноруємо помилку парсингу
        }
      }

      if (
        error?.message === "You don't have access to this API." ||
        error?.statusCode === 401 ||
        (error?.response && error?.response.status === 401) ||
        errorObj?.statusCode === 401 ||
        errorObj?.message === "You don't have access to this API."
      ) {
        Alert.alert(
          "Access Error",
          "You don't have access to this vehicle data API. Please check your API credentials or subscription.",
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load vehicle specifications. Please try again later.",
          [{ text: "OK" }],
        );
      }
    } finally {
      setLoading(false);
      setSpecLoading(false);
    }
  };

  const openModal = async (field: string) => {
    setActiveModal(field);
    setSearchText("");

    switch (field) {
      case "modelYear":
        break;
      case "make":
        if (carDetails.modelYear) {
          await loadMakes();
        }
        break;
      case "model":
        if (carDetails.modelYear && carDetails.make) {
          await loadModels();
        }
        break;
      case "trim":
        if (carDetails.modelYear && carDetails.make && carDetails.model) {
          await loadTrims();
        }
        break;
      default:
        break;
    }
  };

  const selectOption = async (field: string, value: string) => {
    const updatedDetails = { ...carDetails, [field]: value };

    if (field === "modelYear") {
      updatedDetails.make = "";
      updatedDetails.model = "";
      updatedDetails.trim = "";
      updatedDetails.fuelType = "";
      updatedDetails.engineCylinders = "";
      updatedDetails.engineDisplacement = "";
      updatedDetails.vehicleType = "";
      updatedDetails.transmissionStyle = "";
      updatedDetails.driveType = "";
      updatedDetails.bodyClass = "";
    } else if (field === "make") {
      updatedDetails.model = "";
      updatedDetails.trim = "";
      updatedDetails.fuelType = "";
      updatedDetails.engineCylinders = "";
      updatedDetails.engineDisplacement = "";
      updatedDetails.vehicleType = "";
      updatedDetails.transmissionStyle = "";
      updatedDetails.driveType = "";
      updatedDetails.bodyClass = "";
    } else if (field === "model") {
      updatedDetails.trim = "";
      updatedDetails.fuelType = "";
      updatedDetails.engineCylinders = "";
      updatedDetails.engineDisplacement = "";
      updatedDetails.vehicleType = "";
      updatedDetails.transmissionStyle = "";
      updatedDetails.driveType = "";
      updatedDetails.bodyClass = "";
    }

    setCarDetails(updatedDetails);
    setActiveModal(null);

    if (field === "trim") {
      await loadSpecificationsWithData(
        updatedDetails.modelYear,
        updatedDetails.make,
        updatedDetails.model,
        updatedDetails.trim,
      );
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

      const response = await api.post("/chats/create-with-bot");

      const chatId = response.data as string;

      const formattedCarDetails = {
        Make: carDetails.make,
        Model: carDetails.model,
        "Model Year": carDetails.modelYear,
        Trim: carDetails.trim,
        BodyClass: carDetails.bodyClass,
        DriveType: carDetails.driveType,
        EngineCylinders: carDetails.engineCylinders,
        "Fuel Type Primary": carDetails.fuelType,
        GVWR: "",
        TransmissionStyle: carDetails.transmissionStyle,
        VIN: "",
        ManufacturerName: "",
        PlantCity: carDetails.plantCity,
        PlantCountry: carDetails.plantCountry,
        PlantState: "",
        VehicleType: carDetails.vehicleType,
        DisplacementL: carDetails.engineDisplacement,
        EngineConfiguration: "",
        FuelDeliveryType: "",
        SeatBeltsType: "",
        AirBagLocations: "",
        ErrorCode: "",
        ErrorText: "",
        SuggestedVIN: "",
        PossibleValues: "",
        AdditionalErrorText: "",
        VehicleDescriptor: "",
        DestinationMarket: "",
        Series: "",
        PlantCompanyName: "",
        Trim2: "",
        Series2: "",
        Note: "",
        BasePrice: "",
        NonLandUse: "",
        Doors: "",
        Windows: "",
        WheelBaseType: "",
        TrackWidth: "",
        GrossVehicleWeightRatingFrom: "",
        BedLength: "",
        CurbWeight: "",
        WheelBaseFrom: "",
        WheelBaseTo: "",
        GrossCombinationWeightRatingFrom: "",
        GrossCombinationWeightRatingTo: "",
        GrossVehicleWeightRatingTo: "",
        BedType: "",
        CabType: "",
        TrailerTypeConnection: "",
        TrailerBodyType: "",
        TrailerLength: "",
        OtherTrailerInfo: "",
        NumberOfWheels: "",
        WheelSizeFront: "",
        WheelSizeRear: "",
        EntertainmentSystem: "",
        SteeringLocation: "",
        NumberOfSeats: "",
        NumberOfSeatRows: "",
        TransmissionSpeeds: "",
        Axles: "",
        AxleConfiguration: "",
        BrakeSystemType: "",
        BrakeSystemDescription: "",
        OtherBatteryInfo: "",
        BatteryType: "",
        NumberOfBatteryCellsPerModule: "",
        BatteryCurrentFrom: "",
        BatteryVoltageFrom: "",
        BatteryEnergyFrom: "",
        EVDriveUnit: "",
        BatteryCurrentTo: "",
        BatteryVoltageTo: "",
        BatteryEnergyTo: "",
        NumberOfBatteryModulesPerPack: "",
        NumberOfBatteryPacksPerVehicle: "",
        ChargerLevel: "",
        ChargerPower: "",
        DisplacementCC: "",
        DisplacementCI: "",
        EngineStrokeCycles: "",
        EngineModel: "",
        EnginePower: "",
        ValveTrainDesign: "",
        FuelTypeSecondary: "",
        EngineBrakeFrom: "",
        CoolingType: "",
        EngineBrakeTo: "",
        ElectrificationLevel: "",
        OtherEngineInfo: "",
        Turbo: "",
        TopSpeed: "",
        EngineManufacturer: "",
        Pretensioner: "",
        OtherRestraintSystemInfo: "",
        CurtainAirBagLocations: "",
        SeatCushionAirBagLocations: "",
        FrontAirBagLocations: "",
        KneeAirBagLocations: "",
        SideAirBagLocations: "",
        AntiLockBrakingSystem: "",
        ElectronicStabilityControl: "",
        TractionControl: "",
        TirePressureMonitoringSystemType: "",
        ActiveSafetySystemNote: "",
        AutoReverseSystem: "",
        AutomaticPedestrianAlertingSound: "",
        EventDataRecorder: "",
        KeylessIgnition: "",
        SAEAutomationLevelFrom: "",
        SAEAutomationLevelTo: "",
        AdaptiveCruiseControl: "",
        CrashImminentBraking: "",
        BlindSpotWarning: "",
        ForwardCollisionWarning: "",
        LaneDepartureWarning: "",
        LaneKeepingAssistance: "",
        BackupCamera: "",
        ParkingAssist: "",
        BusLength: "",
        BusFloorConfigurationType: "",
        BusType: "",
        OtherBusInfo: "",
        CustomMotorcycleType: "",
        MotorcycleSuspensionType: "",
        MotorcycleChassisType: "",
        OtherMotorcycleInfo: "",
        DynamicBrakeSupport: "",
        PedestrianAutomaticEmergencyBraking: "",
        AutomaticCrashNotification: "",
        DaytimeRunningLight: "",
        HeadlampLightSource: "",
        SemiautomaticHeadlampBeamSwitching: "",
        AdaptiveDrivingBeam: "",
        RearCrossTrafficAlert: "",
        RearAutomaticEmergencyBraking: "",
        BlindSpotIntervention: "",
        LaneCenteringAssistance: "",
      };

      navigation.navigate("ChatScreen", {
        carDetails: formattedCarDetails,
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

  // Determine if a field should be disabled based on dependencies
  const isFieldDisabled = (field: string) => {
    switch (field) {
      case "make":
        return !carDetails.modelYear;
      case "model":
        return !carDetails.modelYear || !carDetails.make;
      case "trim":
        return !carDetails.modelYear || !carDetails.make || !carDetails.model;
      default:
        return false;
    }
  };

  // Determine if a field should be editable manually
  const isFieldManuallyEditable = (field: string) => {
    // Primary fields are selected from dropdowns
    if (["modelYear", "make", "model", "trim"].includes(field)) {
      return false;
    }

    // These fields should be editable if they're empty or user wants to modify them
    return [
      "fuelType",
      "engineCylinders",
      "engineDisplacement",
      "vehicleType",
      "transmissionStyle",
      "driveType",
      "bodyClass",
      "plantCity",
      "plantCountry",
    ].includes(field);
  };

  // Render field based on type
  const renderCarDetailField = (key: string) => {
    // Fields that depend on the selection sequence (year -> make -> model -> trim)
    if (["modelYear", "make", "model", "trim"].includes(key)) {
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.input,
            { width: width },
            focusedInput === key && styles.inputFocused,
            isFieldDisabled(key) && styles.disabledInput,
          ]}
          onPress={() => !isFieldDisabled(key) && openModal(key)}
          disabled={isFieldDisabled(key)}
        >
          <Text
            style={[
              styles.inputText,
              !carDetails[key] && styles.placeholderText,
              isFieldDisabled(key) && styles.disabledText,
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

    // Fields that are populated from specifications but can be manually edited
    if (isFieldManuallyEditable(key)) {
      return (
        <TextInput
          key={key}
          style={[
            styles.input,
            { width: width },
            focusedInput === key && styles.inputFocused,
            // carDetails[key] ? styles.filledInput : styles.emptyInput,
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

    // Regular text inputs for other fields
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
  };

  const renderModalContent = () => {
    if (!activeModal) return null;

    const getModalTitle = () => {
      let title = activeModal
        .replace(/([A-Z])/g, " $1")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());

      if (activeModal === "model" && carDetails.make) {
        title = `Select ${title} for ${carDetails.make}`;
      } else if (activeModal === "trim" && carDetails.model) {
        title = `Select ${title} for ${carDetails.model}`;
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

  const renderModalList = () => {
    if (!activeModal) return null;

    switch (activeModal) {
      case "modelYear":
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
      case "make":
        return (
          <FlatList
            data={filteredMakes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => selectOption("make", item)}
              >
                <Text style={styles.listItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.list}
          />
        );
      case "model":
        return (
          <FlatList
            data={filteredModels}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => selectOption("model", item)}
              >
                <Text style={styles.listItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.list}
          />
        );
      case "trim":
        return (
          <FlatList
            data={filteredTrims}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => selectOption("trim", item)}
              >
                <Text style={styles.listItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={styles.list}
          />
        );
      default:
        return null;
    }
  };

  // Helper function to render specification section headers
  const renderSpecSectionHeader = (title: string) => (
    <View style={styles.specSectionHeader}>
      <Text style={styles.specSectionTitle}>{title}</Text>
    </View>
  );

  // Helper function to render specification items
  const renderSpecItem = (label: string, value: string | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.specItemRow} key={label}>
        <Text style={styles.specItemLabel}>{label}:</Text>
        <Text style={styles.specItemValue}>{value}</Text>
      </View>
    );
  };

  // Render detailed specifications
  const renderDetailedSpecifications = () => {
    if (!specifications) return null;

    return (
      <View style={styles.detailedSpecsContainer}>
        <TouchableOpacity
          style={styles.specsTitleBar}
          onPress={() => setShowDetailedSpecs(!showDetailedSpecs)}
        >
          <Text style={styles.specsTitleText}>Vehicle Specifications</Text>
          <Icon
            name={
              showDetailedSpecs ? "keyboard-arrow-up" : "keyboard-arrow-down"
            }
            color="#95ff77"
            size={24}
          />
        </TouchableOpacity>

        {showDetailedSpecs && (
          <>
            {/* Basic Information */}
            {specifications.basic && (
              <>
                {renderSpecSectionHeader("Basic Information")}
                {renderSpecItem("Make", specifications.basic.make)}
                {renderSpecItem("Model", specifications.basic.model)}
                {renderSpecItem("Year", specifications.basic.year)}
                {renderSpecItem("Trim", specifications.basic.trim)}
                {renderSpecItem("Doors", specifications.basic.doors)}
                {renderSpecItem(
                  "Vehicle Size",
                  specifications.basic.vehicle_size,
                )}
              </>
            )}

            {/* Engine */}
            {specifications.engine && (
              <>
                {renderSpecSectionHeader("Engine")}
                {renderSpecItem(
                  "Displacement",
                  specifications.engine["displacement_(l_ci)"],
                )}
                {renderSpecItem(
                  "Engine Model",
                  specifications.engine.engine_model,
                )}
                {renderSpecItem(
                  "Engine Camshaft",
                  specifications.engine.engine_camshaft,
                )}
                {renderSpecItem("Net Torque", specifications.engine.net_torque)}
                {renderSpecItem("Horsepower", specifications.engine.horsepower)}
                {renderSpecItem(
                  "SAE Net Horsepower RPM",
                  specifications.engine.sae_net_horsepower_rpm,
                )}
              </>
            )}

            {/* Transmission */}
            {specifications.transmission && (
              <>
                {renderSpecSectionHeader("Transmission")}
                {renderSpecItem(
                  "Transmission Style",
                  specifications.transmission.transmission_style,
                )}
              </>
            )}

            {/* Dimensions */}
            {specifications.dimensions && (
              <>
                {renderSpecSectionHeader("Dimensions")}
                {renderSpecItem("Width", specifications.dimensions.width)}
                {renderSpecItem("Height", specifications.dimensions.height)}
                {renderSpecItem("Length", specifications.dimensions.length)}
                {renderSpecItem(
                  "Ground Clearance",
                  specifications.dimensions.min_ground_clearance,
                )}
                {renderSpecItem(
                  "Wheelbase",
                  specifications.dimensions.wheelbase,
                )}
                {renderSpecItem(
                  "Trunk Volume",
                  specifications.dimensions.trunk_volume,
                )}
                {renderSpecItem(
                  "Front Legroom",
                  specifications.dimensions.front_legroom,
                )}
                {renderSpecItem(
                  "Rear Legroom",
                  specifications.dimensions.rear_legroom,
                )}
                {renderSpecItem(
                  "Front Headroom",
                  specifications.dimensions.rear_head_room,
                )}
                {renderSpecItem(
                  "Front Shoulder Room",
                  specifications.dimensions.front_shoulder_room,
                )}
                {renderSpecItem(
                  "Rear Shoulder Room",
                  specifications.dimensions.rear_shoulder_room,
                )}
              </>
            )}

            {/* Drivetrain */}
            {specifications.drivetrain && (
              <>
                {renderSpecSectionHeader("Drivetrain")}
                {renderSpecItem(
                  "Drive Type",
                  specifications.drivetrain.drive_type,
                )}
                {renderSpecItem(
                  "Final Drive Axle Ratio",
                  specifications.drivetrain.final_drive_axle_ratio,
                )}
              </>
            )}

            {/* Braking */}
            {specifications.braking && (
              <>
                {renderSpecSectionHeader("Braking")}
                {renderSpecItem(
                  "Front Brake Type",
                  specifications.braking.front_brake_type,
                )}
                {renderSpecItem(
                  "Rear Brake Type",
                  specifications.braking.rear_brake_type,
                )}
                {renderSpecItem(
                  "Disc Front",
                  specifications.braking.disc_front,
                )}
              </>
            )}

            {/* Suspension */}
            {specifications.suspension && (
              <>
                {renderSpecSectionHeader("Suspension")}
                {renderSpecItem(
                  "Steering Type",
                  specifications.suspension.steering_type,
                )}
                {renderSpecItem(
                  "Rear Suspension",
                  specifications.suspension.rear_suspension,
                )}
                {renderSpecItem(
                  "Front Suspension",
                  specifications.suspension.suspension_type_front_cont,
                )}
              </>
            )}

            {/* Weight */}
            {specifications.weight && (
              <>
                {renderSpecSectionHeader("Weight")}
                {renderSpecItem(
                  "Curb Weight",
                  specifications.weight.curb_weight,
                )}
              </>
            )}

            {/* Fuel */}
            {specifications.fuel && (
              <>
                {renderSpecSectionHeader("Fuel")}
                {renderSpecItem(
                  "Fuel Economy",
                  specifications.fuel.fuel_economy,
                )}
                {renderSpecItem(
                  "City Mileage",
                  specifications.fuel.city_mileage,
                )}
                {renderSpecItem(
                  "Highway Mileage",
                  specifications.fuel.highway_mileage,
                )}
                {renderSpecItem(
                  "Fuel Capacity",
                  specifications.fuel.fuel_capacity,
                )}
              </>
            )}

            {/* Market Value */}
            {specifications.market_value && (
              <>
                {renderSpecSectionHeader("Market Value")}
                {renderSpecItem("MSRP", specifications.market_value.msrp)}
                {renderSpecItem(
                  "Destination Charge",
                  specifications.market_value.destination_charge || "N/A",
                )}
              </>
            )}

            {/* Exterior Colors */}
            {specifications.colors?.exterior &&
              specifications.colors.exterior.length > 0 && (
                <>
                  {renderSpecSectionHeader("Exterior Colors")}
                  {specifications.colors.exterior.map((color, index) => (
                    <View style={styles.colorItem} key={`ext-${index}`}>
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: `rgb(${color.rgb})` },
                        ]}
                      />
                      <Text style={styles.colorName}>{color.color}</Text>
                    </View>
                  ))}
                </>
              )}

            {/* Interior Colors */}
            {specifications.colors?.interior &&
              specifications.colors.interior.length > 0 && (
                <>
                  {renderSpecSectionHeader("Interior Colors")}
                  {specifications.colors.interior.map((color, index) => (
                    <View style={styles.colorItem} key={`int-${index}`}>
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: `rgb(${color.rgb})` },
                        ]}
                      />
                      <Text style={styles.colorName}>{color.color}</Text>
                    </View>
                  ))}
                </>
              )}

            {/* Recalls */}
            {specifications.recalls && specifications.recalls.length > 0 && (
              <>
                {renderSpecSectionHeader("Recalls")}
                {specifications.recalls.map((recall, index) => (
                  <View style={styles.recallItem} key={`recall-${index}`}>
                    <Text style={styles.recallCampaign}>
                      {recall.campaign_info}
                    </Text>
                    <Text style={styles.recallSummary}>{recall.SUMMARY}</Text>
                    <View style={styles.recallDetails}>
                      <Text style={styles.recallLabel}>Consequences:</Text>
                      <Text style={styles.recallText}>
                        {recall.CONSEQUENCES}
                      </Text>
                    </View>
                    <View style={styles.recallDetails}>
                      <Text style={styles.recallLabel}>Remedy:</Text>
                      <Text style={styles.recallText}>{recall.REMEDY}</Text>
                    </View>
                    <View style={styles.recallDetails}>
                      <Text style={styles.recallLabel}>
                        Component Affected:
                      </Text>
                      <Text style={styles.recallText}>
                        {recall.COMPONENT_AFFECTED}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </View>
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

        {specLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#95ff77" />
            <Text style={styles.loadingText}>
              Loading car specifications...
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions for manually editable fields */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Select Year, Make, Model, and Trim, or edit fields manually.
            </Text>
            <Text style={styles.instructionsSubtext}>
              Dashed fields can be edited even after auto-filling.
            </Text>
          </View>

          {Object.keys(carDetails).map(renderCarDetailField)}

          {/* Display detailed specifications when available */}
          {specifications && renderDetailedSpecifications()}
        </ScrollView>

        <CustomButton
          title="Chat"
          icon="chat"
          onPress={goToChat}
          style={styles.chatButton}
          disabled={!isAnyFieldFilled() || chatLoading}
          loading={chatLoading}
        />
        {renderModalContent()}
      </View>
    </KeyboardAvoidingView>
  );
}
