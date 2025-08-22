-- Migration: Add 'favorite' column to media_entries
ALTER TABLE media_entries
ADD COLUMN favorite BOOLEAN DEFAULT FALSE;