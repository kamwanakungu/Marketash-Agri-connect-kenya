import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';

class SearchService {
  private client: Client;

  constructor() {
    this.client = new Client({ node: process.env.ELASTICSEARCH_NODE });
  }

  async searchListings(query: string) {
    const { body } = await this.client.search({
      index: 'listings',
      body: {
        query: {
          multi_match: {
            query,
            fields: ['title', 'description', 'tags'],
          },
        },
      },
    });
    return body.hits.hits.map((hit: any) => hit._source);
  }

  async indexListing(listing: any) {
    await this.client.index({
      index: 'listings',
      body: listing,
    });
  }

  async deleteListing(id: string) {
    await this.client.delete({
      index: 'listings',
      id,
    });
  }
}

export default new SearchService();