drop trigger if exists "update_connections_updated_at" on "public"."connections";

drop trigger if exists "update_conversations_updated_at" on "public"."conversations";

drop trigger if exists "update_profiles_updated_at" on "public"."profiles";

drop policy "Users can add participants to conversations" on "public"."conversation_participants";

drop policy "Users can view participants of their conversations" on "public"."conversation_participants";

drop policy "Users can view conversations they are part of" on "public"."conversations";

drop policy "insert own messages" on "public"."messages";

drop policy "read conversation messages" on "public"."messages";

alter table "public"."connections" drop constraint "connections_receiver_id_fkey";

alter table "public"."connections" drop constraint "connections_sender_id_fkey";

alter table "public"."conversation_participants" drop constraint "conversation_participants_conversation_id_fkey";

alter table "public"."conversations" drop constraint "conversations_connection_id_fkey";

alter table "public"."messages" drop constraint "messages_connection_id_fkey";

alter table "public"."messages" drop constraint "messages_conversation_id_fkey";

alter table "public"."user_interests" drop constraint "user_interests_interest_id_fkey";

alter table "public"."connections" add constraint "connections_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) not valid;

alter table "public"."connections" validate constraint "connections_receiver_id_fkey";

alter table "public"."connections" add constraint "connections_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) not valid;

alter table "public"."connections" validate constraint "connections_sender_id_fkey";

alter table "public"."conversation_participants" add constraint "conversation_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_conversation_id_fkey";

alter table "public"."conversations" add constraint "conversations_connection_id_fkey" FOREIGN KEY (connection_id) REFERENCES public.connections(id) not valid;

alter table "public"."conversations" validate constraint "conversations_connection_id_fkey";

alter table "public"."messages" add constraint "messages_connection_id_fkey" FOREIGN KEY (connection_id) REFERENCES public.connections(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_connection_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."user_interests" add constraint "user_interests_interest_id_fkey" FOREIGN KEY (interest_id) REFERENCES public.interests(id) ON DELETE CASCADE not valid;

alter table "public"."user_interests" validate constraint "user_interests_interest_id_fkey";

create or replace view "public"."user_profiles_complete" as  SELECT id,
    full_name,
    username,
    avatar_url,
    bio,
    created_at,
    updated_at,
    aura,
    ( SELECT count(*) AS count
           FROM public.user_interests ui
          WHERE (ui.user_id = p.id)) AS interests_count,
    ( SELECT count(*) AS count
           FROM public.connections c
          WHERE (((p.id = c.sender_id) OR (p.id = c.receiver_id)) AND (c.status = 'accepted'::text))) AS connections_count
   FROM public.profiles p;



  create policy "Users can add participants to conversations"
  on "public"."conversation_participants"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.conversation_participants conversation_participants_1
  WHERE ((conversation_participants_1.conversation_id = conversation_participants_1.conversation_id) AND (conversation_participants_1.user_id = auth.uid())))));



  create policy "Users can view participants of their conversations"
  on "public"."conversation_participants"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE ((cp.conversation_id = conversation_participants.conversation_id) AND (cp.user_id = auth.uid())))));



  create policy "Users can view conversations they are part of"
  on "public"."conversations"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = conversations.id) AND (conversation_participants.user_id = auth.uid())))));



  create policy "insert own messages"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((sender_id = auth.uid()) AND public.is_conversation_participant(conversation_id, auth.uid())));



  create policy "read conversation messages"
  on "public"."messages"
  as permissive
  for select
  to public
using (public.is_conversation_participant(conversation_id, auth.uid()));


CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


