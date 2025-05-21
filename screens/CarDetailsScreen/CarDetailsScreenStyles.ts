import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1a1c1b",
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30,
  },
  categoryList: {
    marginVertical: 10,
    borderColor: "#4E4E4E",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 30,
  },
  animation: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 32,
    fontFamily: "Aeonik",
    marginBottom: 12,
    textAlign: "center",
    color: "#fff",
  },
  subtitle: {
    fontSize: 32,
    fontFamily: "Aeonik",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  detailsContainer: {
    width: 400,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#4E4E4E",
    paddingBottom: 12,
  },
  label: {
    fontFamily: "Aeonik",
    fontSize: 18,
    color: "#fff",
  },
  value: {
    fontFamily: "Aeonik",
    fontSize: 16,
    color: "#95ff77",
    flex: 1,
    textAlign: "right",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  chatButton: {
    marginBottom: 40,
  },
  headerWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20, // space between header and spinner/details
  },

  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30, // spacing below top bar
  },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    zIndex: 10,
  },
});
