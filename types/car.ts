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

export interface VehicleDatabaseCarDetails {
  basic?: {
    make?: string;
    model?: string;
    year?: string;
    trim?: string;
    doors?: string;
    vehicle_size?: string;
  };
  engine?: {
    displacement_l_ci?: string;
    "displacement_(l_ci)"?: string;
    engine_model?: string;
    engine_camshaft?: string;
    net_torque?: string;
    horsepower?: string;
    sae_net_horsepower_rpm?: string;
  };
  transmission?: {
    transmission_style?: string;
  };
  dimensions?: {
    trunk_volume?: string;
    width?: string;
    height?: string;
    length?: string;
    min_ground_clearance?: string;
    wheelbase?: string;
    rear_hip_room?: string;
    front_hip_room?: string;
    rear_shoulder_room?: string;
    front_shoulder_room?: string;
    rear_legroom?: string;
    front_legroom?: string;
    rear_head_room?: string;
  };
  drivetrain?: {
    drive_type?: string;
    final_drive_axle_ratio?: string;
  };
  braking?: {
    rear_brake_type?: string;
    front_brake_type?: string;
    disc_front?: string;
  };
  suspension?: {
    steering_type?: string;
    rear_suspension?: string;
    suspension_type_front_cont?: string;
  };
  colors?: {
    exterior?: Array<{
      color?: string;
      rgb?: string;
    }>;
    interior?: Array<{
      color?: string;
      rgb?: string;
    }>;
  };
  seating?: {
    standard_seating?: string;
  };
  weight?: {
    curb_weight?: string;
  };
  wheels_and_tires?: {
    front_tire_size?: string;
    rear_tire_size?: string;
    spare_tire_size?: string;
    rear_tire_order_code?: string;
    front_tire_order_code?: string;
    wheel_size_inches?: string;
    spare_wheel_material?: string;
    steering_type?: string;
    anti_lock_brakes?: string;
  };
  market_value?: {
    msrp?: string;
    destination_charge?: string;
  };
  fuel?: {
    fuel_economy?: string;
    highway_mileage?: string;
    city_mileage?: string;
    fuel_capacity?: string;
  };
  feature?: {
    mechanical_and_powertrain?: Record<string, string>;
    interior?: Record<string, string>;
    exterior?: Record<string, string>;
  };
  recalls?: Array<{
    campaign_info?: string;
    SUMMARY?: string;
    CONSEQUENCES?: string;
    REMEDY?: string;
    COMPONENT_AFFECTED?: string;
    NOTES?: string;
  }>;
}
