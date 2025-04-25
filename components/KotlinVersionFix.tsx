import React from 'react';
import { Text } from 'react-native';

/**
 * This component is a dummy component only used to help force the 
 * correct Kotlin version (1.7.20) for compatibility with the Compose Compiler.
 * Simply import this component in your app entry file or main navigation.
 */
export const KotlinVersionFix: React.FC = () => {
  // This component doesn't render anything visible
  return null;
};

// Export a constant that indicates the required Kotlin version
export const KOTLIN_VERSION = '1.7.20';

export default KotlinVersionFix; 