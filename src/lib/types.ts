export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  icon_key: string | null;
  gradient_key: string | null;
};

export type Product = {
  id: string;
  slug: string;
  category_id: string | null;
  name_ar: string;
  description: string | null;
  features: string[];
  compatibility: string[];
  base_price: number;
  sale_price: number | null;
  currency: string;
  image_urls: string[];
  rating: number;
  sales_count: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  duration_months: number | null;
  sort_order: number;
  icon_key: string | null;
  gradient_key: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  discount_percent: number;
  valid_until: string | null;
  applies_to_duration_min: number;
  is_active: boolean;
};
