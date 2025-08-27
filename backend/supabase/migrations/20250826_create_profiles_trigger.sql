-- Create function to auto-create profile rows when a new auth user is created
-- Ensures a unique username using raw_user_meta_data.username or email prefix as base

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  base_username text;
  candidate text;
  attempts int := 0;
begin
  -- Derive base username from signup metadata or email prefix
  base_username := coalesce(
    nullif(trim(both from (new.raw_user_meta_data->>'username')), ''),
    split_part(new.email, '@', 1),
    'user'
  );

  -- Sanitize: lowercase, allow [a-z0-9_], collapse underscores, trim, limit length
  base_username := lower(base_username);
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '_', 'g');
  base_username := regexp_replace(base_username, '_+', '_', 'g');
  base_username := regexp_replace(base_username, '^_+|_+$', '');
  if length(base_username) = 0 then
    base_username := 'user';
  end if;
  base_username := left(base_username, 20);

  candidate := base_username;

  -- Try to insert profile; on conflict, append random 4-digit suffix and retry
  loop
    begin
      insert into public.profiles (id, username)
      values (new.id, candidate);
      exit; -- success
    exception when unique_violation then
      attempts := attempts + 1;
      if attempts > 5 then
        -- final fallback uses first 6 chars of UUID
        candidate := base_username || substring(replace(new.id::text, '-', '') for 6);
      else
        candidate := base_username || to_char((1000 + floor(random()*9000))::int, 'FM9999');
      end if;
      -- retry
    end;
  end loop;

  return new;
end;
$$;

-- Create trigger to call the function after a new user is inserted into auth.users
-- Drop existing trigger first to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
