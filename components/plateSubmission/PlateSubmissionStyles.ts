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
    backgroundColor: "#fff",
    textAlign: "center",
  },
  stateInput: {
    fontFamily: "Aeonik",
    padding: 16,
    fontSize: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stateText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#000",
  },
  clearButton: {
    position: "absolute",
    right: "3%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontFamily: "Aeonik",
    fontSize: 18,
    fontWeight: "500",
  },
  stateItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedStateItem: {
    backgroundColor: "#f0f0f0",
  },
  stateItemText: {
    fontFamily: "Aeonik",
    fontSize: 16,
  },
  selectedStateItemText: {
    fontWeight: "500",
  },
});
