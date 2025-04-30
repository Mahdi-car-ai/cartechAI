export interface CarMake {
  MakeId: number;
  MakeName: string;
  VehicleTypeId: number;
  VehicleTypeName: string;
}

export interface CarModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

export interface SelectOption {
  id: string | number;
  name: string;
  description?: string;
}

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
  [key: string]: string;
}
