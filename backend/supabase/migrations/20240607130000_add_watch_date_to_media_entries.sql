-- Migration: Add 'watch_date' column to media_entries for Watch Diary feature
ALTER TABLE media_entries
ADD COLUMN watch_date DATE; 