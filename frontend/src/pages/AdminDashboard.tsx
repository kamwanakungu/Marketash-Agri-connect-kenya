import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserStatus } from '../services/api';
import { RootState } from '../store';

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const users = useSelector((state: RootState) => state.auth.users);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      await dispatch(fetchUsers());
      setLoading(false);
    };
    loadUsers();
  }, [dispatch]);

  const handleStatusChange = async (userId: string, status: string) => {
    await dispatch(updateUserStatus(userId, status));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <table className="min-w-full mt-4">
        <thead>
          <tr>
            <th className="border px-4 py-2">User ID</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.id}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.status}</td>
              <td className="border px-4 py-2">
                <button onClick={() => handleStatusChange(user.id, 'active')} className="bg-green-500 text-white px-2 py-1">Activate</button>
                <button onClick={() => handleStatusChange(user.id, 'banned')} className="bg-red-500 text-white px-2 py-1 ml-2">Ban</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;