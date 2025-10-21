import { configureStore } from '@reduxjs/toolkit';
import analysisReducer from './slices/analysisSlice';
import filterReducer from './slices/filterSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    analysis: analysisReducer,
    filters: filterReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
