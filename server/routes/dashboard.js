const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Helper function to get disk space - SIMPLE & REALISTIC
function getDiskSpace() {
  // For local development, use realistic limits
  // Most laptops/desktops have 250GB-500GB available
  // We'll use 256 GB as a reasonable default for development
  
  const capacityInGB = 256; // 256 GB - realistic for development
  const capacityInBytes = capacityInGB * 1024 * 1024 * 1024;
  
  return {
    capacity: capacityInBytes,
    capacityGB: capacityInGB,
    capacityTB: (capacityInGB / 1024).toFixed(2)
  };
}

// Dashboard Status Route
router.get('/status', async (req, res) => {
  try {
    const db = mongoose.connection;
    const startTime = process.uptime();

    // Get all collections
    const collections = await db.db.listCollections().toArray();

    // Get document count for each collection with storage info
    const collectionStats = await Promise.all(
      collections.map(async (col) => {
        try {
          const count = await db.collection(col.name).countDocuments();
          
          // Get collection size/stats (use storageSize for more accurate representation)
          const stats = await db.collection(col.name).stats().catch(e => null);
          
          // Use storageSize (allocated space) or totalSize (includes indexes) for realistic display
          const collectionSize = stats ? (stats.storageSize || stats.totalSize || stats.size || 0) : 0;
          
          return {
            name: col.name,
            count: count,
            size: collectionSize,
            sizeInMB: (collectionSize / (1024 * 1024)).toFixed(2),
            sizeInKB: (collectionSize / 1024).toFixed(2),
            status: 'ok'
          };
        } catch (e) {
          return {
            name: col.name,
            count: 0,
            size: 0,
            sizeInMB: '0.00',
            sizeInKB: '0.00',
            status: 'error'
          };
        }
      })
    );

    // Get sample data from each main collection with error handling
    const sampleData = {
      users: await db.collection('users').findOne().catch(e => null) || { _id: 'N/A', note: 'No data yet' },
      subjects: await db.collection('subjects').findOne().catch(e => null) || { _id: 'N/A', note: 'No data yet' },
      tasks: await db.collection('tasks').findOne().catch(e => null) || { _id: 'N/A', note: 'No data yet' },
      attendance: await db.collection('attendance').findOne().catch(e => null) || { _id: 'N/A', note: 'No data yet' }
    };

    // Convert ObjectIds to strings for JSON
    const sampleDataStringified = {};
    for (let key in sampleData) {
      sampleDataStringified[key] = JSON.parse(JSON.stringify(sampleData[key]));
    }

    // Calculate total storage used
    const totalStorage = collectionStats.reduce((sum, col) => sum + col.size, 0);
    const totalStorageInKB = (totalStorage / 1024).toFixed(2);
    const totalStorageInMB = (totalStorage / (1024 * 1024)).toFixed(2);
    const totalStorageInGB = (totalStorage / (1024 * 1024 * 1024)).toFixed(3);

    // Log for debugging
    console.log('📊 Storage Debug:', {
      totalStorageBytes: totalStorage,
      totalStorageKB: totalStorageInKB,
      totalStorageMB: totalStorageInMB,
      collectionsCount: collectionStats.length
    });

    // Get disk capacity limits
    const diskInfo = getDiskSpace();
    const storageLimit = diskInfo.capacity;
    const storageUsedPercent = totalStorage > 0 ? ((totalStorage / storageLimit) * 100).toFixed(4) : '0.0000';
    const storageRemaining = storageLimit - totalStorage;
    const storageRemainingGB = (storageRemaining / (1024 * 1024 * 1024)).toFixed(2);
    const storageRemainingTB = (storageRemaining / (1024 * 1024 * 1024 * 1024)).toFixed(3);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      server: {
        running: true,
        uptime: Math.floor(startTime),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        version: '1.0.0'
      },
      database: {
        connected: db.readyState === 1,
        host: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database: 'smartacademics',
        status: db.readyState === 1 ? 'Connected' : 'Disconnected'
      },
      storage: {
        totalUsed: totalStorage,
        totalUsedKB: totalStorageInKB,
        totalUsedMB: totalStorageInMB,
        totalUsedGB: totalStorageInGB,
        capacity: storageLimit,
        capacityGB: diskInfo.capacityGB,
        capacityTB: parseFloat(diskInfo.capacityTB),
        used: storageUsedPercent,
        usedPercent: parseFloat(storageUsedPercent),
        remaining: storageRemaining,
        remainingGB: storageRemainingGB,
        remainingTB: storageRemainingTB,
        status: parseFloat(storageUsedPercent) > 90 ? 'critical' : parseFloat(storageUsedPercent) > 80 ? 'warning' : 'normal',
        hasData: totalStorage > 0
      },
      collections: collectionStats.sort((a, b) => b.size - a.size),
      sampleData: sampleDataStringified,
      totalCollections: collectionStats.length,
      totalDocuments: collectionStats.reduce((sum, col) => sum + col.count, 0)
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      server: {
        running: false,
        error: error.message
      }
    });
  }
});

module.exports = router;
