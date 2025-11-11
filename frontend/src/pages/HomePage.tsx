import React from 'react';

const HomePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">Welcome to AgriConnect Kenya</h1>
            <p className="text-lg text-center mb-8">
                Your one-stop marketplace for agricultural products and services.
            </p>
            <div className="flex flex-col md:flex-row md:space-x-4">
                <a href="/register" className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition">
                    Get Started
                </a>
                <a href="/marketplace" className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition">
                    Explore Marketplace
                </a>
            </div>
        </div>
    );
};

export default HomePage;