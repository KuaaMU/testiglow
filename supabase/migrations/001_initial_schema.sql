-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro')),
  paddle_customer_id text,
  paddle_subscription_id text,
  testimonial_count int default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Collection forms
create table public.forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  slug text unique not null,
  headline text default 'Share your experience with us',
  description text,
  questions jsonb default '[]'::jsonb,
  brand_color text default '#6366f1',
  logo_url text,
  thank_you_message text default 'Thank you for your feedback!',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Testimonials
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  author_name text not null,
  author_email text,
  author_title text,
  author_avatar_url text,
  author_company text,
  content text not null,
  rating int check (rating between 1 and 5),
  video_url text,
  ai_summary text,
  ai_tags text[],
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Widgets
create table public.widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  type text default 'wall' check (type in ('wall', 'carousel', 'badge')),
  config jsonb default '{"theme":"light","columns":3,"max_items":12,"show_rating":true,"show_avatar":true,"show_date":false,"border_radius":8,"background_color":"#ffffff"}'::jsonb,
  testimonial_ids uuid[],
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.testimonials enable row level security;
alter table public.widgets enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Forms policies
create policy "Users can view own forms" on public.forms
  for select using (auth.uid() = user_id);
create policy "Users can create forms" on public.forms
  for insert with check (auth.uid() = user_id);
create policy "Users can update own forms" on public.forms
  for update using (auth.uid() = user_id);
create policy "Users can delete own forms" on public.forms
  for delete using (auth.uid() = user_id);
create policy "Anyone can view active forms" on public.forms
  for select using (is_active = true);

-- Testimonials policies
create policy "Form owners can view testimonials" on public.testimonials
  for select using (auth.uid() = user_id);
create policy "Anyone can submit testimonials" on public.testimonials
  for insert with check (true);
create policy "Form owners can update testimonials" on public.testimonials
  for update using (auth.uid() = user_id);
create policy "Form owners can delete testimonials" on public.testimonials
  for delete using (auth.uid() = user_id);
create policy "Approved testimonials are public" on public.testimonials
  for select using (status = 'approved');

-- Widgets policies
create policy "Users can view own widgets" on public.widgets
  for select using (auth.uid() = user_id);
create policy "Users can create widgets" on public.widgets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own widgets" on public.widgets
  for update using (auth.uid() = user_id);
create policy "Users can delete own widgets" on public.widgets
  for delete using (auth.uid() = user_id);
create policy "Anyone can view widgets" on public.widgets
  for select using (true);

-- Indexes
create index idx_forms_user_id on public.forms(user_id);
create index idx_forms_slug on public.forms(slug);
create index idx_testimonials_form_id on public.testimonials(form_id);
create index idx_testimonials_user_id on public.testimonials(user_id);
create index idx_testimonials_status on public.testimonials(status);
create index idx_widgets_user_id on public.widgets(user_id);

-- Auto-update testimonial count
create or replace function public.update_testimonial_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles
    set testimonial_count = testimonial_count + 1
    where id = NEW.user_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles
    set testimonial_count = testimonial_count - 1
    where id = OLD.user_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_testimonial_change
  after insert or delete on public.testimonials
  for each row execute procedure public.update_testimonial_count();
