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
    alignItems: "center",
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
  historyButton: {
    position: "absolute",
    right: "3%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 5,
  },
  stateButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stateHistoryButton: {
    padding: 5,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontFamily: "Aeonik",
    fontSize: 16,
  },
});
