#!/usr/bin/env node
/**
 * Cleanup script to remove conflicting timetable entries
 * (Same semester-branch at same day-slot)
 * Keeps the older entry, removes newer duplicates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');

const cleanupConflicts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics');
    console.log('📊 Connected to MongoDB');

    // Find all active timetable entries
    const allEntries = await Timetable.find({ status: 'active' })
      .populate('semesterId', '_id semesterNumber')
      .populate('branchId', '_id name code')
      .populate('subjectId', '_id name code')
      .lean();

    console.log(`📖 Total entries: ${allEntries.length}`);

    // Group by semester-branch-day-slot to find conflicts
    const groups = {};
    allEntries.forEach((entry) => {
      const key = `${entry.semesterId._id}|${entry.branchId._id}|${entry.dayOfWeek}|${entry.slot}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    // Find groups with conflicts (>1 entry)
    const conflicts = Object.entries(groups).filter(([_, entries]) => entries.length > 1);
    console.log(`⚠️  Conflicts found: ${conflicts.length}`);

    if (conflicts.length === 0) {
      console.log('✅ No conflicts found!');
      await mongoose.disconnect();
      return;
    }

    let deleted = 0;

    for (const [key, entries] of conflicts) {
      const [semId, brId, day, slot] = key.split('|');
      console.log(`\n🔴 CONFLICT: ${day} Slot ${slot}`);

      // Sort by creation time (createdAt), keep oldest
      const sorted = entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      console.log(`   Entries: ${entries.length}`);
      sorted.forEach((e, idx) => {
        const status = idx === 0 ? '✅ KEEP' : '❌ DELETE';
        console.log(
          `   ${status}: ${e.subjectId?.code || 'Unknown'} | ${e.teacherId?.name || 'Unknown'} | ${e.roomId?.roomNo || 'Unknown'} | Created: ${e.createdAt.toISOString().split('T')[0]}`
        );
      });

      // Delete all except the first (oldest)
      for (let i = 1; i < sorted.length; i++) {
        await Timetable.findByIdAndDelete(sorted[i]._id);
        deleted++;
        console.log(`   ✓ Deleted: ${sorted[i]._id}`);
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deleted} conflicting entries.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

cleanupConflicts();
