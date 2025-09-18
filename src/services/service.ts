import { Database } from "../database/database";
import {
  Book,
  CartItem,
  Category,
  Order,
  Payment,
  Review,
  User,
} from "../shared/interface";

export class BookShoppingService {
  constructor(private db: Database) {}

  // register user
  registerUser(userData: Omit<User, "id">): User {
    const existingUser = this.db.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username already exists!");
    }
    return this.db.createUser(userData);
  }

  // login wihtout manage session
  loginUser(username: string, password: string): User | null {
    const user = this.db.getUserByUsername(username);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  // add cart (create if not exist)
  addToCart(userId: number, bookId: number, quantity: number): boolean {
    const book = this.db.getBookById(bookId);
    if (!book) {
      throw new Error("Book not found!");
    }

    if (quantity > book.stockQuantity) {
      throw new Error(`Insufficient stock quantity! In stock, just have ${book.stockQuantity}`);
    }

    let cart = this.db.getCartByUserId(userId);
    if (!cart) {
      cart = this.db.createCart(userId);
    }

    const existingItem = cart.items.find((item) => item.bookId === bookId);
    if (existingItem) {
      const totalQuantity = existingItem.quantity + quantity;
      if (totalQuantity > book.stockQuantity) {
        throw new Error("Total quantity exceeds stock quantity");
      }
      existingItem.quantity = totalQuantity;
    } else {
      const cartItem: CartItem = {
        id: this.db.getNextId(),
        bookId,
        quantity,
      };
      cart.items.push(cartItem);
    }

    this.db.updateCart(cart);
    return true;
  }

  // Checkout
  checkout(userId: number): { orders: Order[]; totalAmount: number } {
    const cart = this.db.getCartByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty!");
    }

    const orders: Order[] = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const book = this.db.getBookById(item.bookId);
      if (!book) {
        throw new Error(`Book with id ${item.bookId} not found`);
      }

      if (item.quantity > book.stockQuantity) {
        throw new Error(`Insufficient stock for book: ${book.title}! Just have ${book.stockQuantity}.`);
      }

      totalAmount += book.price * item.quantity;
    }

    for (const item of cart.items) {
      const book = this.db.getBookById(item.bookId)!;

      const order = this.db.createOrder({
        bookId: item.bookId,
        quantity: item.quantity,
      });
      orders.push(order);

      this.db.updateBookStock(item.bookId, book.stockQuantity - item.quantity);
    }

    cart.items = [];
    this.db.updateCart(cart);

    return { orders, totalAmount };
  }

  // Payment
  processPayment(
    orderId: number,
    method: Payment["method"],
    amount: number
  ): Payment {
    const order = this.db.getOrderById(orderId);
    if (!order) {
      throw new Error("Order not found!");
    }

    const payment = this.db.createPayment({
      orderId,
      method,
      amount,
      status: "pending",
    });

    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate
      this.db.updatePaymentStatus(payment.id, success ? "completed" : "failed");
    }, 1000);

    return payment;
  }

  // Cancel order (restore stock)
  cancelOrder(orderId: number): boolean {
    const order = this.db.getOrderById(orderId);
    if (!order) {
      throw new Error("Order not found!");
    }

    const book = this.db.getBookById(order.bookId);
    if (!book) {
      throw new Error("Book not found!");
    }

    this.db.updateBookStock(order.bookId, book.stockQuantity + order.quantity);

    return true;
  }

  // Create review 
  createReview(
    userId: number,
    bookId: number,
    rating: number,
    comment: string
  ): Review {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const book = this.db.getBookById(bookId);
    if (!book) {
      throw new Error("Book not found!");
    }

    const user = this.db.getUserById(userId);
    if (!user) {
      throw new Error("User not found!");
    }

    return this.db.createReview({
      userId,
      bookId,
      rating,
      comment,
    });
  }

  // Get book reviews
  getBookReviews(bookId: number): Review[] {
    return this.db.getReviewsByBookId(bookId);
  }

  // create book
  createBook(bookData: Omit<Book, "id">): Book {
    const category = this.db.getCategoryById(bookData.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    return this.db.createBook(bookData);
  }

  // Create Category
  createCategory(categoryData: Omit<Category, "id">): Category {
    return this.db.createCategory(categoryData);
  }
}
