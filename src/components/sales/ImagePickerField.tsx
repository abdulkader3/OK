import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImagePickerFieldProps {
  label: string;
  value?: string;
  onChange: (uri: string | undefined) => void;
}

export function ImagePickerField({ label, value, onChange }: ImagePickerFieldProps) {
  const requestPermission = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera and photo library permissions to add images.'
      );
      return false;
    }
    return true;
  };

  const showOptions = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    onChange(undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: value }} style={styles.preview} contentFit="cover" />
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={removeImage}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={16} color={Colors.light.textInverse} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.picker} 
          onPress={showOptions}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add-a-photo" size={32} color={Colors.light.textMuted} />
          <Text style={styles.pickerText}>Tap to add image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  picker: {
    height: 120,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pickerText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
  previewContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});