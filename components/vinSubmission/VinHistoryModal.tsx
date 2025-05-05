import React, { FC } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { clearVinHistory } from '@/store/slices/vinHistorySlice';
import { Ionicons } from '@expo/vector-icons';

interface VinHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVin: (vin: string) => void;
}

const VinHistoryModal: FC<VinHistoryModalProps> = ({
  visible,
  onClose,
  onSelectVin,
}) => {
  const dispatch = useDispatch();
  const { searchHistory } = useSelector((state: RootState) => state.vinHistory);

  const handleClearHistory = () => {
    dispatch(clearVinHistory());
  };

  const handleSelectVin = (vin: string) => {
    onSelectVin(vin);
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
                <Text style={styles.title}>Recent VIN Search History</Text>
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
                  keyExtractor={(item, index) => `${item}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.historyItem}
                      onPress={() => handleSelectVin(item)}
                    >
                      <Text style={styles.vinText}>{item}</Text>
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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: height * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Aeonik',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vinText: {
    fontFamily: 'Aeonik',
    fontSize: 16,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Aeonik',
    fontSize: 16,
    color: '#666',
  },
  clearButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: 'Aeonik',
    fontSize: 16,
    color: '#E54E4E',
  },
});

export default VinHistoryModal; 