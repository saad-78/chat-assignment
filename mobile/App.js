import React from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import AppNavigator from './app/navigation/AppNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}

