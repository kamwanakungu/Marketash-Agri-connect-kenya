import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerUser } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleNextStep = () => {
    if (step === 1) {
      // Send OTP logic here
      dispatch(registerUser({ phone, email, nationalId, name, location }));
      setStep(2);
    } else if (step === 2) {
      // Verify OTP logic here
      // On success, navigate to the next page
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {step === 1 && (
        <div className="flex flex-col">
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="National ID"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleNextStep}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Send OTP
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleNextStep}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Verify OTP
          </button>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;