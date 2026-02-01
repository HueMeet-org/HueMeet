set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid, uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = uid
  );
$function$
;


  create policy "read own participations"
  on "public"."conversation_participants"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "insert own messages"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((sender_id = auth.uid()) AND public.is_conversation_participant(conversation_id, auth.uid())));



  create policy "read own messages"
  on "public"."messages"
  as permissive
  for select
  to public
using (public.is_conversation_participant(conversation_id, auth.uid()));


