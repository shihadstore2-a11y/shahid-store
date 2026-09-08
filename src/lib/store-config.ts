/**
 * إعدادات المتجر المتعدد ومعرّف المتجر الثابت
 * Multi-Tenant Store Configuration
 */

export const DEFAULT_SHAHID_STORE_ID = '7a3c8e14-6b92-4f8e-9d21-4c5e7b8a9f01';

export const STORE_ID = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_ID) ||
  (typeof process !== 'undefined' && (process.env?.STORE_ID || process.env?.VITE_STORE_ID)) ||
  DEFAULT_SHAHID_STORE_ID;
