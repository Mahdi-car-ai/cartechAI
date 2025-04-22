// Define car makes interface
export interface CarMake {
  MakeId: number;
  MakeName: string;
  VehicleTypeId: number;
  VehicleTypeName: string;
}

// Define car models interface
export interface CarModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

// Define generic select option interface
export interface SelectOption {
  id: string | number;
  name: string;
  description?: string;
}

// Define car details interface
export interface CarDetails {
  make: string;
  model: string;
  modelYear: string;
  fuelType: string;
  engineCylinders: string;
  engineDisplacement: string;
  vehicleType: string;
  trim: string;
  transmissionStyle: string;
  driveType: string;
  bodyClass: string;
  plantCity: string;
  plantCountry: string;
  [key: string]: string; // Index signature for dynamic access
}

// Define navigation types
export type RootStackParamList = {
  ChatScreen: { carDetails: CarDetails };
  [key: string]: undefined | object;
}; 