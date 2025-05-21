import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import CustomButton from "@/components/Button/Button";

interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
}

const ActionButtons: FC<ActionButtonsProps> = ({ onSave, onCancel }) => {
  return (
    <View style={styles.buttonContainer}>
      <CustomButton title="Cancel" onPress={onCancel} backgroundColor="#666" />
      <CustomButton title="Save Changes" onPress={onSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
  },
});

export default ActionButtons;
