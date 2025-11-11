import { Router } from 'express';
import { 
  createListing, 
  getListings, 
  getListingById, 
  updateListing, 
  deleteListing, 
  placeBid, 
  getMyListings 
} from '../controllers/listingController';
import { auth } from '../middleware/auth';
import { validateListing } from '../middleware/validation';

const router = Router();

// Create a new listing (farmers only)
router.post('/', auth, validateListing, createListing);

// Get all listings (public)
router.get('/', getListings);

// Get listing details by ID
router.get('/:id', getListingById);

// Update a listing (owner)
router.put('/:id', auth, validateListing, updateListing);

// Delete a listing (owner)
router.delete('/:id', auth, deleteListing);

// Place a bid on a listing
router.post('/:id/bids', auth, placeBid);

// Get own listings
router.get('/my-listings', auth, getMyListings);

export default router;