# Setup Guide

## Prerequisites
- Node.js 14+ (recommended 18+)
- MongoDB (local or Atlas)

## Backend Setup
1) Open a terminal in server/
2) Install dependencies:
   npm install
3) Configure environment variables in server/.env:
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/smartacademics
   JWT_SECRET=your_jwt_secret
4) Start the API server:
   npm run dev

Optional: seed demo data
- npm run seed

## Frontend Setup
1) Open a terminal in client/
2) Install dependencies:
   npm install
3) Start the React app:
   npm start

The frontend will run on http://localhost:3000 and proxy API calls to http://localhost:5000.

## Useful Scripts
- server: npm run dev
- server: npm run start
- server: npm run seed
- client: npm start
- client: npm run build

## Maintenance Scripts
- server/scripts/cleanup-attendance-sessions.js
  Removes old attendance sessions with deprecated names.
