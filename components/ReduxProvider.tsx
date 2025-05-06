import React, { FC, ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { loadVinHistory } from "@/store/slices/vinHistorySlice";
import { loadLicensePlateHistory } from "@/store/slices/licensePlateHistorySlice";

interface ReduxProviderProps {
  children: ReactNode;
}

const ReduxProvider: FC<ReduxProviderProps> = ({ children }) => {
  useEffect(() => {
    store.dispatch(loadVinHistory());
    store.dispatch(loadLicensePlateHistory());
  }, []);

  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
