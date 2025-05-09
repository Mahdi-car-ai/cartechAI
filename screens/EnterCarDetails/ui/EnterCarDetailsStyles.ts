import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 24,
    height: "100%",
    justifyContent: "center",
    backgroundColor: "#1a1c1b",
  },
  chatButton: {
    width: "auto",
    paddingHorizontal: 16,
  },
  subtitle: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Aeonik",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
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
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  backButton: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
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
  loadingOverlay: {
    position: 'absolute',
    zIndex: 1000,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 28, 27, 0.8)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Aeonik',
  },
});
