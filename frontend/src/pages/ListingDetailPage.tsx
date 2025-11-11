import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getListingDetails } from '../services/listings';
import { Listing } from '../types';

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        const data = await getListingDetails(id);
        setListing(data);
      } catch (err) {
        setError('Failed to fetch listing details.');
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetails();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!listing) {
    return <div>No listing found.</div>;
  }

  return (
    <div className="listing-detail">
      <h1>{listing.title}</h1>
      <img src={listing.imageUrl} alt={listing.title} />
      <p>{listing.description}</p>
      <p>Price: KES {listing.price}</p>
      <p>Location: {listing.location}</p>
      <button className="btn">Buy Now</button>
      <button className="btn">Place Bid</button>
    </div>
  );
};

export default ListingDetailPage;