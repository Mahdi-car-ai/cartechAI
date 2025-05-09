import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "#1a1c1b",
    borderRadius: 16,
    padding: 16,
    borderColor: "#2a2e2e",
    borderWidth: 1.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Aeonik",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  searchInput: {
    backgroundColor: "#2a2e2e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: "#fff",
    fontFamily: "Aeonik",
  },
  list: {
    flex: 1,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2e2e",
  },
  listItemText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Aeonik",
  },
  listItemDescription: {
    fontSize: 12,
    color: "#aaa",
    fontFamily: "Aeonik",
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}); 