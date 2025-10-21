import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  currentPage: 'input' | 'results';
  selectedTab: 'overview' | 'comments' | 'demographics';
  exportModalOpen: boolean;
  loadingOverlay: boolean;
}

const initialState: UIState = {
  darkMode: false,
  sidebarOpen: true,
  currentPage: 'input',
  selectedTab: 'overview',
  exportModalOpen: false,
  loadingOverlay: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<'input' | 'results'>) => {
      state.currentPage = action.payload;
    },
    setSelectedTab: (state, action: PayloadAction<'overview' | 'comments' | 'demographics'>) => {
      state.selectedTab = action.payload;
    },
    setExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.exportModalOpen = action.payload;
    },
    setLoadingOverlay: (state, action: PayloadAction<boolean>) => {
      state.loadingOverlay = action.payload;
    }
  }
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarOpen,
  setCurrentPage,
  setSelectedTab,
  setExportModalOpen,
  setLoadingOverlay
} = uiSlice.actions;

export default uiSlice.reducer;
