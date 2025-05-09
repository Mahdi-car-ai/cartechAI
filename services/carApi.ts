import {
  CarMake,
  CarModel,
  SelectOption,
  CarDetails,
  VehicleDatabaseCarDetails,
} from "@/types/car";

const API_KEY = process.env.EXPO_PUBLIC_LICENSE_PLATE_API_KEY || "";
const BASE_URL = "https://api.vehicledatabases.com/ymm-specs";

/**
 * Fetches available years from Vehicle Databases API
 */
export const fetchCarYears = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BASE_URL}/options/v2/year`, {
      headers: {
        "x-AuthKey": API_KEY,
      },
    });
    const data = await response.json();
    if (data.status === "success" && Array.isArray(data.years)) {
      return data.years;
    }
    return [];
  } catch (error) {
    console.error("Error fetching car years:", error);
    return [];
  }
};

/**
 * Fetches available makes for a specific year from Vehicle Databases API
 */
export const fetchCarMakes = async (year: string): Promise<string[]> => {
  try {
    if (!year) {
      return [];
    }

    const response = await fetch(
      `${BASE_URL}/options/v2/make/${encodeURIComponent(year)}`,
      {
        headers: {
          "x-AuthKey": API_KEY,
        },
      },
    );
    const data = await response.json();
    if (data.status === "success" && Array.isArray(data.makes)) {
      return data.makes;
    }
    return [];
  } catch (error) {
    console.error("Error fetching car makes:", error);
    return [];
  }
};

/**
 * Fetches car models for a specific year and make from Vehicle Databases API
 */
export const fetchCarModels = async (
  year: string,
  make: string,
): Promise<string[]> => {
  try {
    if (!year || !make) {
      return [];
    }

    const response = await fetch(
      `${BASE_URL}/options/v2/model/${encodeURIComponent(year)}/${encodeURIComponent(make)}`,
      {
        headers: {
          "x-AuthKey": API_KEY,
        },
      },
    );
    const data = await response.json();
    if (data.status === "success" && Array.isArray(data.models)) {
      return data.models;
    }
    return [];
  } catch (error) {
    console.error("Error fetching car models:", error);
    return [];
  }
};

/**
 * Fetches available trims for a specific year, make, and model from Vehicle Databases API
 */
export const fetchCarTrims = async (
  year: string,
  make: string,
  model: string,
): Promise<string[]> => {
  try {
    if (!year || !make || !model) {
      return [];
    }

    const response = await fetch(
      `${BASE_URL}/options/v2/trim/${encodeURIComponent(year)}/${encodeURIComponent(make)}/${encodeURIComponent(model)}`,
      {
        headers: {
          "x-AuthKey": API_KEY,
        },
      },
    );
    const data = await response.json();
    if (data.status === "success" && Array.isArray(data.trims)) {
      return data.trims;
    }
    return [];
  } catch (error) {
    console.error("Error fetching car trims:", error);
    return [];
  }
};

/**
 * Fetches detailed car specifications for a specific year, make, model, and trim from Vehicle Databases API
 */
export const fetchCarSpecifications = async (
  year: string,
  make: string,
  model: string,
  trim: string,
): Promise<VehicleDatabaseCarDetails | null> => {
  try {
    if (!year || !make || !model || !trim) {
      return null;
    }

    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(year)}/${encodeURIComponent(make)}/${encodeURIComponent(model)}/${encodeURIComponent(trim)}`,
      {
        headers: {
          "x-AuthKey": API_KEY,
        },
      },
    );

    const data = await response.json();
    console.log(
      data,
      response,
      "fetchCarSpecifications",
      API_KEY,
      encodeURIComponent(year),
      encodeURIComponent(make),
      encodeURIComponent(model),
      encodeURIComponent(trim),
    );

    // Перевірка на помилку авторизації
    if (
      data.statusCode === 401 ||
      data.message === "You don't have access to this API."
    ) {
      throw data; // Кидаємо об'єкт помилки для обробки в компоненті
    }

    if (data.status === "success" && data.data) {
      return data.data as VehicleDatabaseCarDetails;
    }
    return null;
  } catch (error) {
    console.error("Error fetching car specifications:", error);
    throw error; // Передаємо помилку далі для обробки в компоненті
  }
};

/**
 * Fetches variable values for a specific vehicle variable from NHTSA API
 */
export const fetchVehicleVariableValues = async (
  variableName: string,
): Promise<SelectOption[]> => {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleVariableValuesList/${encodeURIComponent(
        variableName,
      )}?format=json`,
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
