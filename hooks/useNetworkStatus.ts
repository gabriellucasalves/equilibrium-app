import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
        }
      } catch {
        if (mounted) setIsOnline(true);
      }
    };

    refresh();
    const id = setInterval(refresh, 8000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { isOnline };
}
