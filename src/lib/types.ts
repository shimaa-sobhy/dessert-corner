export interface Category {
  slug: string;
  name: string;
  image: string;
  description: string;
}

export interface NutritionInfo {
  calories: number;
  fat: string;
  sugar: string;
  protein: string;
  servingSize: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: string;
  ingredients: string[];
  nutrition: NutritionInfo;
  deliveryInfo: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  tags: string[];
}

export interface Article {
  slug: string;
  title: string;
  category: string;
  cover: string;
  excerpt: string;
  content: string[];
  author: string;
  date: string;
  readTime: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  group: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  phone: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  address: Address;
  deliveryMethod: 'standard' | 'express';
  paymentMethod: 'card' | 'cod';
}

export interface User {
  name: string;
  email: string;
  phone?: string;
  password: string;
}
