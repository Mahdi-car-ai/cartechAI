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
    alignItems: "center",
    textAlign: "center",
    color: "#fff",
  },

  stateInput: {
    fontFamily: "Aeonik",
    padding: 16,
    fontSize: 16,
    borderRadius: 16,
    backgroundColor: "#292929",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stateText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#fff", // dev current
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // add current
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#292929",
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
    borderBottomColor: "#4E4E4E",
  },
  modalTitle: {
    fontFamily: "Aeonik",
    fontSize: 18,
    fontWeight: "500",
    color: "#fff",
  },
  stateItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    backgroundColor: "#292929", // dev current
    marginVertical: 5,
  },
  selectedStateItem: {
    backgroundColor: "#333", // dev current
    borderRadius: 8,
  },
  stateItemText: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#fff", // dev current
  },
  selectedStateItemText: {
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333", // dev current
    padding: 1,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
    color: "#A3FE07",
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontFamily: "Aeonik",
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: "#17171B", // dev current
    color: "#fff", // dev current
  },
});
