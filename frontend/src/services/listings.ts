import axios from 'axios';
import { AppDispatch } from '../store';
import { setListings, setLoading, setError } from '../store/listingSlice';

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/listings`;

export const fetchListings = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await axios.get(API_URL);
    dispatch(setListings(response.data));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const createListing = async (listingData: any) => {
  try {
    const response = await axios.post(API_URL, listingData);
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateListing = async (id: string, listingData: any) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, listingData);
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteListing = async (id: string) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    throw new Error(error.message);
  }
};