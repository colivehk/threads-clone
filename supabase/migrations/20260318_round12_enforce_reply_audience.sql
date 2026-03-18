create or replace function public.thread_mentions_username(thread_content text, username text)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized_content text := lower(coalesce(thread_content, ''));
  normalized_username text := lower(coalesce(username, ''));
begin
  if normalized_username = '' then
    return false;
  end if;

  return normalized_content ~ ('(^|[^a-z0-9_])@' || regexp_replace(normalized_username, '([^a-z0-9_])', '\\\1', 'g') || '([^a-z0-9_]|$)');
end;
$$;

create or replace function public.enforce_thread_reply_permissions()
returns trigger
language plpgsql
as $$
declare
  parent_author text;
  parent_reply_audience text;
begin
  if new.parent_id is null then
    return new;
  end if;

  select author_name, coalesce(reply_audience, 'everyone')
  into parent_author, parent_reply_audience
  from public.threads
  where id = new.parent_id;

  if parent_author is null then
    return new;
  end if;

  if lower(coalesce(new.author_name, '')) = lower(parent_author) then
    return new;
  end if;

  if parent_reply_audience = 'everyone' then
    return new;
  elsif parent_reply_audience = 'followers' then
    if exists (
      select 1 from public.follows
      where lower(follower) = lower(coalesce(new.author_name, ''))
        and lower(following) = lower(parent_author)
    ) then
      return new;
    end if;
  elsif parent_reply_audience = 'following' then
    if exists (
      select 1 from public.follows
      where lower(follower) = lower(parent_author)
        and lower(following) = lower(coalesce(new.author_name, ''))
    ) then
      return new;
    end if;
  elsif parent_reply_audience = 'mentioned' then
    if exists (
      select 1 from public.threads parent_thread
      where parent_thread.id = new.parent_id
        and public.thread_mentions_username(parent_thread.content, new.author_name)
    ) then
      return new;
    end if;
  end if;

  raise exception 'reply_not_allowed';
end;
$$;

drop trigger if exists trg_enforce_thread_reply_permissions on public.threads;
create trigger trg_enforce_thread_reply_permissions
before insert on public.threads
for each row
execute function public.enforce_thread_reply_permissions();
