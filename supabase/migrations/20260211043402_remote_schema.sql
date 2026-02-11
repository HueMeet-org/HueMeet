drop policy "Users can add participants to conversations" on "public"."conversation_participants";

drop policy "Users can view participants of their conversations" on "public"."conversation_participants";

alter table "public"."messages" alter column "connection_id" drop not null;


  create policy "insert_conversation_participants"
  on "public"."conversation_participants"
  as permissive
  for insert
  to authenticated
with check (((user_id = auth.uid()) OR public.is_conversation_participant(conversation_id, auth.uid())));



  create policy "view_conversation_participants"
  on "public"."conversation_participants"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.is_conversation_participant(conversation_id, auth.uid())));



  create policy "Users can insert their own messages"
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = sender_id));


CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


