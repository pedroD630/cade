import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

/**
 * Abre a tela de otimização de bateria do Android para o usuário liberar o
 * app de restrições em segundo plano. Retorna false se não foi possível.
 */
export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
    );
    return true;
  } catch {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: 'package:com.cade.app' }
      );
      return true;
    } catch {
      return false;
    }
  }
}

export interface ManufacturerInstructions {
  brand: string;
  steps: string[];
}

/**
 * Fabricantes que encerram apps em segundo plano de forma agressiva
 * (nota técnica da seção 4 dos requisitos).
 */
export const BATTERY_INSTRUCTIONS: ManufacturerInstructions[] = [
  {
    brand: 'Xiaomi / Redmi / POCO',
    steps: [
      'Abra Configurações > Apps > Gerenciar apps > Cadê?',
      'Toque em "Economia de bateria" e escolha "Sem restrições"',
      'Ative "Início automático" (Autostart)',
      'Nos apps recentes, segure o Cadê? e toque no cadeado para travar',
    ],
  },
  {
    brand: 'Samsung',
    steps: [
      'Abra Configurações > Aplicativos > Cadê? > Bateria',
      'Escolha "Sem restrições"',
      'Em Configurações > Assistência do aparelho > Bateria > Limites de uso, ' +
        'confira se o Cadê? NÃO está em "Apps suspensos"',
    ],
  },
  {
    brand: 'Motorola',
    steps: [
      'Abra Configurações > Apps > Cadê? > Bateria',
      'Escolha "Sem restrições" (ou "Não otimizar")',
    ],
  },
  {
    brand: 'Outros aparelhos Android',
    steps: [
      'Abra Configurações > Apps > Cadê? > Bateria',
      'Desative a otimização de bateria para o Cadê?',
    ],
  },
];
