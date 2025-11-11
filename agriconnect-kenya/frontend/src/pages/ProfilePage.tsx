import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from '../services/api';
import { RootState } from '../store';
import { setUserProfile } from '../store/authSlice';

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    if (userId) {
      const getUserProfile = async () => {
        const profileData = await fetchUserProfile(userId);
        dispatch(setUserProfile(profileData));
      };
      getUserProfile();
    }
  }, [userId, dispatch]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      {userProfile ? (
        <div className="bg-white shadow-md rounded p-4">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          <p><strong>Name:</strong> {userProfile.name}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Phone:</strong> {userProfile.phone}</p>
          <p><strong>KYC Status:</strong> {userProfile.kycStatus}</p>
          <p><strong>Status:</strong> {userProfile.status}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default ProfilePage;