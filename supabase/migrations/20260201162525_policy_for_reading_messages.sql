CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid, uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public 
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = uid
  );
$function$;

DROP POLICY "read own messages" ON "public"."messages";

CREATE POLICY "read conversation messages"
ON "public"."messages"
FOR SELECT
TO public
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);

GRANT SELECT ON TABLE "public"."messages" TO public;
GRANT SELECT ON TABLE "public"."conversation_participants" TO public;