drop policy "create conversations for own connections" on "public"."conversations";

drop policy "read own conversations" on "public"."conversations";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.user_owns_connection(conn_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_id uuid;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM connections 
        WHERE id = conn_id 
        AND (sender_id = user_id OR receiver_id = user_id)
    );
END;
$function$
;


  create policy "create conversations for own connections"
  on "public"."conversations"
  as permissive
  for insert
  to authenticated
with check (public.user_owns_connection(connection_id));



  create policy "read own conversations"
  on "public"."conversations"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.connections
  WHERE ((connections.id = conversations.connection_id) AND ((connections.sender_id = auth.uid()) OR (connections.receiver_id = auth.uid()))))));



