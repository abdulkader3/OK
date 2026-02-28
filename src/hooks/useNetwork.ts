import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface UseNetworkReturn {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  refresh: () => void;
}

export function useNetwork(): UseNetworkReturn {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(() => {
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkState(state);
    });
  }, []);

  const isConnected = networkState?.isConnected ?? null;
  const isInternetReachable = networkState?.isInternetReachable ?? null;
  const isOffline = isConnected === false || isInternetReachable === false;

  return {
    isConnected,
    isInternetReachable,
    isOffline,
    refresh,
  };
}

export default useNetwork;
