import React, { FC } from "react";
import { Text, TextInput, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { styles } from "@/screens/EditProfileScreen/ui/ProfileFormSection/ProfileFormSectionStyles";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  streetAddress: string;
  streetAddressLine2: string;
  city: string;
  postalCode: string;
}

interface ProfileFormSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onPasswordChangePress: () => void;
}

const ProfileFormSection: FC<ProfileFormSectionProps> = ({
  formData,
  setFormData,
  onPasswordChangePress,
}) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Personal Information</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        placeholderTextColor="#aaa"
        value={formData.firstName}
        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor="#aaa"
        value={formData.lastName}
        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={onPasswordChangePress}
      >
        <Text style={styles.changePasswordText}>Change Password</Text>
        <FontAwesome name="lock" size={16} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Contact Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor="#aaa"
        value={formData.phoneNumber}
        onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Company Name (Optional)"
        placeholderTextColor="#aaa"
        value={formData.companyName}
        onChangeText={(text) => setFormData({ ...formData, companyName: text })}
      />

      <Text style={styles.sectionTitle}>Address Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Street Address"
        placeholderTextColor="#aaa"
        value={formData.streetAddress}
        onChangeText={(text) =>
          setFormData({ ...formData, streetAddress: text })
        }
      />

      <TextInput
        style={styles.input}
        placeholder="Street Address Line 2"
        placeholderTextColor="#aaa"
        value={formData.streetAddressLine2}
        onChangeText={(text) =>
          setFormData({ ...formData, streetAddressLine2: text })
        }
      />

      <TextInput
        style={styles.input}
        placeholder="City"
        placeholderTextColor="#aaa"
        value={formData.city}
        onChangeText={(text) => setFormData({ ...formData, city: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Postal / Zip Code"
        placeholderTextColor="#aaa"
        value={formData.postalCode}
        onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
        keyboardType="numeric"
      />
    </>
  );
};

export default ProfileFormSection;
