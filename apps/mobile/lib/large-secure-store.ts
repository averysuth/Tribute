import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import aesjs from 'aes-js';
import { Platform } from 'react-native';

/**
 * Supabase session payloads (access + refresh token + user metadata) can exceed
 * SecureStore's ~2KB per-item limit, so the payload itself lives in AsyncStorage,
 * encrypted with a random AES key that SecureStore protects (iOS Keychain /
 * Android Keystore). Only the small encryption key ever touches SecureStore.
 * This is Supabase's own documented pattern for Expo + React Native.
 *
 * `expo-secure-store` has no web implementation (there is no OS keychain to
 * wrap), so on web this falls back to AsyncStorage's localStorage-backed
 * implementation for both the payload and the key — origin-isolated storage
 * is the strongest browser-only primitive available without a server session.
 */
export class LargeSecureStore {
  private async getEncryptionKey(keyName: string): Promise<Uint8Array> {
    const existing = await SecureStore.getItemAsync(keyName);
    if (existing) {
      return aesjs.utils.hex.toBytes(existing);
    }

    const bytes = await Crypto.getRandomBytesAsync(32);
    await SecureStore.setItemAsync(keyName, aesjs.utils.hex.fromBytes(bytes));
    return bytes;
  }

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }

    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    const keyBytes = await this.getEncryptionKey(`${key}-key`);
    const cipher = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(encrypted));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }

    const keyBytes = await this.getEncryptionKey(`${key}-key`);
    const cipher = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encryptedBytes));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(`${key}-key`);
    }
  }
}
