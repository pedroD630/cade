import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { RingingOverlay } from './src/components/RingingOverlay';
import { AppProvider, useApp } from './src/context/AppContext';
import { BatteryHelpScreen } from './src/screens/BatteryHelpScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SiriHelpScreen } from './src/screens/SiriHelpScreen';
import { SoundsScreen } from './src/screens/SoundsScreen';
import { colors } from './src/theme';

type Route = 'home' | 'settings' | 'sounds' | 'privacy' | 'battery' | 'siri';

/** Trata links cade://tocar — usados pelo atalho da Siri no iOS. */
function useRingDeepLink() {
  const { loaded, triggerAlarm } = useApp();

  useEffect(() => {
    if (!loaded) return;

    const handleUrl = (url: string | null) => {
      if (!url) return;
      const normalized = url.toLowerCase();
      if (normalized.includes('tocar') || normalized.includes('ring')) {
        void triggerAlarm();
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', (event) =>
      handleUrl(event.url)
    );
    return () => subscription.remove();
  }, [loaded, triggerAlarm]);
}

function Root() {
  const { loaded, settings } = useApp();
  const [route, setRoute] = useState<Route>('home');

  useRingDeepLink();

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!settings.onboardingDone) {
    return (
      <>
        <OnboardingFlow />
        <RingingOverlay />
      </>
    );
  }

  const goHome = () => setRoute('home');

  return (
    <>
      {route === 'home' && (
        <HomeScreen onOpenSettings={() => setRoute('settings')} />
      )}
      {route === 'settings' && (
        <SettingsScreen
          onBack={goHome}
          onOpenSounds={() => setRoute('sounds')}
          onOpenPrivacy={() => setRoute('privacy')}
          onOpenBattery={() => setRoute('battery')}
          onOpenSiri={() => setRoute('siri')}
        />
      )}
      {route === 'sounds' && <SoundsScreen onBack={() => setRoute('settings')} />}
      {route === 'privacy' && (
        <PrivacyScreen onBack={() => setRoute('settings')} />
      )}
      {route === 'battery' && (
        <BatteryHelpScreen onBack={() => setRoute('settings')} />
      )}
      {route === 'siri' && <SiriHelpScreen onBack={() => setRoute('settings')} />}
      <RingingOverlay />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Root />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
