import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native'; // Import Lottie
import CustomButton from '@/components/Button';
import { CarDetails } from '@/types/CarDetails';
import Logo from '@/components/ui/Logo';

export default function CarDetailsScreen() {
  const route = useRoute();
  const { vin } = route.params;
  const navigation = useNavigation();
  const [carDetails, setCarDetails] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); 




  const handleVinSubmission = async () => {
    if (!vin.trim()) {
      Alert.alert('Invalid Input', 'Please enter a valid VIN.');
      return;
    }

    setLoading(true);
    setCarDetails(null);
    setError(null);

    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      if (!response.ok) throw new Error('Failed to fetch data.');

      const data = await response.json();
      const results = data?.Results || [];

      if (results.length > 0) {
        const carDetails = results.reduce((acc: CarDetails, { Variable, Value }) => {
          switch (Variable) {
            case 'Make':
              acc.make = Value;
              break;
            case 'Model':
              acc.model = Value;
              break;
            case 'Model Year':
              acc.modelYear = Value;
              break;
            case 'Fuel Type - Primary':
              acc.fuelType = Value;
              break;
            case 'Engine Number of Cylinders':
              acc.engineCylinders = Value;
              break;
            case 'Engine Displacement (L)':
              acc.engineDisplacement = Value;
              break;
            case 'Vehicle Type':
              acc.vehicleType = Value;
              break;
            case 'Trim':
              acc.trim = Value;
              break;
            case 'Transmission Style':
              acc.transmissionStyle = Value;
              break;
            case 'Drive Type':
              acc.driveType = Value;
              break;
            case 'Body Class':
              acc.bodyClass = Value;
              break;
            case 'Plant City':
              acc.plantCity = Value;
              break;
            case 'Plant Country':
              acc.plantCountry = Value;
              break;
            default:
              break;
          }
          return acc;
        }, {} as CarDetails);

        setCarDetails(carDetails);
       
      } else {
        setError('No vehicle details found for the given VIN.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToChat = () => {
    navigation.navigate("ChatScreen", { carDetails: carDetails });
  }

  useEffect(() => {
    handleVinSubmission();
  }, [vin]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      horizontal={false}
      >
        <Logo/>
        <Text style={[styles.subtitle, {marginBottom: 0}]}>Details for VIN:</Text>
        <Text style={[styles.subtitle, {color: '#95ff77'}]}>{vin}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#95ff77" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : carDetails ? (
          <View style={styles.detailsContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Make:</Text>
              <Text style={styles.value}>{carDetails.make}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Model:</Text>
              <Text style={styles.value}>{carDetails.model}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Year:</Text>
              <Text style={styles.value}>{carDetails.modelYear}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fuel Type:</Text>
              <Text style={styles.value}>{carDetails.fuelType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Engine Cylinders:</Text>
              <Text style={styles.value}>{carDetails.engineCylinders}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Displacement:</Text>
              <Text style={styles.value}>{carDetails.engineDisplacement} L</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vehicle Type:</Text>
              <Text style={styles.value}>{carDetails.vehicleType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Trim:</Text>
              <Text style={styles.value}>{carDetails.trim}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Transmission Style:</Text>
              <Text style={styles.value}>{carDetails.transmissionStyle}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Drive Type:</Text>
              <Text style={styles.value}>{carDetails.driveType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Body Class:</Text>
              <Text style={styles.value}>{carDetails.bodyClass}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plant City:</Text>
              <Text style={styles.value}>{carDetails.plantCity}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plant Country:</Text>
              <Text style={styles.value}>{carDetails.plantCountry}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>No car details available.</Text>
        )}
      </ScrollView>
      <CustomButton title="Chat" icon="chat" onPress={goToChat} style={styles.chatButton} />
    </View>
  </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    paddingTop: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  animation: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Aeonik',
    marginBottom: 12,
    textAlign: 'center',
    color: '#fff',
  },
  subtitle: {
    fontSize: 32,
    fontFamily: 'Aeonik',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsContainer: {
    width: 400,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontFamily: 'Aeonik',
    fontSize: 16,
    color: '#fff',
   
  },
  value: {
    fontFamily: 'Aeonik',
    fontSize: 16,
    color: '#95ff77',
    flex: 1,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  chatButton: {
    marginBottom: 40,
  },
});
