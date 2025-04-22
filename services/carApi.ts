import { CarMake, CarModel, SelectOption } from '@/types/car';

/**
 * Fetches car makes for Passenger Cars from NHTSA API
 */
export const fetchCarMakes = async (): Promise<CarMake[]> => {
  try {
    const response = await fetch(
      "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json"
    );
    const data = await response.json();
    return data.Results || [];
  } catch (error) {
    console.error("Error fetching car makes:", error);
    return [];
  }
};

/**
 * Fetches car models for a specific make from NHTSA API
 */
export const fetchCarModels = async (make: string): Promise<CarModel[]> => {
  try {
    if (!make) {
      return [];
    }
    
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`
    );
    const data = await response.json();
    return data.Results || [];
  } catch (error) {
    console.error("Error fetching car models:", error);
    return [];
  }
};

/**
 * Fetches variable values for a specific vehicle variable from NHTSA API
 */
export const fetchVehicleVariableValues = async (
  variableName: string
): Promise<SelectOption[]> => {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleVariableValuesList/${encodeURIComponent(
        variableName
      )}?format=json`
    );
    const data = await response.json();

    // Transform the API response to our SelectOption format
    if (data.Results && Array.isArray(data.Results)) {
      return data.Results.map((item: any) => ({
        id: item.Id || item.ID || item.ElementId || item.ValueId,
        name: item.Name || item.Value,
        description: item.Description || "",
      }));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching ${variableName} values:`, error);
    return [];
  }
}; 