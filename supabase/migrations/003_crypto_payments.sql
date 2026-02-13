-- Crypto payment records
create table public.crypto_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  amount decimal not null default 19,
  currency text not null default 'USDT',
  chain text not null default 'TRC-20',
  tx_hash text,
  wallet_address text not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz default now(),
  confirmed_at timestamptz
);

-- RLS
alter table public.crypto_payments enable row level security;

create policy "Users can view own payments" on public.crypto_payments
  for select using (auth.uid() = user_id);
create policy "Users can submit payments" on public.crypto_payments
  for insert with check (auth.uid() = user_id);

-- When admin confirms a payment, auto-upgrade the user to pro
create or replace function public.handle_crypto_payment_confirmed()
returns trigger as $$
begin
  if NEW.status = 'confirmed' and (OLD.status is null or OLD.status <> 'confirmed') then
    update public.profiles
    set plan = 'pro'
    where id = NEW.user_id;

    NEW.confirmed_at = now();
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_crypto_payment_status_change
  before update on public.crypto_payments
  for each row execute procedure public.handle_crypto_payment_confirmed();
