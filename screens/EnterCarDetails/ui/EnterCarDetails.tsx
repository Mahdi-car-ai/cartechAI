import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import CustomButton from "@/components/Button";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Logo from "@/components/ui/Logo";
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
import DetailedSpecifications from "./DetailedSpecifications/DetailedSpecifications";
import SelectionModal from "./SelectionModal/SelectionModal";
import CarDetailField from "./CarDetailField/CarDetailField";

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
          plantCity: prev.plantCity || "",
          plantCountry: prev.plantCountry || "",
        }));
      }
    } catch (error: any) {
      console.error("Error loading specifications:", error);

      let errorObj = error;
      if (typeof error === "string") {
        try {
          errorObj = JSON.parse(error);
        } catch (e) {}
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

  const isFieldManuallyEditable = (field: string) => {
    if (["modelYear", "make", "model", "trim"].includes(field)) {
      return false;
    }

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

  const getModalTitle = () => {
    if (!activeModal) return "";

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

  const getModalOptions = () => {
    if (!activeModal) return [];

    switch (activeModal) {
      case "modelYear":
        return filteredYears;
      case "make":
        return filteredMakes;
      case "model":
        return filteredModels;
      case "trim":
        return filteredTrims;
      default:
        return [];
    }
  };

  const handleOptionSelect = (value: string) => {
    if (activeModal) {
      selectOption(activeModal, value);
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
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Select Year, Make, Model, and Trim, or edit fields manually.
            </Text>
            <Text style={styles.instructionsSubtext}>
              Dashed fields can be edited even after auto-filling.
            </Text>
          </View>

          {Object.keys(carDetails).map((key) => (
            <CarDetailField
              key={key}
              fieldKey={key}
              value={carDetails[key as keyof ScreenCarDetails]}
              width={width}
              focusedInput={focusedInput}
              isFieldDisabled={isFieldDisabled}
              isFieldManuallyEditable={isFieldManuallyEditable}
              onPress={openModal}
              handleChange={handleChange}
              onFocus={setFocusedInput}
              onBlur={() => setFocusedInput(null)}
            />
          ))}

          {specifications && (
            <DetailedSpecifications specifications={specifications} />
          )}
        </ScrollView>

        <CustomButton
          title="Chat"
          icon="chat"
          onPress={goToChat}
          style={styles.chatButton}
          disabled={!isAnyFieldFilled() || chatLoading}
          loading={chatLoading}
        />

        <SelectionModal
          visible={activeModal !== null}
          title={getModalTitle()}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onClose={() => setActiveModal(null)}
          onSelectOption={handleOptionSelect}
          options={getModalOptions()}
          loading={loading}
          keyboardType={activeModal === "modelYear" ? "numeric" : "default"}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
