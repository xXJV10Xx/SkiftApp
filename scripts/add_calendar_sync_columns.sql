-- Add calendar synchronization columns to shifts table
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS synced_to_calendar BOOLEAN DEFAULT FALSE;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS calendar_sync_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT;

-- Create index for better performance when querying synced shifts
CREATE INDEX IF NOT EXISTS idx_shifts_calendar_sync ON shifts(synced_to_calendar, calendar_sync_at);
CREATE INDEX IF NOT EXISTS idx_shifts_calendar_event_id ON shifts(calendar_event_id);

-- Add comment to document the new columns
COMMENT ON COLUMN shifts.calendar_event_id IS 'Google Calendar event ID for this shift';
COMMENT ON COLUMN shifts.synced_to_calendar IS 'Whether this shift has been synced to Google Calendar';
COMMENT ON COLUMN shifts.calendar_sync_at IS 'Timestamp of last calendar sync attempt';
COMMENT ON COLUMN shifts.calendar_sync_error IS 'Error message if calendar sync failed';