import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1c1b",
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 32,
    width: "80%",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2a2e2e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontFamily: "Aeonik",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: "Aeonik",
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
  },
  profileDetail: {
    fontSize: 14,
    fontFamily: "Aeonik",
    color: "#aaa",
    textAlign: "center",
    marginTop: 4,
  },
});
