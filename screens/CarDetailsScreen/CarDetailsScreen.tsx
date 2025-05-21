import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import CustomButton from "@/components/Button/Button";
import { CarDetails } from "@/types/CarDetails";
import Logo from "@/components/ui/Logo";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { styles } from "./CarDetailsScreenStyles";

type RootStackParamList = {
  CarDetailsScreen: { vin: string };
  ChatScreen: { carDetails: CarDetails | null };
};

type CarDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "CarDetailsScreen"
>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function CarDetailsScreen() {
  const route = useRoute<CarDetailsScreenRouteProp>();
  const { vin } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [carDetails, setCarDetails] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].icon;

  const handleVinSubmission = async () => {
    if (!vin.trim()) {
      Alert.alert("Invalid Input", "Please enter a valid VIN.");
      return;
    }

    setLoading(true);
    setCarDetails(null);
    setError(null);

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
      );
      if (!response.ok) throw new Error("Failed to fetch data.");

      const data = await response.json();
      const results = data?.Results || [];

      if (results.length > 0) {
        const carDetails = results.reduce(
          (
            acc: CarDetails,
            { Variable, Value }: { Variable: string; Value: string }
          ) => {
            switch (Variable) {
              case "Make":
                acc.Make = Value;
                break;
              case "Model":
                acc.Model = Value;
                break;
              case "Model Year":
                acc["Model Year"] = Value;
                break;
              case "Fuel Type - Primary":
                acc["Fuel Type Primary"] = Value;
                break;
              case "Engine Number of Cylinders":
                acc.EngineCylinders = Value;
                break;
              case "Engine Displacement (L)":
                acc.DisplacementL = Value;
                break;
              case "Vehicle Type":
                acc.VehicleType = Value;
                break;
              case "Trim":
                acc.Trim = Value;
                break;
              case "Transmission Style":
                acc.TransmissionStyle = Value;
                break;
              case "Drive Type":
                acc.DriveType = Value;
                break;
              case "Body Class":
                acc.BodyClass = Value;
                break;
              case "Plant City":
                acc.PlantCity = Value;
                break;
              case "Plant Country":
                acc.PlantCountry = Value;
                break;
              default:
                break;
            }
            return acc;
          },
          {} as CarDetails
        );

        setCarDetails(carDetails);
      } else {
        setError("No vehicle details found for the given VIN.");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goToChat = () => {
    navigation.navigate("ChatScreen", { carDetails: carDetails });
  };

  useEffect(() => {
    handleVinSubmission();
  }, [vin]);

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("../../assets/images/ellipse.png")}
        style={styles.imageOverlay}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              horizontal={false}
            >
              {/* <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.backButton,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              <FontAwesome name="chevron-left" size={18} color={iconColor} />
              <Text style={{ marginLeft: 10, color: iconColor, fontSize: 16 }}>
                Back
              </Text>
            </TouchableOpacity>
            <Logo size={71.11} />
          </View>
          <Text style={[styles.subtitle, { marginBottom: 0 }]}>
            Details for VIN:
          </Text>
          <Text style={[styles.subtitle, { color: "#A3FE07" }]}>{vin}</Text> */}

              <View style={styles.headerWrapper}>
                <View style={styles.headerContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[
                      styles.backButton,
                      { flexDirection: "row", alignItems: "center" },
                    ]}
                  >
                    <FontAwesome
                      name="chevron-left"
                      size={18}
                      color={iconColor}
                    />
                    <Text
                      style={{ marginLeft: 10, color: iconColor, fontSize: 16 }}
                    >
                      Back
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.centerBlock}>
                  <Logo size={71.11} />
                  <Text style={[styles.subtitle, { marginTop: 12 }]}>
                    Details for VIN:
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: "#95ff77", fontSize: 28 },
                    ]}
                  >
                    {vin}
                  </Text>
                </View>
              </View>

              {loading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="#A3FE07" />
                </View>
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : carDetails ? (
                <View style={styles.detailsContainer}>
                  <View style={styles.categoryList}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Make:</Text>
                      <Text style={styles.value}>{carDetails.Make}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Model:</Text>
                      <Text style={styles.value}>{carDetails.Model}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Year:</Text>
                      <Text style={styles.value}>
                        {carDetails["Model Year"]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoryList}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Fuel Type:</Text>
                      <Text style={styles.value}>
                        {carDetails["Fuel Type Primary"]}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Trim:</Text>
                      <Text style={styles.value}>{carDetails.Trim}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Transmission Style:</Text>
                      <Text style={styles.value}>
                        {carDetails.TransmissionStyle}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Drive Type:</Text>
                      <Text style={styles.value}>{carDetails.DriveType}</Text>
                    </View>
                  </View>

                  <View style={styles.categoryList}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Engine Cylinders:</Text>
                      <Text style={styles.value}>
                        {carDetails.EngineCylinders}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Displacement:</Text>
                      <Text style={styles.value}>
                        {carDetails.DisplacementL} L
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Vehicle Type:</Text>
                      <Text style={styles.value}>{carDetails.VehicleType}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Body Class:</Text>
                      <Text style={styles.value}>{carDetails.BodyClass}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Plant City:</Text>
                      <Text style={styles.value}>{carDetails.PlantCity}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Plant Country:</Text>
                      <Text style={styles.value}>
                        {carDetails.PlantCountry}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.noDataText}>No car details available.</Text>
              )}
            </ScrollView>
            <CustomButton
              title="Chat"
              icon="chat"
              onPress={goToChat}
              style={styles.chatButton}
            />
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}
