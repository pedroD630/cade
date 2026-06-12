import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, fontSize, spacing } from '../theme';

interface ScreenProps {
  title?: string;
  onBack?: () => void;
  children: React.ReactNode;
  /** Centraliza o conteúdo verticalmente (telas de onboarding). */
  centered?: boolean;
}

/** Container padrão de tela com cabeçalho opcional e botão voltar. */
export function Screen({ title, onBack, children, centered }: ScreenProps) {
  return (
    <View style={styles.root}>
      {(title || onBack) && (
        <View style={styles.header}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={12}
            >
              <Text style={styles.backText}>‹ Voltar</Text>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View style={styles.backButton} />
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          centered && styles.centeredContent,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    minWidth: 80,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
