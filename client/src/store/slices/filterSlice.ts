import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterState } from '@/types';

const initialState: FilterState = {
  sentiment: [],
  emotion: [],
  abuseLevel: [],
  gender: [],
  ageRange: {
    min: 13,
    max: 100
  },
  searchQuery: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSentimentFilter: (state, action: PayloadAction<string[]>) => {
      state.sentiment = action.payload;
    },
    setEmotionFilter: (state, action: PayloadAction<string[]>) => {
      state.emotion = action.payload;
    },
    setAbuseLevelFilter: (state, action: PayloadAction<string[]>) => {
      state.abuseLevel = action.payload;
    },
    setGenderFilter: (state, action: PayloadAction<string[]>) => {
      state.gender = action.payload;
    },
    setAgeRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.ageRange = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    clearFilters: (state) => {
      state.sentiment = [];
      state.emotion = [];
      state.abuseLevel = [];
      state.gender = [];
      state.ageRange = { min: 13, max: 100 };
      state.searchQuery = '';
      state.sortBy = 'createdAt';
      state.sortOrder = 'desc';
    },
    resetToDefaults: (_state) => {
      return initialState;
    }
  }
});

export const {
  setSentimentFilter,
  setEmotionFilter,
  setAbuseLevelFilter,
  setGenderFilter,
  setAgeRange,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  clearFilters,
  resetToDefaults
} = filterSlice.actions;

export default filterSlice.reducer;
