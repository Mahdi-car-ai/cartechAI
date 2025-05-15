import React, { FC, ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { loadVinHistory } from "@/store/slices/vinHistorySlice";
import { loadLicensePlateHistory } from "@/store/slices/licensePlateHistorySlice";
import { loadChats } from "@/store/slices/chatSlice";

interface ReduxProviderProps {
  children: ReactNode;
}

const ReduxProvider: FC<ReduxProviderProps> = ({ children }) => {
  useEffect(() => {
    store.dispatch(loadVinHistory());
    store.dispatch(loadLicensePlateHistory());
    store.dispatch(loadChats());
  }, []);

  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
