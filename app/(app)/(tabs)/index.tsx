import { Screen, Spacer, Text } from '@/components/ui';
import { ClosedTestHome } from '@/features/closed-test/ClosedTestHome';
import { CLOSED_TEST_MODE } from '@/features/closed-test/config';
import { HomeBody } from '@/features/dashboard/HomeSections';
import { buildGreeting } from '@/features/dashboard/greeting';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useFinanceStore } from '@/store/finance-store';

export default function HomeScreen() {
  const { isOnline } = useNetworkStatus();
  const displayName = useFinanceStore((s) => s.displayName);
  const lastSyncError = useFinanceStore((s) => s.lastSyncError);
  const syncing = useFinanceStore((s) => s.syncing);
  const isDemoMode = useFinanceStore((s) => s.isDemoMode);

  if (CLOSED_TEST_MODE) {
    return (
      <Screen>
        <ClosedTestHome />
      </Screen>
    );
  }

  return (
    <Screen>
      <HomeBody
        greeting={
          <>
            <Text
              variant="label"
              color="accent"
              style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}
              accessibilityRole="header"
            >
              Equilibrium
            </Text>
            <Spacer size="md" />
            <Text variant="title">{buildGreeting(displayName)}</Text>
            <Spacer size="xs" />
            <Text variant="body" color="secondary">
              Seu dinheiro em equilíbrio.
            </Text>
          </>
        }
        syncBanner={
          <>
            {syncing ? (
              <>
                <Spacer size="sm" />
                <Text variant="caption" color="secondary">
                  Atualizando…
                </Text>
              </>
            ) : null}
            {!isOnline && !isDemoMode ? (
              <>
                <Spacer size="sm" />
                <Text variant="caption" color="danger">
                  Você está offline. Algumas alterações não poderão ser salvas
                  agora.
                </Text>
              </>
            ) : null}
            {lastSyncError ? (
              <>
                <Spacer size="sm" />
                <Text variant="caption" color="danger">
                  {lastSyncError}
                </Text>
              </>
            ) : null}
          </>
        }
      />
    </Screen>
  );
}
