drop extension if exists "pg_net";


  create table "public"."connections" (
    "id" uuid not null default gen_random_uuid(),
    "sender_id" uuid not null,
    "receiver_id" uuid not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."connections" enable row level security;


  create table "public"."conversation_participants" (
    "conversation_id" uuid not null,
    "user_id" uuid not null,
    "joined_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."conversation_participants" enable row level security;


  create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."conversations" enable row level security;


  create table "public"."interests" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "category" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."interests" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "sender_id" uuid not null,
    "content" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."messages" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text not null,
    "username" text,
    "avatar_url" text,
    "bio" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "aura" integer default 0
      );


alter table "public"."profiles" enable row level security;


  create table "public"."user_interests" (
    "user_id" uuid not null,
    "interest_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."user_interests" enable row level security;

CREATE UNIQUE INDEX connections_pkey ON public.connections USING btree (id);

CREATE INDEX connections_receiver_id_idx ON public.connections USING btree (receiver_id);

CREATE INDEX connections_sender_id_idx ON public.connections USING btree (sender_id);

CREATE INDEX connections_status_idx ON public.connections USING btree (status);

CREATE INDEX conversation_participants_conversation_id_idx ON public.conversation_participants USING btree (conversation_id);

CREATE UNIQUE INDEX conversation_participants_pkey ON public.conversation_participants USING btree (conversation_id, user_id);

CREATE INDEX conversation_participants_user_id_idx ON public.conversation_participants USING btree (user_id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE INDEX interests_category_idx ON public.interests USING btree (category);

CREATE UNIQUE INDEX interests_name_key ON public.interests USING btree (name);

CREATE UNIQUE INDEX interests_pkey ON public.interests USING btree (id);

CREATE UNIQUE INDEX interests_slug_key ON public.interests USING btree (slug);

CREATE INDEX messages_conversation_id_idx ON public.messages USING btree (conversation_id);

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at DESC);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX messages_sender_id_idx ON public.messages USING btree (sender_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX profiles_username_idx ON public.profiles USING btree (full_name);

CREATE UNIQUE INDEX unique_connection ON public.connections USING btree (sender_id, receiver_id);

CREATE INDEX user_interests_interest_id_idx ON public.user_interests USING btree (interest_id);

CREATE UNIQUE INDEX user_interests_pkey ON public.user_interests USING btree (user_id, interest_id);

CREATE INDEX user_interests_user_id_idx ON public.user_interests USING btree (user_id);

alter table "public"."connections" add constraint "connections_pkey" PRIMARY KEY using index "connections_pkey";

alter table "public"."conversation_participants" add constraint "conversation_participants_pkey" PRIMARY KEY using index "conversation_participants_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."interests" add constraint "interests_pkey" PRIMARY KEY using index "interests_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."user_interests" add constraint "user_interests_pkey" PRIMARY KEY using index "user_interests_pkey";

alter table "public"."connections" add constraint "connections_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) not valid;

alter table "public"."connections" validate constraint "connections_receiver_id_fkey";

alter table "public"."connections" add constraint "connections_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) not valid;

alter table "public"."connections" validate constraint "connections_sender_id_fkey";

alter table "public"."connections" add constraint "no_self_connection" CHECK ((sender_id <> receiver_id)) not valid;

alter table "public"."connections" validate constraint "no_self_connection";

alter table "public"."connections" add constraint "unique_connection" UNIQUE using index "unique_connection";

alter table "public"."connections" add constraint "valid_status" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))) not valid;

alter table "public"."connections" validate constraint "valid_status";

alter table "public"."conversation_participants" add constraint "conversation_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_conversation_id_fkey";

alter table "public"."conversation_participants" add constraint "conversation_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_user_id_fkey";

alter table "public"."interests" add constraint "interest_name_length" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 50))) not valid;

alter table "public"."interests" validate constraint "interest_name_length";

alter table "public"."interests" add constraint "interests_name_key" UNIQUE using index "interests_name_key";

alter table "public"."interests" add constraint "interests_slug_key" UNIQUE using index "interests_slug_key";

alter table "public"."messages" add constraint "message_content_length" CHECK (((char_length(content) >= 1) AND (char_length(content) <= 5000))) not valid;

