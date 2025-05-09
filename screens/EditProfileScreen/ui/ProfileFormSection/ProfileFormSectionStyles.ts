import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Aeonik",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    paddingLeft: 8,
  },
  input: {
    width: "100%",
    fontSize: 16,
    fontFamily: "Aeonik",
    backgroundColor: "#fff",
    color: "#1a1c1b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  changePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2e2e",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    width: "100%",
  },
  changePasswordText: {
    color: "#fff",
    fontFamily: "Aeonik",
    fontSize: 16,
    marginRight: 8,
  },
});
