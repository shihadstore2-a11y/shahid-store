export interface TrackingConfig {
  googleSiteVerification?: string | null;
  gtmId?: string | null;
  ga4MeasurementId?: string | null;
  googleAdsId?: string | null;
  googleAdsPurchaseLabel?: string | null;
  metaPixelId?: string | null;
  snapchatPixelId?: string | null;
  tiktokPixelId?: string | null;
}

export interface TrackingProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  currency?: string;
  quantity?: number;
}

export interface TrackingOrder {
  orderNumber: string;
  orderId?: string;
  total: number;
  currency?: string;
  items?: TrackingProduct[];
  customerEmail?: string;
  customerPhone?: string;
}
