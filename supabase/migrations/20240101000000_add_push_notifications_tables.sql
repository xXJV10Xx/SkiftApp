-- Create push_tokens table to store device push notification tokens
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')) DEFAULT 'android',
    device_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, token)
);

-- Create message_mentions table to track @mentions in messages
CREATE TABLE IF NOT EXISTS message_mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    mentioned_employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    mentioned_by UUID REFERENCES employees(id) ON DELETE CASCADE,
    chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, mentioned_employee_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push_tokens
CREATE POLICY "Users can view own push tokens" ON push_tokens
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own push tokens" ON push_tokens
    FOR INSERT WITH CHECK (
        employee_id IN (
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update own push tokens" ON push_tokens
    FOR UPDATE USING (
        employee_id IN (
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own push tokens" ON push_tokens
    FOR DELETE USING (
        employee_id IN (
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

-- Create RLS policies for message_mentions
CREATE POLICY "Users can view mentions where they are mentioned" ON message_mentions
    FOR SELECT USING (
        mentioned_employee_id IN (
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can view mentions they created" ON message_mentions
    FOR SELECT USING (
        mentioned_by IN (
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update mentions where they are mentioned" ON message_mentions
    FOR UPDATE USING (
        mentioned_employee_id IN (
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_employee_id ON push_tokens(employee_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_message_mentions_mentioned_employee ON message_mentions(mentioned_employee_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_message_id ON message_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_chat_room ON message_mentions(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_unread ON message_mentions(mentioned_employee_id, is_read) WHERE is_read = false;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions for the service role to access these tables
GRANT ALL ON push_tokens TO service_role;
GRANT ALL ON message_mentions TO service_role;

-- Create a function to get unread mention count for a user
CREATE OR REPLACE FUNCTION get_unread_mentions_count(user_employee_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM message_mentions
        WHERE mentioned_employee_id = user_employee_id
        AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_unread_mentions_count(UUID) TO authenticated;