const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = 'react-native-headphone-detection compileSdk fix';

const OVERRIDE_BLOCK = `
// ${MARKER}: a lib fixa compileSdkVersion 28, incompatível com o Android
// Gradle Plugin 8.x. Força SDK moderno apenas nesse módulo.
subprojects { subproject ->
  if (subproject.name == "react-native-headphone-detection") {
    subproject.afterEvaluate {
      if (subproject.extensions.findByName("android") != null) {
        subproject.android {
          compileSdkVersion 35
          buildToolsVersion "35.0.0"
        }
      }
    }
  }
}
`;

/**
 * Injeta no `android/build.gradle` raiz uma sobrescrita que eleva o
 * compileSdk/buildTools do `react-native-headphone-detection` (lib de 2022,
 * fixada em SDK 28). Sem isso, o build falha em
 * `compileDebugJavaWithJavac` ("compile Java 9+ source needs compileSdk 30+").
 *
 * Plugin próprio porque o `expo prebuild` regenera o build.gradle e apagaria
 * uma edição manual.
 */
module.exports = function withHeadphoneSdkFix(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        'withHeadphoneSdkFix: build.gradle não é Groovy; ajuste manual necessário.'
      );
    }
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += OVERRIDE_BLOCK;
    }
    return cfg;
  });
};
