import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, View, useWindowDimensions } from 'react-native';
import { Icon } from 'react-native-elements';

interface ButtonProps {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    backgroundColor?: string;
    color?: string;
    style?: object;
    icon?: string;
    width?: number;
    iconColor?: string;
}
const CustomButton: React.FC<ButtonProps> = ({ 
    title, 
    onPress, 
    backgroundColor = '#95ff77', 
    color = '#2a2e2e', 
    style, 
    icon, 
    iconColor = '#2a2e2e',
    width
}) => {
    const { width: windowWidth } = useWindowDimensions();
    
    return (
        <TouchableOpacity
            style={[
                styles.button, 
                { backgroundColor, width: width || windowWidth * 0.9 }, 
                style
            ]}
            onPress={onPress}
        >
            <View style={styles.content}>
                {icon && (
                    <Icon 
                        name={icon} 
                        color={iconColor} 
                        containerStyle={styles.icon} 
                    />
                )}
                <Text style={[styles.text, { color }]} numberOfLines={1}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Ensures text remains centered
        padding: 16,
        borderRadius: 16,
        margin: 16,
        position: 'relative', // Ensures absolute positioning for the icon works
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Ensures full-width alignment
        position: 'relative',
    },
    icon: {
        position: 'absolute',
        left: 8, 
    },
    text: {
        fontFamily: 'Aeonik',
        fontSize: 16,
        flex: 1, // Ensures text stays centered
        textAlign: 'center',
    },
});

export default CustomButton;
