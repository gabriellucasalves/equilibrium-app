import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Button, Screen, Spacer, Text } from '@/components/ui';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { STEPS, stepProgress } from '@/features/onboarding/progress';
import { useTheme } from '@/lib/theme';

export default function WelcomeScreen() {
  const theme = useTheme();
  const [fade] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => new Animated.Value(16));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  return (
    <Screen scroll={false}>
      <OnboardingHeader progress={stepProgress(STEPS.welcome)} />

      <Animated.View
        style={[
          styles.hero,
          {
            opacity: fade,
            transform: [{ translateY: rise }],
          },
        ]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.colors.accentSoft,
              borderRadius: theme.radii.xl,
            },
          ]}
        />
        <View
          style={{
            position: 'absolute',
            right: -40,
            top: -30,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: theme.colors.accent,
            opacity: 0.12,
          }}
        />
        <View
          style={{
            padding: theme.spacing.lg,
            justifyContent: 'flex-end',
            flex: 1,
          }}
        >
          <Text variant="hero" style={{ maxWidth: 320 }}>
            Equilibrium
          </Text>
          <Spacer size="sm" />
          <Text variant="subtitle" color="secondary">
            Seu dinheiro, com calma e clareza.
          </Text>
        </View>
      </Animated.View>

      <Spacer size="xl" />

      <Text variant="title">Vamos organizar seu dinheiro?</Text>
      <Spacer size="sm" />
      <Text variant="body" color="secondary">
        Leva menos de 2 minutos. Uma pergunta de cada vez — sem julgamento.
      </Text>

      <View style={{ flex: 1 }} />

      <Button
        label="Começar"
        onPress={() => router.push('/(onboarding)/income')}
        testID="onboarding-start"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 220,
    overflow: 'hidden',
    width: '100%',
  },
});
