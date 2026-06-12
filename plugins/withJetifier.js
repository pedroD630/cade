const { withGradleProperties } = require('expo/config-plugins');

/**
 * Habilita o Jetifier no build Android.
 *
 * O @react-native-voice/voice (lib antiga, sem migração para AndroidX) ainda
 * depende das bibliotecas legadas `com.android.support:*:28.0.0`. Sem o
 * Jetifier, elas colidem com o AndroidX (`androidx.core:core`) e o merge do
 * AndroidManifest falha no atributo `appComponentFactory`. O Jetifier reescreve
 * essas referências legadas para AndroidX em tempo de build.
 *
 * Plugin próprio porque o `expo prebuild` regenera `android/gradle.properties`
 * e apagaria uma edição manual.
 */
module.exports = function withJetifier(config) {
  return withGradleProperties(config, (cfg) => {
    const key = 'android.enableJetifier';
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key
    );
    if (existing) {
      existing.value = 'true';
    } else {
      cfg.modResults.push({ type: 'property', key, value: 'true' });
    }
    return cfg;
  });
};
