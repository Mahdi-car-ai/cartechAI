import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Icon } from "react-native-elements";
import { styles } from "./SelectionModalStyles";

interface SelectionModalProps {
  visible: boolean;
  title: string;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onClose: () => void;
  onSelectOption: (value: string) => void;
  options: string[];
  loading: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  searchText,
  onSearchTextChange,
  onClose,
  onSelectOption,
  options,
  loading,
  keyboardType = "default",
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder={`Search...`}
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={onSearchTextChange}
            keyboardType={keyboardType}
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#95ff77"
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => onSelectOption(item)}
                >
                  <Text style={styles.listItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              style={styles.list}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default SelectionModal; 