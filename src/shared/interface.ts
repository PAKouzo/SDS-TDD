export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  role: "user" | "admin";
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  price: number;
  stockQuantity: number;
  description: string;
  categoryId: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

export interface CartItem {
  id: number;
  bookId: number;
  quantity: number;
}

export interface Order {
  id: number;
  bookId: number;
  quantity: number;
}

export interface Payment {
  id: number;
  orderId: number;
  method: "credit_card" | "paypal" | "bank_transfer";
  amount: number;
  status: "pending" | "completed" | "failed";
}

export interface Review {
  id: number;
  userId: number;
  bookId: number;
  rating: number;
  comment: string;
  createdAt: Date;
}
