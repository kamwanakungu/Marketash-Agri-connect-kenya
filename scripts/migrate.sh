#!/bin/bash

# This script is for migrating the database schema and seeding initial data.

# Exit on error
set -e

# Load environment variables
export $(grep -v '^#' .env | xargs)

# MongoDB connection string
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/agriconnect"}

# Function to run migrations
run_migrations() {
  echo "Running database migrations..."
  # Add your migration commands here
  # Example: npx mongoose-migrate up
}

# Function to seed initial data
seed_data() {
  echo "Seeding initial data..."
  # Add your seeding commands here
  # Example: npx mongoose-seed seed
}

# Main execution
run_migrations
seed_data

echo "Database migration and seeding completed."