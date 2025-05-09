import React, { FC } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";
import { styles } from "@/screens/EditProfileScreen/ui/ProfileHeader/ProfileHeaderStyles";

interface ProfileHeaderProps {
  onBackPress: () => void;
  userLogo?: string;
  onImagePress: () => void;
}

const ProfileHeader: FC<ProfileHeaderProps> = ({
  onBackPress,
  userLogo,
  onImagePress,
}) => {
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].icon;

  return (
    <>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={onBackPress}
          style={[
            styles.backButton,
            { flexDirection: "row", alignItems: "center" },
          ]}
        >
          <FontAwesome name="chevron-left" size={18} color={iconColor} />
          <Text style={{ marginLeft: 10, color: iconColor, fontSize: 16 }}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity
        onPress={onImagePress}
        style={styles.profileImageContainer}
      >
        {userLogo ? (
          <Image source={{ uri: userLogo }} style={styles.profileImage} />
        ) : (
          <Image
            source={require("@/assets/images/icons/user.png")}
            style={styles.profileImage}
          />
        )}
        <View style={styles.editIconContainer}>
          <FontAwesome name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </>
  );
};

export default ProfileHeader;
