import React, { FC } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { clearLicensePlateHistory } from "@/store/slices/licensePlateHistorySlice";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/components/plateSubmission/licensePlateHistoryModal/LicensePlateHistoryModalStyles";

interface LicensePlateHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEntry: (plate: string, state: string) => void;
}

const LicensePlateHistoryModal: FC<LicensePlateHistoryModalProps> = ({
  visible,
  onClose,
  onSelectEntry,
}) => {
  const dispatch = useDispatch();
  const { searchHistory } = useSelector(
    (state: RootState) => state.licensePlateHistory,
  );

  const handleClearHistory = () => {
    dispatch(clearLicensePlateHistory());
  };

  const handleSelectEntry = (plate: string, state: string) => {
    onSelectEntry(plate, state);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  Recent License Plate Search History
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {searchHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No search history</Text>
                </View>
              ) : (
                <FlatList
                  data={searchHistory}
                  keyExtractor={(item, index) =>
                    `${item.plate}-${item.state}-${index}`
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.historyItem}
                      onPress={() => handleSelectEntry(item.plate, item.state)}
                    >
                      <View>
                        <Text style={styles.plateText}>{item.plate}</Text>
                        <Text style={styles.stateText}>{item.state}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color="#666" />
                    </TouchableOpacity>
                  )}
                />
              )}

              {searchHistory.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearHistory}
                >
                  <Text style={styles.clearButtonText}>Clear History</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default LicensePlateHistoryModal;
