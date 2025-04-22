import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

const Logo = ({ size = 40, showText = true }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/cartechai.png")}
        style={[styles.logo, { width: size, height: size }]}
      />
      {showText && <Text style={styles.logoText}>CarTechAI</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 8,
  },
  logo: {
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 24,
    fontFamily: "Robit",
    color: "#fff",
    marginLeft: 8,
  },
});

export default Logo;
