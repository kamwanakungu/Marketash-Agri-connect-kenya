import axios from 'axios';
import { AppDispatch } from '../store';
import { Order } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/orders`;

export const createOrder = async (orderData: Order, dispatch: AppDispatch) => {
    try {
        const response = await axios.post(API_URL, orderData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getOrders = async (dispatch: AppDispatch) => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getOrderDetails = async (orderId: string, dispatch: AppDispatch) => {
    try {
        const response = await axios.get(`${API_URL}/${orderId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};