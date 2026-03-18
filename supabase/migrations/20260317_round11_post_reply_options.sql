alter table public.threads
  add column if not exists reply_audience text not null default 'everyone';

alter table public.threads
  add column if not exists review_replies boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'threads_reply_audience_check'
  ) then
    alter table public.threads
      add constraint threads_reply_audience_check
      check (reply_audience in ('everyone', 'followers', 'following', 'mentioned'));
  end if;
end $$;

comment on column public.threads.reply_audience is 'Who can reply/quote this thread: everyone, followers, following, mentioned';
comment on column public.threads.review_replies is 'Reserved for future moderation flow; currently always false from UI';
