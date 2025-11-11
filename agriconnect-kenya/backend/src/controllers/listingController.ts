import { Request, Response } from 'express';
import Listing from '../models/Listing';
import { validationResult } from 'express-validator';

class ListingController {
  // Create a new listing
  async createListing(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, price, location, images } = req.body;
      const newListing = new Listing({
        title,
        description,
        price,
        location,
        images,
        owner: req.user.id, // Assuming user ID is available in req.user
      });

      await newListing.save();
      return res.status(201).json(newListing);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  }

  // Get all listings
  async getAllListings(req: Request, res: Response) {
    try {
      const listings = await Listing.find().populate('owner', 'phone email');
      return res.status(200).json(listings);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  }

  // Get a single listing by ID
  async getListingById(req: Request, res: Response) {
    try {
      const listing = await Listing.findById(req.params.id).populate('owner', 'phone email');
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      return res.status(200).json(listing);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  }

  // Update a listing
  async updateListing(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, price, location, images } = req.body;
      const updatedListing = await Listing.findByIdAndUpdate(
        req.params.id,
        { title, description, price, location, images },
        { new: true }
      );

      if (!updatedListing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      return res.status(200).json(updatedListing);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  }

  // Delete a listing
  async deleteListing(req: Request, res: Response) {
    try {
      const deletedListing = await Listing.findByIdAndDelete(req.params.id);
      if (!deletedListing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      return res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  }
}

export default new ListingController();