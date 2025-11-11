import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchListings } from '../services/listings';
import ListingCard from '../components/marketplace/ListingCard';
import { RootState } from '../store';

const MarketplacePage: React.FC = () => {
  const dispatch = useDispatch();
  const listings = useSelector((state: RootState) => state.listing.listings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadListings = async () => {
      await dispatch(fetchListings());
      setLoading(false);
    };

    loadListings();
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} />
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;