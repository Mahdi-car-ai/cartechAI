import Constants from "expo-constants";

interface EnvVars {
  API_URL: string;
}

const ENV = {
  // Default to development API URL if not set in .env
  API_URL: process.env.API_URL,
};

export default ENV as EnvVars;
