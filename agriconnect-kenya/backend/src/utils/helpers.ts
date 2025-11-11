// backend/src/utils/helpers.ts
export const formatCurrency = (amount: number): string => {
    return `KES ${amount.toFixed(2)}`;
};

export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^254[17]\d{8}$/; // Safaricom format
    return phoneRegex.test(phone);
};

export const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};