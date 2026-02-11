ALTER TABLE conversations ADD COLUMN type text NOT NULL DEFAULT 'one_to_one';
ALTER TABLE conversations ADD COLUMN connection_id uuid REFERENCES connections(id);


-- Also alter messages table to support conversation_id
ALTER TABLE messages ADD COLUMN conversation_id uuid REFERENCES conversations(id) NOT NULL;

-- Create indexes for performance optimization
CREATE INDEX idx_conversations_connection_id ON conversations(connection_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);