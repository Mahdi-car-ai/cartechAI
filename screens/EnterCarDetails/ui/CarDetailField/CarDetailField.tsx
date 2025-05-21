import React from "react";
import { Text, TextInput, TouchableOpacity } from "react-native";
// import { styles } from "./CarDetailFieldStyles";
import { StyleSheet } from "react-native";
interface CarDetailFieldProps {
  fieldKey: string;
  value: string;
  width: number;
  focusedInput: string | null;
  isFieldDisabled: (field: string) => boolean;
  isFieldManuallyEditable: (field: string) => boolean;
  onPress: (field: string) => void;
  handleChange: (field: string, value: string) => void;
  onFocus: (field: string) => void;
  onBlur: () => void;
}

export const CarDetailField: React.FC<CarDetailFieldProps> = ({
  fieldKey,
  value,
  width,
  focusedInput,
  isFieldDisabled,
  isFieldManuallyEditable,
  onPress,
  handleChange,
  onFocus,
  onBlur,
}) => {
  if (["modelYear", "make", "model", "trim"].includes(fieldKey)) {
    return (
      <TouchableOpacity
        style={[
          styles.input,
          { width },
          focusedInput === fieldKey && styles.inputFocused,
          isFieldDisabled(fieldKey) && styles.disabledInput,
        ]}
        onPress={() => !isFieldDisabled(fieldKey) && onPress(fieldKey)}
        disabled={isFieldDisabled(fieldKey)}
      >
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholderText,
            isFieldDisabled(fieldKey) && styles.disabledText,
          ]}
        >
          {value ||
            fieldKey
              .replace(/([A-Z])/g, " $1")
              .trim()
              .replace(/\b\w/g, (char: string) => char.toUpperCase())}
        </Text>
      </TouchableOpacity>
    );
  }

  if (isFieldManuallyEditable(fieldKey)) {
    return (
      <TextInput
        style={[
          styles.input,
          { width },
          focusedInput === fieldKey && styles.inputFocused,
        ]}
        placeholder={fieldKey
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/\b\w/g, (char: string) => char.toUpperCase())}
        placeholderTextColor="#aaa"
        value={value}
        onChangeText={(text) => handleChange(fieldKey, text)}
        onFocus={() => onFocus(fieldKey)}
        onBlur={onBlur}
      />
    );
  }

  return (
    <TextInput
      style={[
        styles.input,
        { width },
        focusedInput === fieldKey && styles.inputFocused,
      ]}
      placeholder={fieldKey
        .replace(/([A-Z])/g, " $1")
        .trim()
        .replace(/\b\w/g, (char: string) => char.toUpperCase())}
      placeholderTextColor="#aaa"
      value={value}
      onChangeText={(text) => handleChange(fieldKey, text)}
      onFocus={() => onFocus(fieldKey)}
      onBlur={onBlur}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    alignSelf: "center",
    fontSize: 16,
    borderColor: "#2a2e2e",
    borderWidth: 1.5,
    color: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    fontFamily: "Aeonik",
    justifyContent: "center",
  },
  disabledInput: {
    borderColor: "#22241f",
    backgroundColor: "#22241f",
  },
  filledInput: {
    borderColor: "#3a9c4d",
    backgroundColor: "#1a1c1b",
  },
  emptyInput: {
    borderColor: "#444",
    backgroundColor: "#1a1c1b",
    borderStyle: "dashed",
  },
  inputText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
  },
  disabledText: {
    color: "#555",
  },
  placeholderText: {
    color: "#aaa",
  },
  inputFocused: {
    borderColor: "#A3FE07",
  },
});

export default CarDetailField;
