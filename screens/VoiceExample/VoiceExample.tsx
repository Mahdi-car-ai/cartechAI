import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { VoiceRecognition } from "../../components/VoiceRecognition";

export default function VoiceExample() {
  const [recognizedText, setRecognizedText] = useState<string>("");

  const handleSpeechResults = (results: string[]) => {
    // Use the most confident result (first one)
    if (results && results.length > 0) {
      setRecognizedText(results[0]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Voice Recognition Example</Text>

        <View style={styles.card}>
          <Text style={styles.instructions}>
            Tap the button below and speak. Your speech will be converted to
            text.
          </Text>

          <VoiceRecognition
            onSpeechResults={handleSpeechResults}
            language="en-US" // Change to your preferred language, e.g., "uk-UA" for Ukrainian
          />
        </View>

        {recognizedText ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Recognized Text:</Text>
            <Text style={styles.recognizedText}>{recognizedText}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructions: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#555",
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  recognizedText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});
