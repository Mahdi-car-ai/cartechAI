import React, { FC, ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { loadVinHistory } from '@/store/slices/vinHistorySlice';

interface ReduxProviderProps {
  children: ReactNode;
}

const ReduxProvider: FC<ReduxProviderProps> = ({ children }) => {
  useEffect(() => {
    // Load VIN history from AsyncStorage on app startup
    store.dispatch(loadVinHistory());
  }, []);

  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider; 