import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notificações locais para o modelo foreground-only: como a escuta só funciona
 * com o app aberto (limitação conhecida do Android — ver análise do BUG-002),
 * avisamos o usuário quando ela é pausada ao ir para segundo plano.
 *
 * São notificações 100% locais — nenhum push, nenhum servidor.
 */

const CHANNEL_ID = 'cade-escuta';
const PAUSED_ID = 'cade-escuta-pausada';

/**
 * Cria o canal Android e garante a permissão de notificação. Chamado uma vez,
 * quando a escuta fica ativa em foreground (momento natural para o pedido).
 * Retorna true se as notificações podem ser exibidas.
 */
export async function ensureNotificationSetup(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Escuta do Cadê?',
        importance: Notifications.AndroidImportance.DEFAULT,
        // Sem som/vibração: é um aviso silencioso de estado.
        sound: undefined,
        vibrationPattern: undefined,
        enableVibrate: false,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/** Exibe (imediatamente) o aviso de que a escuta foi pausada em segundo plano. */
export async function showListeningPausedNotification(
  ownerName?: string | null
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: PAUSED_ID,
      content: {
        title: 'Escuta pausada',
        body: ownerName
          ? `Abra o Cadê? para ${ownerName} poder chamar o celular de novo.`
          : 'O Cadê? só ouve com o app aberto. Toque para voltar a ouvir.',
        sticky: false,
      },
      // { channelId } dispara a notificação imediatamente no canal certo (Android);
      // null também é imediato no iOS.
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // Sem permissão ou módulo ausente — segue sem notificar.
  }
}

/** Remove o aviso quando o app volta ao primeiro plano e retoma a escuta. */
export async function dismissListeningPausedNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(PAUSED_ID);
  } catch {
    // Pode já não existir.
  }
}
