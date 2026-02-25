CREATE POLICY "create conversations"
ON conversations
FOR INSERT
WITH CHECK (
  -- Only allow creating conversations for connections where user is sender or receiver
  connection_id IN (
    SELECT id FROM connections 
    WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
  )
);