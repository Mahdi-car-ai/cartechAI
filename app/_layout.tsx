import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createDrawerNavigator, DrawerToggleButton, useDrawerStatus } from "@react-navigation/drawer";
import HomeScreen from "../screens/HomeScreen";
import CarDetailsScreen from "../screens/CarDetailsScreen";
import ChatScreen from "@/screens/ChatScreen";
import EnterCarDetailsScreen from "@/screens/EnterCarDetails";
import LoginScreen from "@/screens/LoginScreen";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, auth } from "../config/firebaseConfig";
import CustomDrawer from "@/components/CustomDrawer";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import CommunityScreen from "@/screens/CommunityScreen";
import UserScreen from "@/screens/UserScreen";
import CreatePostScreen from "@/screens/CreatePostScreen";
import PostDetailsScreen from "@/screens/PostDetailsScreen";

const Drawer = createDrawerNavigator();
SplashScreen.preventAutoHideAsync();

const ScreenWithDrawer = ({ component: Component, navigation }) => {
  const isDrawerOpen = useDrawerStatus() === "open";

  return (
    <View style={styles.container}>
      {/* Always show the DrawerToggleButton */}
      <View style={styles.drawerButton}>
        <DrawerToggleButton tintColor="white" />
      </View>
      <Component navigation={navigation} />
    </View>
  );
};

const Layout = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); 
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return null; // or return a loading spinner
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      {user ? (
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
            {(props) => <ScreenWithDrawer {...props} component={CarDetailsScreen} />}
          </Drawer.Screen>
          <Drawer.Screen
            name="CommunityScreen"
            options={{ drawerItemStyle: { display: "none" } }} 
          >
            {(props) => <ScreenWithDrawer {...props} component={CommunityScreen} />}
          </Drawer.Screen>
          <Drawer.Screen
            name="EnterCarDetails"
            options={{ drawerItemStyle: { display: "none" } }} 
          >
            {(props) => <ScreenWithDrawer {...props} component={EnterCarDetailsScreen} />}
          </Drawer.Screen>
          <Drawer.Screen
            name="UserScreen"
            options={{ drawerItemStyle: { display: "none" } }} 
          >
            {(props) => <ScreenWithDrawer {...props} component={UserScreen} />}
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
            {(props) => <ScreenWithDrawer {...props} component={CreatePostScreen} />}
          </Drawer.Screen>
          <Drawer.Screen
            name="PostDetailsScreen"
            options={{ drawerItemStyle: { display: "none" } }} 
          >
            {(props) => <ScreenWithDrawer {...props} component={PostDetailsScreen} />}
          </Drawer.Screen>
        </Drawer.Navigator>
      ) : (
        <Drawer.Navigator screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="Login" component={LoginScreen} />
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
    top: 58, // Adjust this value based on your layout
    left: 16, // Adjust this value based on your layout
    zIndex: 100,
    backgroundColor: "transparent", // Ensure the button is visible
  },
});

export default Layout;