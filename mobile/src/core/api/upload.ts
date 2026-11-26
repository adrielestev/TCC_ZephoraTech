// src/core/api/upload.ts -- Seleciona uma imagem e a envia para a API como arquivo multipart.
import type { ImagePickerAsset } from 'expo-image-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** Abre o seletor de imagens do sistema (não exige permissão de galeria). */
export async function pickImage(aspect: [number, number]): Promise<ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8, // também converte HEIC para JPEG no iOS
  });
  return result.canceled ? null : (result.assets[0] ?? null);
}

/** Monta o multipart para a API (web precisa de Blob; nativo aceita { uri, name, type }). */
export async function buildImageFormData(
  field: string,
  asset: ImagePickerAsset,
): Promise<FormData> {
  const mime = asset.mimeType ?? 'image/jpeg';
  const name = asset.fileName ?? `foto.${mime.split('/')[1] ?? 'jpg'}`;
  const form = new FormData();

  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    form.append(field, blob, name);
  } else {
    form.append(field, { uri: asset.uri, name, type: mime } as unknown as Blob);
  }
  return form;
}
