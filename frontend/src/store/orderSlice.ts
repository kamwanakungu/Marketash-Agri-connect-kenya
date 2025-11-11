import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchOrders, createOrder, updateOrderStatus } from '../services/orders';

interface Order {
  id: string;
  userId: string;
  listingId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

export const fetchOrdersAsync = createAsyncThunk('orders/fetchOrders', async (userId: string) => {
  const response = await fetchOrders(userId);
  return response.data;
});

export const createOrderAsync = createAsyncThunk('orders/createOrder', async (orderData: Omit<Order, 'id'>) => {
  const response = await createOrder(orderData);
  return response.data;
});

export const updateOrderStatusAsync = createAsyncThunk('orders/updateOrderStatus', async ({ orderId, status }: { orderId: string; status: string }) => {
  const response = await updateOrderStatus(orderId, status);
  return response.data;
});

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder(state, action) {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder(state) {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrdersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      .addCase(createOrderAsync.fulfilled, (state, action) => {
        state.orders.push(action.payload);
      })
      .addCase(updateOrderStatusAsync.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      });
  },
});

export const { setCurrentOrder, clearCurrentOrder } = orderSlice.actions;

export default orderSlice.reducer;