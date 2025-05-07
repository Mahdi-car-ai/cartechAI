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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

interface VinScannerButtonProps {
  onVinDetected: (detectedVin: string) => void;
}

interface VinOcrResponse {
  status: string;
  data: {
    vin: string;
  };
}

const VinScannerButton: React.FC<VinScannerButtonProps> = ({
  onVinDetected,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedVin, setDetectedVin] = useState<string | null>(null);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const takePhoto = async () => {
    setShowMediaOptions(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos.",
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
        "Media library permission is required to select images.",
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

      const response = await axios.post<VinOcrResponse>(
        "https://api.vehicledatabases.com/vin-ocr",
        formData,
        { headers },
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data.vin
      ) {
        setDetectedVin(response.data.data.vin);
        setConfirmationVisible(true);
      } else {
        Alert.alert(
          "Error",
          "No VIN could be detected from the image. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error detecting VIN:", error);
      Alert.alert(
        "Error",
        "Failed to detect VIN from the image. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmVin = () => {
    if (detectedVin) {
      onVinDetected(detectedVin);
      resetState();
    }
  };

  const resetState = () => {
    setSelectedImage(null);
    setDetectedVin(null);
    setConfirmationVisible(false);
  };

  return (
    <>
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
          <Text style={styles.loadingText}>Detecting VIN...</Text>
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
            <Text style={styles.confirmationTitle}>Detected VIN</Text>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
            )}

            <Text style={styles.detectedVinText}>{detectedVin}</Text>

            <Text style={styles.confirmationQuestion}>
              Is this VIN correct?
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
                onPress={confirmVin}
              >
                <Text style={styles.confirmButtonText}>Yes, Use This</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default VinScannerButton;
