import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchListings, createListing, updateListing, deleteListing } from '../services/listings';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ListingState {
  listings: Listing[];
  loading: boolean;
  error: string | null;
}

const initialState: ListingState = {
  listings: [],
  loading: false,
  error: null,
};

export const fetchListingsAsync = createAsyncThunk('listings/fetchListings', async () => {
  const response = await fetchListings();
  return response.data;
});

export const createListingAsync = createAsyncThunk('listings/createListing', async (listing: Omit<Listing, 'id'>) => {
  const response = await createListing(listing);
  return response.data;
});

export const updateListingAsync = createAsyncThunk('listings/updateListing', async (listing: Listing) => {
  const response = await updateListing(listing);
  return response.data;
});

export const deleteListingAsync = createAsyncThunk('listings/deleteListing', async (id: string) => {
  await deleteListing(id);
  return id;
});

const listingSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchListingsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListingsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload;
      })
      .addCase(fetchListingsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch listings';
      })
      .addCase(createListingAsync.fulfilled, (state, action) => {
        state.listings.push(action.payload);
      })
      .addCase(updateListingAsync.fulfilled, (state, action) => {
        const index = state.listings.findIndex(listing => listing.id === action.payload.id);
        if (index !== -1) {
          state.listings[index] = action.payload;
        }
      })
      .addCase(deleteListingAsync.fulfilled, (state, action) => {
        state.listings = state.listings.filter(listing => listing.id !== action.payload);
      });
  },
});

export default listingSlice.reducer;