alter table "public"."messages" validate constraint "message_content_length";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."user_interests" add constraint "user_interests_interest_id_fkey" FOREIGN KEY (interest_id) REFERENCES public.interests(id) ON DELETE CASCADE not valid;

alter table "public"."user_interests" validate constraint "user_interests_interest_id_fkey";

alter table "public"."user_interests" add constraint "user_interests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_interests" validate constraint "user_interests_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.are_users_connected(user1_id uuid, user2_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
    AND (
      (sender_id = user1_id AND receiver_id = user2_id) OR
      (sender_id = user2_id AND receiver_id = user1_id)
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_connection_status(user1_id uuid, user2_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  connection_status TEXT;
BEGIN
  SELECT status INTO connection_status
  FROM public.connections
  WHERE 
    (sender_id = user1_id AND receiver_id = user2_id) OR
    (sender_id = user2_id AND receiver_id = user1_id)
  LIMIT 1;
  
  RETURN COALESCE(connection_status, 'none');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  conv_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT c.id INTO conv_id
  FROM public.conversations c
  WHERE EXISTS (
    SELECT 1 FROM public.conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
  )
  AND (
    SELECT COUNT(*) FROM public.conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES
    RETURNING id INTO conv_id;
    
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (conv_id, user1_id), (conv_id, user2_id);
  END IF;
  
  RETURN conv_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recommended_users(current_user_id uuid)
 RETURNS TABLE(id uuid, username text, full_name text, avatar_url text, bio text, aura integer, shared_interests_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.aura,
    COUNT(ui2.interest_id) as shared_interests_count
  FROM profiles p
  JOIN user_interests ui2 ON p.id = ui2.user_id
  WHERE ui2.interest_id IN (
    SELECT interest_id 
    FROM user_interests 
    WHERE user_id = current_user_id
  )
  AND p.id != current_user_id
  AND NOT EXISTS (
    SELECT 1 FROM connections 
    WHERE (sender_id = current_user_id AND receiver_id = p.id)
    OR (receiver_id = current_user_id AND sender_id = p.id)
  )
  GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.bio, p.aura
  HAVING COUNT(ui2.interest_id) >= 1
  ORDER BY shared_interests_count DESC
  LIMIT 20;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  final_username TEXT;
  base_username TEXT;
BEGIN
  -- 1. Create a base username (from metadata or email)
  base_username := LOWER(REGEXP_REPLACE(
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g' -- Clean illegal characters
  ));

  -- 2. Ensure it's not too short for your table constraint
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;

  final_username := base_username;

  -- 3. THE FIX: Unique check loop (Prevents crashes)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
  END LOOP;

  -- 4. INSERT with all metadata fallbacks
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    final_username,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url', 
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'avatar'
    )
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$
;

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


grant delete on table "public"."connections" to "anon";

grant insert on table "public"."connections" to "anon";

grant references on table "public"."connections" to "anon";

grant select on table "public"."connections" to "anon";

grant trigger on table "public"."connections" to "anon";

grant truncate on table "public"."connections" to "anon";

grant update on table "public"."connections" to "anon";

grant delete on table "public"."connections" to "authenticated";

grant insert on table "public"."connections" to "authenticated";

grant references on table "public"."connections" to "authenticated";

grant select on table "public"."connections" to "authenticated";

grant trigger on table "public"."connections" to "authenticated";

grant truncate on table "public"."connections" to "authenticated";

grant update on table "public"."connections" to "authenticated";

grant delete on table "public"."connections" to "service_role";

grant insert on table "public"."connections" to "service_role";

grant references on table "public"."connections" to "service_role";

grant select on table "public"."connections" to "service_role";

grant trigger on table "public"."connections" to "service_role";

grant truncate on table "public"."connections" to "service_role";

grant update on table "public"."connections" to "service_role";

grant delete on table "public"."conversation_participants" to "anon";

grant insert on table "public"."conversation_participants" to "anon";

grant references on table "public"."conversation_participants" to "anon";

grant select on table "public"."conversation_participants" to "anon";

grant trigger on table "public"."conversation_participants" to "anon";

grant truncate on table "public"."conversation_participants" to "anon";

grant update on table "public"."conversation_participants" to "anon";

grant delete on table "public"."conversation_participants" to "authenticated";

grant insert on table "public"."conversation_participants" to "authenticated";

grant references on table "public"."conversation_participants" to "authenticated";

grant select on table "public"."conversation_participants" to "authenticated";

grant trigger on table "public"."conversation_participants" to "authenticated";

grant truncate on table "public"."conversation_participants" to "authenticated";

grant update on table "public"."conversation_participants" to "authenticated";

grant delete on table "public"."conversation_participants" to "service_role";

grant insert on table "public"."conversation_participants" to "service_role";

grant references on table "public"."conversation_participants" to "service_role";

grant select on table "public"."conversation_participants" to "service_role";

grant trigger on table "public"."conversation_participants" to "service_role";

grant truncate on table "public"."conversation_participants" to "service_role";

grant update on table "public"."conversation_participants" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."interests" to "anon";

grant insert on table "public"."interests" to "anon";

grant references on table "public"."interests" to "anon";

grant select on table "public"."interests" to "anon";

grant trigger on table "public"."interests" to "anon";

grant truncate on table "public"."interests" to "anon";

grant update on table "public"."interests" to "anon";

grant delete on table "public"."interests" to "authenticated";

grant insert on table "public"."interests" to "authenticated";

grant references on table "public"."interests" to "authenticated";

grant select on table "public"."interests" to "authenticated";

grant trigger on table "public"."interests" to "authenticated";

grant truncate on table "public"."interests" to "authenticated";

grant update on table "public"."interests" to "authenticated";

grant delete on table "public"."interests" to "service_role";

grant insert on table "public"."interests" to "service_role";

grant references on table "public"."interests" to "service_role";

grant select on table "public"."interests" to "service_role";

grant trigger on table "public"."interests" to "service_role";

grant truncate on table "public"."interests" to "service_role";

grant update on table "public"."interests" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."user_interests" to "anon";

grant insert on table "public"."user_interests" to "anon";

grant references on table "public"."user_interests" to "anon";

grant select on table "public"."user_interests" to "anon";

grant trigger on table "public"."user_interests" to "anon";

grant truncate on table "public"."user_interests" to "anon";

grant update on table "public"."user_interests" to "anon";

grant delete on table "public"."user_interests" to "authenticated";

grant insert on table "public"."user_interests" to "authenticated";

grant references on table "public"."user_interests" to "authenticated";

grant select on table "public"."user_interests" to "authenticated";

grant trigger on table "public"."user_interests" to "authenticated";

grant truncate on table "public"."user_interests" to "authenticated";

grant update on table "public"."user_interests" to "authenticated";

grant delete on table "public"."user_interests" to "service_role";

grant insert on table "public"."user_interests" to "service_role";

grant references on table "public"."user_interests" to "service_role";

grant select on table "public"."user_interests" to "service_role";

grant trigger on table "public"."user_interests" to "service_role";

grant truncate on table "public"."user_interests" to "service_role";

grant update on table "public"."user_interests" to "service_role";


  create policy "Users can create connection requests"
  on "public"."connections"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = sender_id));



  create policy "Users can delete their own requests"
  on "public"."connections"
  as permissive
  for delete
  to public
using (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));



  create policy "Users can update received requests"
  on "public"."connections"
  as permissive
  for update
  to public
using ((auth.uid() = receiver_id))
with check ((auth.uid() = receiver_id));



  create policy "Users can view their own connections"
  on "public"."connections"
  as permissive
  for select
  to public
using (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));



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



  create policy "Anyone can view interests"
  on "public"."interests"
  as permissive
  for select
  to public
using (true);



  create policy "Users can insert messages in their conversations"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = messages.conversation_id) AND (conversation_participants.user_id = auth.uid()))))));



  create policy "Users can update their own messages"
  on "public"."messages"
  as permissive
  for update
  to public
using ((auth.uid() = sender_id))
with check ((auth.uid() = sender_id));



  create policy "Users can view messages in their conversations"
  on "public"."messages"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.conversation_participants
  WHERE ((conversation_participants.conversation_id = messages.conversation_id) AND (conversation_participants.user_id = auth.uid())))));



  create policy "Public profiles are viewable by everyone"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Users can insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can delete their own interests"
  on "public"."user_interests"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can insert their own interests"
  on "public"."user_interests"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view all user interests"
  on "public"."user_interests"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_new_message();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


