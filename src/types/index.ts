export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  testimonial_count: number;
  created_at: string;
}

export interface Form {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  headline: string | null;
  description: string | null;
  questions: Question[];
  brand_color: string;
  logo_url: string | null;
  thank_you_message: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'rating';
  required: boolean;
}

export interface Testimonial {
  id: string;
  form_id: string;
  user_id: string;
  author_name: string;
  author_email: string | null;
  author_title: string | null;
  author_avatar_url: string | null;
  author_company: string | null;
  content: string;
  rating: number | null;
  video_url: string | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at: string;
}

export interface Widget {
  id: string;
  user_id: string;
  name: string;
  type: 'wall' | 'carousel' | 'badge';
  config: WidgetConfig;
  testimonial_ids: string[] | null;
  created_at: string;
}

export interface WidgetConfig {
  theme: 'light' | 'dark';
  columns: number;
  max_items: number;
  show_rating: boolean;
  show_avatar: boolean;
  show_date: boolean;
  border_radius: number;
  background_color: string;
}

export const FREE_TESTIMONIAL_LIMIT = 15;
export const PRO_PRICE_MONTHLY = 19;
