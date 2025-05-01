import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerToggleButton,
  useDrawerStatus,
} from "@react-navigation/drawer";
import HomeScreen from "../screens/HomeScreen";
import CarDetailsScreen from "../screens/CarDetailsScreen";
import ChatScreen from "@/screens/ChatScreen";
import EnterCarDetailsScreen from "@/screens/EnterCarDetails";
import LoginScreen from "@/screens/LoginScreen";
import SignupScreen from "@/screens/SignupScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import CustomDrawer from "@/components/CustomDrawer";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import CommunityScreen from "@/screens/CommunityScreen";
import UserScreen from "@/screens/UserScreen";
import CreatePostScreen from "@/screens/CreatePostScreen";
import PostDetailsScreen from "@/screens/PostDetailsScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Declare the global variable type
declare global {
  var authStateChanged: boolean;
  var registrationCompleted: boolean;
}

// Create a global auth state tracker - this helps with communication between screens
global.authStateChanged = false;
global.registrationCompleted = false;

const Drawer = createDrawerNavigator();
SplashScreen.preventAutoHideAsync();

interface ScreenWithDrawerProps {
  component: React.ComponentType<any>;
  navigation: any;
  hideDrawerButton?: boolean;
}

const ScreenWithDrawer = ({
  component: Component,
  navigation,
  hideDrawerButton = false,
}: ScreenWithDrawerProps) => {
  const isDrawerOpen = useDrawerStatus() === "open";

  return (
    <View style={styles.container}>
      {/* Show the DrawerToggleButton only if not hidden */}
      {!hideDrawerButton && (
        <View style={styles.drawerButton}>
          <DrawerToggleButton tintColor="white" />
        </View>
      )}
      <Component navigation={navigation} />
    </View>
  );
};

const Layout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const [authVersion, setAuthVersion] = useState(0); // Force re-render on auth change

  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Arame: require("../assets/fonts/Arame-Regular.ttf"),
    Robit: require("../assets/fonts/robit.otf"),
    Aeonik: require("../assets/fonts/Aeonik-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Get status bar height for device adaptation
    setStatusBarHeight(StatusBar.currentHeight || 0);
  }, []);

  // Check auth state when screen is focused or app state changes
  const checkAuthStatus = useCallback(async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const hasAuth = !!accessToken;
      setIsAuthenticated(hasAuth);

      if (hasAuth) {
        // Check if registration is complete by looking for the phone field
        // in the user profile, which is only set after step 2
        const userProfileStr = await AsyncStorage.getItem("userProfile");
        if (userProfileStr) {
          const userProfile = JSON.parse(userProfileStr);
          const hasPhone = !!userProfile.phoneNumber;
          setIsRegistrationComplete(hasPhone);
          global.registrationCompleted = hasPhone;
        } else {
          // If no profile exists but token exists, registration is not complete
          setIsRegistrationComplete(false);
          global.registrationCompleted = false;
        }
      } else {
        // Reset state when not authenticated
        setIsRegistrationComplete(false);
        global.registrationCompleted = false;
      }

      // Reset the global flag
      global.authStateChanged = false;
    } catch (error) {
      console.log("Error checking auth status:", error);
      setIsAuthenticated(false);
      setIsRegistrationComplete(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount and whenever authVersion changes
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus, authVersion]);

  // Also check periodically in case tokens expire
  useEffect(() => {
    const interval = setInterval(() => {
      // If global auth state flag is set, force a re-render by updating authVersion
      if (global.authStateChanged) {
        setAuthVersion((prev) => prev + 1);
      } else {
        // Otherwise just check normally
        checkAuthStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  if (loading) {
    return null; // or return a loading spinner
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      {isAuthenticated && isRegistrationComplete ? (
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawer {...props} />}
          screenOptions={{
            headerShown: false,
            overlayColor: "rgba(0, 0, 0, 0.5)",
            drawerPosition: "left",
          }}
        >
          <Drawer.Screen
            name="Home"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => <ScreenWithDrawer {...props} component={HomeScreen} />}
          </Drawer.Screen>
          <Drawer.Screen
            name="CarDetails"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => (
              <ScreenWithDrawer {...props} component={CarDetailsScreen} />
            )}
          </Drawer.Screen>
          <Drawer.Screen
            name="CommunityScreen"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => (
              <ScreenWithDrawer {...props} component={CommunityScreen} />
            )}
          </Drawer.Screen>
          <Drawer.Screen
            name="EnterCarDetails"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => (
              <ScreenWithDrawer {...props} component={EnterCarDetailsScreen} />
            )}
          </Drawer.Screen>
          <Drawer.Screen
            name="UserScreen"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => <ScreenWithDrawer {...props} component={UserScreen} />}
          </Drawer.Screen>
          <Drawer.Screen
            name="EditProfile"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => (
              <ScreenWithDrawer
                {...props}
                component={EditProfileScreen}
                hideDrawerButton
              />
            )}
          </Drawer.Screen>
          <Drawer.Screen
            name="ChatScreen"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => <ScreenWithDrawer {...props} component={ChatScreen} />}
          </Drawer.Screen>
          <Drawer.Screen
            name="CreatePostScreen"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => (
              <ScreenWithDrawer {...props} component={CreatePostScreen} />
            )}
          </Drawer.Screen>
          <Drawer.Screen
            name="PostDetailsScreen"
            options={{ drawerItemStyle: { display: "none" } }}
          >
            {(props) => (
              <ScreenWithDrawer {...props} component={PostDetailsScreen} />
            )}
          </Drawer.Screen>
        </Drawer.Navigator>
      ) : (
        <Drawer.Navigator screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="Login" component={LoginScreen} />
          <Drawer.Screen name="Signup" component={SignupScreen} />
        </Drawer.Navigator>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerButton: {
    position: "absolute",
    top:
      Platform.OS === "ios"
        ? Dimensions.get("window").height > 800
          ? 58
          : 20 // Adjust for different iOS devices
        : StatusBar.currentHeight
          ? StatusBar.currentHeight + 10
          : 16,
    left: 16, // Adjust this value based on your layout
    zIndex: 100,
    backgroundColor: "transparent", // Ensure the button is visible
  },
});

export default Layout;
