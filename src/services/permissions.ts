import { Audio } from 'expo-av';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Solicita a permissão de microfone com justificativa clara (C02).
 * Retorna true se concedida.
 */
export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Permissão de microfone',
        message:
          'O Cadê? usa o microfone apenas para reconhecer a frase de ativação. ' +
          'Seu áudio nunca é gravado nem enviado.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Agora não',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS: dispara o prompt do sistema de microfone.
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

/** Verifica se a permissão de microfone já foi concedida. */
export async function hasMicPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  }
  const { granted } = await Audio.getPermissionsAsync();
  return granted;
}
