import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AddMenu } from '@/features/app/AddMenu';
import { routes } from '@/lib/routes';
import { useTheme } from '@/lib/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontFamily: theme.typography.fonts.bodyMedium,
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Movimentações',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="swap-horizontal-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Controlinho',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="planning"
          options={{
            title: 'Planejamento',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar movimentação"
        onPress={() => setMenuOpen(true)}
        style={({ pressed }) => ({
          position: 'absolute',
          right: theme.spacing.lg,
          bottom: 78,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          elevation: 4,
          shadowColor: theme.colors.text,
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        })}
      >

        <Ionicons name="add" size={28} color={theme.colors.textInverse} />
      </Pressable>

      <AddMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onExpense={() => {
          setMenuOpen(false);
          router.push({
            pathname: '/(app)/transaction/form',
            params: { type: 'expense' },
          });
        }}
        onIncome={() => {
          setMenuOpen(false);
          router.push({
            pathname: '/(app)/transaction/form',
            params: { type: 'income' },
          });
        }}
        onScan={() => {
          setMenuOpen(false);
          router.push(routes.receiptCapture);
        }}
      />
    </View>
  );
}
