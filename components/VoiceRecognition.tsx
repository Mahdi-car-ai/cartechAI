import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

interface VoiceRecognitionProps {
  onSpeechResults?: (results: string[]) => void;
  language?: string;
}

export const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({ 
  onSpeechResults,
  language = 'en-US'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Initialize voice event listeners
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = onSpeechResultsHandler;
    Voice.onSpeechError = onSpeechErrorHandler;

    // Clean up listeners on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResultsHandler = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setResults(e.value);
      if (onSpeechResults) {
        onSpeechResults(e.value);
      }
    }
  };

  const onSpeechErrorHandler = (e: SpeechErrorEvent) => {
    setError(e.error?.message || 'Unknown error');
    setIsListening(false);
  };

  const startRecognizing = async () => {
    try {
      setError('');
      setResults([]);
      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        setError('Voice recognition is not available on this device');
        return;
      }
      await Voice.start(language);
    } catch (e) {
      console.error(e);
      setError('Failed to start voice recognition');
    }
  };

  const stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isListening ? styles.buttonActive : null]}
        onPress={isListening ? stopRecognizing : startRecognizing}
      >
        <Text style={styles.buttonText}>
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </Text>
        {isListening && <ActivityIndicator color="#fff" style={styles.indicator} />}
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {results.length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results:</Text>
          {results.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  indicator: {
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  resultsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resultsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
  },
}); 