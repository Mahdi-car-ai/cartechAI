import React, { FC } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { styles } from "@/screens/EditProfileScreen/ui/PasswordChangeModal/PasswordChangeModalStyles";

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordChangeModalProps {
  visible: boolean;
  passwordForm: PasswordForm;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordForm>>;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const PasswordChangeModal: FC<PasswordChangeModalProps> = ({
  visible,
  passwordForm,
  setPasswordForm,
  onClose,
  onSubmit,
  loading,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <FontAwesome name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder="Current Password"
            placeholderTextColor="#888"
            value={passwordForm.oldPassword}
            onChangeText={(text) =>
              setPasswordForm({ ...passwordForm, oldPassword: text })
            }
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.modalInput}
            placeholder="New Password"
            placeholderTextColor="#888"
            value={passwordForm.newPassword}
            onChangeText={(text) =>
              setPasswordForm({ ...passwordForm, newPassword: text })
            }
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.modalInput}
            placeholder="Confirm New Password"
            placeholderTextColor="#888"
            value={passwordForm.confirmPassword}
            onChangeText={(text) =>
              setPasswordForm({ ...passwordForm, confirmPassword: text })
            }
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.modalButtonsContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#95ff77" />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={onSubmit}
                >
                  <Text style={styles.submitButtonText}>Change Password</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PasswordChangeModal;
