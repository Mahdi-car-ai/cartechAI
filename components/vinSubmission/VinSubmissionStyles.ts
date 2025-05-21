import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  inputContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    fontFamily: "Aeonik",
    padding: 16,
    fontSize: 16,
    borderRadius: 16,
    backgroundColor: "#17171B",
    textAlign: "center",
    color: "#fff",
  },
  clearButton: {
    position: "absolute",
    right: "3%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 5,
  },
  historyButton: {
    position: "absolute",
    right: "3%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 5,
  },
});
