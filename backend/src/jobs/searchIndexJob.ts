import { Client } from '@elastic/elasticsearch';
import { Listing } from '../models/Listing';

const client = new Client({ node: process.env.ELASTICSEARCH_NODE });

async function indexListing(listingId: string) {
    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            console.error(`Listing with ID ${listingId} not found.`);
            return;
        }

        const body = {
            id: listing._id,
            title: listing.title,
            description: listing.description,
            price: listing.price,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
        };

        await client.index({
            index: 'listings',
            id: listingId,
            body,
        });

        console.log(`Indexed listing ${listingId}`);
    } catch (error) {
        console.error(`Error indexing listing ${listingId}:`, error);
    }
}

async function deleteListingFromIndex(listingId: string) {
    try {
        await client.delete({
            index: 'listings',
            id: listingId,
        });

        console.log(`Deleted listing ${listingId} from index`);
    } catch (error) {
        console.error(`Error deleting listing ${listingId} from index:`, error);
    }
}

export { indexListing, deleteListingFromIndex };