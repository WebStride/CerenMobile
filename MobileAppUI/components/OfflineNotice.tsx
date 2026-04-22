import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

const OfflineNotice = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected !== false) {
    return null;
  }

  return (
    <Modal
      visible={isConnected === false}
      transparent={false}
      animationType="fade"
      onRequestClose={() => {}} // prevent closing manually
    >
      <View style={styles.offlineContainer}>
        <Ionicons name="wifi-outline" size={64} color="#666" style={{ marginBottom: 20 }} />
        <Text style={styles.offlineTitle}>No Internet Connection</Text>
        <Text style={styles.offlineText}>
          You are offline. Please turn on the net and open the app again to see the details.
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default OfflineNotice;
