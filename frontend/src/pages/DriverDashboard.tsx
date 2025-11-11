import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeliveries } from '../services/orders';
import { RootState } from '../store';

const DriverDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const deliveries = useSelector((state: RootState) => state.order.deliveries);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeliveries = async () => {
      await dispatch(fetchDeliveries());
      setLoading(false);
    };

    loadDeliveries();
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Driver Dashboard</h1>
      <div className="mt-4">
        {deliveries.length === 0 ? (
          <p>No deliveries assigned.</p>
        ) : (
          <ul>
            {deliveries.map((delivery) => (
              <li key={delivery.id} className="border p-2 mb-2">
                <h2 className="font-semibold">Delivery ID: {delivery.id}</h2>
                <p>Status: {delivery.status}</p>
                <p>Order ID: {delivery.orderId}</p>
                <p>Address: {delivery.address}</p>
                <p>Assigned At: {new Date(delivery.assignedAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;