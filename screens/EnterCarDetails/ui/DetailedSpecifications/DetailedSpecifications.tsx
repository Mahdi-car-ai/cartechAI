import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "react-native-elements";
import { VehicleDatabaseCarDetails } from "@/types/car";
import { styles } from "./DetailedSpecificationsStyles";

interface DetailedSpecificationsProps {
  specifications: VehicleDatabaseCarDetails | null;
}

export const DetailedSpecifications: React.FC<DetailedSpecificationsProps> = ({
  specifications,
}) => {
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);

  if (!specifications) return null;

  const renderSpecSectionHeader = (title: string) => (
    <View style={styles.specSectionHeader}>
      <Text style={styles.specSectionTitle}>{title}</Text>
    </View>
  );

  const renderSpecItem = (label: string, value: string | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.specItemRow} key={label}>
        <Text style={styles.specItemLabel}>{label}:</Text>
        <Text style={styles.specItemValue}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={styles.detailedSpecsContainer}>
      <TouchableOpacity
        style={styles.specsTitleBar}
        onPress={() => setShowDetailedSpecs(!showDetailedSpecs)}
      >
        <Text style={styles.specsTitleText}>Vehicle Specifications</Text>
        <Icon
          name={showDetailedSpecs ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          color="#95ff77"
          size={24}
        />
      </TouchableOpacity>

      {showDetailedSpecs && (
        <>
          {/* Basic Information */}
          {specifications.basic && (
            <>
              {renderSpecSectionHeader("Basic Information")}
              {renderSpecItem("Make", specifications.basic.make)}
              {renderSpecItem("Model", specifications.basic.model)}
              {renderSpecItem("Year", specifications.basic.year)}
              {renderSpecItem("Trim", specifications.basic.trim)}
              {renderSpecItem("Doors", specifications.basic.doors)}
              {renderSpecItem(
                "Vehicle Size",
                specifications.basic.vehicle_size
              )}
            </>
          )}

          {specifications.engine && (
            <>
              {renderSpecSectionHeader("Engine")}
              {renderSpecItem(
                "Displacement",
                specifications.engine["displacement_(l_ci)"]
              )}
              {renderSpecItem(
                "Engine Model",
                specifications.engine.engine_model
              )}
              {renderSpecItem(
                "Engine Camshaft",
                specifications.engine.engine_camshaft
              )}
              {renderSpecItem("Net Torque", specifications.engine.net_torque)}
              {renderSpecItem("Horsepower", specifications.engine.horsepower)}
              {renderSpecItem(
                "SAE Net Horsepower RPM",
                specifications.engine.sae_net_horsepower_rpm
              )}
            </>
          )}

          {specifications.transmission && (
            <>
              {renderSpecSectionHeader("Transmission")}
              {renderSpecItem(
                "Transmission Style",
                specifications.transmission.transmission_style
              )}
            </>
          )}

          {specifications.dimensions && (
            <>
              {renderSpecSectionHeader("Dimensions")}
              {renderSpecItem("Width", specifications.dimensions.width)}
              {renderSpecItem("Height", specifications.dimensions.height)}
              {renderSpecItem("Length", specifications.dimensions.length)}
              {renderSpecItem(
                "Ground Clearance",
                specifications.dimensions.min_ground_clearance
              )}
              {renderSpecItem("Wheelbase", specifications.dimensions.wheelbase)}
              {renderSpecItem(
                "Trunk Volume",
                specifications.dimensions.trunk_volume
              )}
              {renderSpecItem(
                "Front Legroom",
                specifications.dimensions.front_legroom
              )}
              {renderSpecItem(
                "Rear Legroom",
                specifications.dimensions.rear_legroom
              )}
              {renderSpecItem(
                "Front Headroom",
                specifications.dimensions.rear_head_room
              )}
              {renderSpecItem(
                "Front Shoulder Room",
                specifications.dimensions.front_shoulder_room
              )}
              {renderSpecItem(
                "Rear Shoulder Room",
                specifications.dimensions.rear_shoulder_room
              )}
            </>
          )}

          {specifications.drivetrain && (
            <>
              {renderSpecSectionHeader("Drivetrain")}
              {renderSpecItem(
                "Drive Type",
                specifications.drivetrain.drive_type
              )}
              {renderSpecItem(
                "Final Drive Axle Ratio",
                specifications.drivetrain.final_drive_axle_ratio
              )}
            </>
          )}

          {specifications.braking && (
            <>
              {renderSpecSectionHeader("Braking")}
              {renderSpecItem(
                "Front Brake Type",
                specifications.braking.front_brake_type
              )}
              {renderSpecItem(
                "Rear Brake Type",
                specifications.braking.rear_brake_type
              )}
              {renderSpecItem("Disc Front", specifications.braking.disc_front)}
            </>
          )}

          {specifications.suspension && (
            <>
              {renderSpecSectionHeader("Suspension")}
              {renderSpecItem(
                "Steering Type",
                specifications.suspension.steering_type
              )}
              {renderSpecItem(
                "Rear Suspension",
                specifications.suspension.rear_suspension
              )}
              {renderSpecItem(
                "Front Suspension",
                specifications.suspension.suspension_type_front_cont
              )}
            </>
          )}

          {specifications.weight && (
            <>
              {renderSpecSectionHeader("Weight")}
              {renderSpecItem("Curb Weight", specifications.weight.curb_weight)}
            </>
          )}

          {specifications.fuel && (
            <>
              {renderSpecSectionHeader("Fuel")}
              {renderSpecItem("Fuel Economy", specifications.fuel.fuel_economy)}
              {renderSpecItem("City Mileage", specifications.fuel.city_mileage)}
              {renderSpecItem(
                "Highway Mileage",
                specifications.fuel.highway_mileage
              )}
              {renderSpecItem(
                "Fuel Capacity",
                specifications.fuel.fuel_capacity
              )}
            </>
          )}

          {specifications.market_value && (
            <>
              {renderSpecSectionHeader("Market Value")}
              {renderSpecItem("MSRP", specifications.market_value.msrp)}
              {renderSpecItem(
                "Destination Charge",
                specifications.market_value.destination_charge || "N/A"
              )}
            </>
          )}

          {specifications.colors?.exterior &&
            specifications.colors.exterior.length > 0 && (
              <>
                {renderSpecSectionHeader("Exterior Colors")}
                {specifications.colors.exterior.map((color, index) => (
                  <View style={styles.colorItem} key={`ext-${index}`}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: `rgb(${color.rgb})` },
                      ]}
                    />
                    <Text style={styles.colorName}>{color.color}</Text>
                  </View>
                ))}
              </>
            )}

          {specifications.colors?.interior &&
            specifications.colors.interior.length > 0 && (
              <>
                {renderSpecSectionHeader("Interior Colors")}
                {specifications.colors.interior.map((color, index) => (
                  <View style={styles.colorItem} key={`int-${index}`}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: `rgb(${color.rgb})` },
                      ]}
                    />
                    <Text style={styles.colorName}>{color.color}</Text>
                  </View>
                ))}
              </>
            )}

          {specifications.recalls && specifications.recalls.length > 0 && (
            <>
              {renderSpecSectionHeader("Recalls")}
              {specifications.recalls.map((recall, index) => (
                <View style={styles.recallItem} key={`recall-${index}`}>
                  <Text style={styles.recallCampaign}>
                    {recall.campaign_info}
                  </Text>
                  <Text style={styles.recallSummary}>{recall.SUMMARY}</Text>
                  <View style={styles.recallDetails}>
                    <Text style={styles.recallLabel}>Consequences:</Text>
                    <Text style={styles.recallText}>{recall.CONSEQUENCES}</Text>
                  </View>
                  <View style={styles.recallDetails}>
                    <Text style={styles.recallLabel}>Remedy:</Text>
                    <Text style={styles.recallText}>{recall.REMEDY}</Text>
                  </View>
                  <View style={styles.recallDetails}>
                    <Text style={styles.recallLabel}>Component Affected:</Text>
                    <Text style={styles.recallText}>
                      {recall.COMPONENT_AFFECTED}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
};

export default DetailedSpecifications;
