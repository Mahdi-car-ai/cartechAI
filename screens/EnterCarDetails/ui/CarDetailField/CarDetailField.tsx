import React from "react";
import { Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "./CarDetailFieldStyles";

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

export default CarDetailField;
