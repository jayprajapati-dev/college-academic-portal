# MongoDB Setup Guide

## Local Installation

### Windows:
1. Download MongoDB Community Edition from: https://www.mongodb.com/try/download/community
2. Run installer and follow setup wizard
3. MongoDB will run as a service on port 27017

### Verify Installation:
```
mongosh
```

## Connection Details
- **URI**: mongodb://localhost:27017/smart-college-portal
- **Database Name**: smart-college-portal
- **Host**: localhost
- **Port**: 27017

## Collections (Auto-created)
- admins
- semesters
- branches
- subjects
- subjectdetails

## Environment Variable
Add to `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/smart-college-portal
```
