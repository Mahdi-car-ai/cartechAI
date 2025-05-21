import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

interface PlateOCRButtonProps {
  onPlateDetected: (plate: string, state: string) => void;
}

interface PlateOcrResponse {
  status: string;
  data: {
    plate: string;
    state: string;
  };
}

const PlateOCRButton: React.FC<PlateOCRButtonProps> = ({ onPlateDetected }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState<string | null>(null);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const takePhoto = async () => {
    setShowMediaOptions(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Could not take photo. Please try again.");
    }
  };

  const pickImage = async () => {
    setShowMediaOptions(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Media library permission is required to select images."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not pick image. Please try again.");
    }
  };

  const processImage = async (imageUri: string) => {
    setLoading(true);

    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";

      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: mimeType,
      } as unknown as Blob);

      const apiKey = process.env.EXPO_PUBLIC_LICENSE_PLATE_API_KEY;
      const headers: Record<string, string> = {
        "Content-Type": "multipart/form-data",
      };

      if (apiKey) {
        headers["x-AuthKey"] = apiKey;
      }

      const response = await axios.post<PlateOcrResponse>(
        "https://api.vehicledatabases.com/licenseplate-ocr",
        formData,
        { headers }
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data.plate
      ) {
        setDetectedPlate(response.data.data.plate);
        setDetectedState(response.data.data.state || "");
        setConfirmationVisible(true);
      } else {
        Alert.alert(
          "Error",
          "No license plate could be detected from the image. Please try again."
        );
      }
    } catch (error) {
      console.error("Error detecting license plate:", error);
      Alert.alert(
        "Error",
        "Failed to detect license plate from the image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmPlate = () => {
    if (detectedPlate && detectedState) {
      onPlateDetected(detectedPlate, detectedState);
      resetState();
    }
  };

  const resetState = () => {
    setSelectedImage(null);
    setDetectedPlate(null);
    setDetectedState(null);
    setConfirmationVisible(false);
  };

  return (
    <>
      {/* <View style={styles.root}>
       <ImageBackground
        source={require("@/assets/images/ellipse.png")} // ✅ THIS is the ellipse image
        style={styles.imageOverlay}
        resizeMode="cover"
      > */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setShowMediaOptions(true)}
      >
        <Ionicons name="camera-outline" size={24} color="#999" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showMediaOptions}
        animationType="slide"
        onRequestClose={() => setShowMediaOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMediaOptions(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <Ionicons name="image" size={24} color="#fff" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setShowMediaOptions(false)}
            >
              <Text style={[styles.modalOptionText, styles.cancelText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0080ff" />
          <Text style={styles.loadingText}>Detecting license plate...</Text>
        </View>
      )}

      <Modal
        transparent={true}
        visible={confirmationVisible}
        animationType="fade"
        onRequestClose={() => setConfirmationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationContent}>
            <Text style={styles.confirmationTitle}>Detected License Plate</Text>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
            )}

            <View style={styles.detectedInfoContainer}>
              <Text style={styles.detectedPlateText}>{detectedPlate}</Text>
              {detectedState && (
                <Text style={styles.detectedStateText}>
                  State: {detectedState}
                </Text>
              )}
            </View>

            <Text style={styles.confirmationQuestion}>
              Is this license plate correct?
            </Text>

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonNo]}
                onPress={resetState}
              >
                <Text style={styles.confirmButtonText}>No, Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonYes]}
                onPress={confirmPlate}
              >
                <Text style={styles.confirmButtonText}>Yes, Use This</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* </ImageBackground> */}
      {/* </View> */}
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1a1c1b",
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanButton: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#2c2c2c",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    width: "100%",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 15,
  },
  cancelOption: {
    borderTopWidth: 1,
    borderTopColor: "#444",
    marginTop: 10,
    justifyContent: "center",
  },
  cancelText: {
    color: "#ff6b6b",
    textAlign: "center",
    marginLeft: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  confirmationContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: "contain",
  },
  detectedVinText: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 15,
    color: "#0080ff",
  },
  confirmationQuestion: {
    fontSize: 16,
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  confirmButtonYes: {
    backgroundColor: "#0080ff",
  },
  confirmButtonNo: {
    backgroundColor: "#ff6b6b",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  detectedInfoContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  detectedPlateText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  detectedStateText: {
    fontSize: 18,
    color: "#666",
  },
});
export default PlateOCRButton;
