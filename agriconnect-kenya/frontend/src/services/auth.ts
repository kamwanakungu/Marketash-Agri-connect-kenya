import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1/auth';

export const registerUser = async (phone, email, nationalId, password) => {
    const response = await axios.post(`${API_URL}/register/init`, { phone, email, nationalId, password });
    return response.data;
};

export const verifyRegistration = async (otp) => {
    const response = await axios.post(`${API_URL}/register/verify`, { otp });
    return response.data;
};

export const completeRegistration = async (userData) => {
    const response = await axios.post(`${API_URL}/register/complete`, userData);
    return response.data;
};

export const loginUser = async (phone) => {
    const response = await axios.post(`${API_URL}/login/init`, { phone });
    return response.data;
};

export const verifyLogin = async (otp) => {
    const response = await axios.post(`${API_URL}/login/verify`, { otp });
    return response.data;
};

export const logoutUser = async () => {
    const response = await axios.post(`${API_URL}/logout`);
    return response.data;
};

export const refreshToken = async () => {
    const response = await axios.post(`${API_URL}/refresh`);
    return response.data;
};