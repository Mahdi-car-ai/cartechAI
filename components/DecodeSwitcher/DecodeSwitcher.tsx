import React, { FC, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import VinSubmission from "../vinSubmission/VinSubmission";
import PlateSubmission from "../plateSubmission/PlateSubmission";

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
            activeType === "vin" && {
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
            },
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
            activeType === "plate" && {
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
            },
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
    height: 53,
    padding: 8,
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#17171B",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabButton: {
    backgroundColor: "#292929",
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
