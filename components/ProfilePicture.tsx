import { Camera, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

interface ProfilePictureProps {
  imageUri?: string | null;
  size?: number;
  onImageSelected?: (uri: string) => void;
  editable?: boolean;
  showCameraIcon?: boolean;
}

export default function ProfilePicture({ 
  imageUri, 
  size = 80, 
  onImageSelected, 
  editable = true,
  showCameraIcon = true 
}: ProfilePictureProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Behörighet krävs',
        'Vi behöver tillgång till dina foton för att du ska kunna välja en profilbild.'
      );
      return false;
    }
    return true;
  };

  const selectImage = async () => {
    if (!editable || loading) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Välj profilbild',
      'Hur vill du lägga till din profilbild?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Kamera', 
          onPress: () => openCamera() 
        },
        { 
          text: 'Fotobibliotek', 
          onPress: () => openImageLibrary() 
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      setLoading(true);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Behörighet krävs',
          'Vi behöver tillgång till kameran för att ta foton.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Fel', 'Kunde inte öppna kameran');
    } finally {
      setLoading(false);
    }
  };

  const openImageLibrary = async () => {
    try {
      setLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Fel', 'Kunde inte öppna fotobiblioteket');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    avatarContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.background,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: size / 2,
    },
    cameraIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={selectImage}
        disabled={!editable || loading}
        activeOpacity={editable ? 0.7 : 1}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <User size={size * 0.5} color="white" />
        )}
        
        {loading && (
          <View style={styles.loadingOverlay}>
            {/* Loading indicator could be added here */}
          </View>
        )}
      </TouchableOpacity>

      {editable && showCameraIcon && (
        <TouchableOpacity 
          style={styles.cameraIconContainer}
          onPress={selectImage}
          disabled={loading}
        >
          <Camera size={12} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}