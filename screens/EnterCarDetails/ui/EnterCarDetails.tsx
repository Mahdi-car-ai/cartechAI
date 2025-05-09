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

        setCarDetails((prev) => ({
          ...prev,
          fuelType: data.engine?.displacement_l_ci || "",
          engineCylinders:
            data.engine?.engine_model?.replace(/[^0-9]/g, "") || "",
          engineDisplacement: data.engine?.['displacement_(l_ci)']
            ? `${data.engine['displacement_(l_ci)']}L`
            : "",
          vehicleType: data.basic?.vehicle_size || "",
          transmissionStyle: data.transmission?.transmission_style || "",
          driveType: data.drivetrain?.drive_type || "",
          bodyClass: data.basic?.vehicle_size || "",
          plantCity: "",
          plantCountry: "",
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

        setCarDetails((prev) => ({
          ...prev,
          fuelType: data.engine?.displacement_l_ci || "",
          engineCylinders:
            data.engine?.engine_model?.replace(/[^0-9]/g, "") || "",
          engineDisplacement: data.engine?.['displacement_(l_ci)']
            ? `${data.engine['displacement_(l_ci)']}L`
            : "",
          vehicleType: data.basic?.vehicle_size || "",
          transmissionStyle: data.transmission?.transmission_style || "",
          driveType: data.drivetrain?.drive_type || "",
          bodyClass: data.basic?.vehicle_size || "",
          plantCity: "",
          plantCountry: "",
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

  const renderCarDetailField = (key: string) => {
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

    if (
      [
        "fuelType",
        "engineCylinders",
        "engineDisplacement",
        "vehicleType",
        "transmissionStyle",
        "driveType",
        "bodyClass",
      ].includes(key)
    ) {
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.input,
            { width: width },
            focusedInput === key && styles.inputFocused,
            true && styles.disabledInput,
          ]}
          disabled={true}
        >
          <Text
            style={[
              styles.inputText,
              !carDetails[key] && styles.placeholderText,
              !carDetails[key] && styles.disabledText,
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
        {renderModalContent()}
      </View>
    </KeyboardAvoidingView>
  );
}
