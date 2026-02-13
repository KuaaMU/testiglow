-- Migration: Rename Paddle columns to Lemon Squeezy
-- Run this in Supabase SQL Editor after the initial schema

alter table public.profiles rename column paddle_customer_id to lemon_customer_id;
alter table public.profiles rename column paddle_subscription_id to lemon_subscription_id;
