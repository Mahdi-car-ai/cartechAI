import React, { FC, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import VinSubmission from "./vinSubmission/VinSubmission";
import PlateSubmission from "./plateSubmission/PlateSubmission";

type LookupType = "vin" | "plate";

const DecodeSwitcher: FC = () => {
  const [activeType, setActiveType] = useState<LookupType>("vin");

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeType === "vin" && styles.activeTabButton,
          ]}
          onPress={() => setActiveType("vin")}
        >
          <Text
            style={[
              styles.tabText,
              activeType === "vin" && styles.activeTabText,
            ]}
          >
            VIN Lookup
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeType === "plate" && styles.activeTabButton,
          ]}
          onPress={() => setActiveType("plate")}
        >
          <Text
            style={[
              styles.tabText,
              activeType === "plate" && styles.activeTabText,
            ]}
          >
            US Plate Decode
          </Text>
        </TouchableOpacity>
      </View>

      {activeType === "vin" ? <VinSubmission /> : <PlateSubmission />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    width: "90%",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#2a2e2e",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabButton: {
    backgroundColor: "#3f4342",
  },
  tabText: {
    color: "#aaa",
    fontFamily: "Aeonik",
    fontSize: 14,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default DecodeSwitcher;
