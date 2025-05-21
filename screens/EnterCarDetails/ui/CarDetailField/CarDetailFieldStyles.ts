import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
    borderColor: "#95ff77",
  },
});
