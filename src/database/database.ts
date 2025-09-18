import {
  Book,
  Cart,
  Category,
  Order,
  Payment,
  Review,
  User,
} from "../shared/interface";

export class Database {
  private users: User[] = [];
  private categories: Category[] = [];
  private books: Book[] = [];
  private carts: Cart[] = [];
  private orders: Order[] = [];
  private payments: Payment[] = [];
  private reviews: Review[] = [];
  private nextId = 1;

  // handle ID
  getNextId(): number {
    return this.nextId++;
  }

  // create user
  createUser(userData: Omit<User, "id">): User {
    const user: User = { id: this.getNextId(), ...userData };
    this.users.push(user);
    return user;
  }

  // get user by id
  getUserById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  // get user by username
  getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username);
  }

  // create category
  createCategory(categoryData: Omit<Category, "id">): Category {
    const category: Category = { id: this.getNextId(), ...categoryData };
    this.categories.push(category);
    return category;
  }

  // get category by id
  getCategoryById(id: number): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  // create book
  createBook(bookData: Omit<Book, "id">): Book {
    const book: Book = { id: this.getNextId(), ...bookData };
    this.books.push(book);
    return book;
  }

  //get book by id
  getBookById(id: number): Book | undefined {
    return this.books.find((b) => b.id === id);
  }

  // update book stock
  updateBookStock(bookId: number, newStock: number): boolean {
    const book = this.getBookById(bookId);
    if (book) {
      book.stockQuantity = newStock;
      return true;
    }
    return false;
  }

  // create cart
  createCart(userId: number): Cart {
    const cart: Cart = { id: this.getNextId(), userId, items: [] };
    this.carts.push(cart);
    return cart;
  }

  // get cart by user_id
  getCartByUserId(userId: number): Cart | undefined {
    return this.carts.find((c) => c.userId === userId);
  }

  // update cart
  updateCart(cart: Cart): void {
    const index = this.carts.findIndex((c) => c.id === cart.id);
    if (index >= 0) {
      this.carts[index] = cart;
    }
  }

  // create order
  createOrder(orderData: Omit<Order, "id">): Order {
    const order: Order = { id: this.getNextId(), ...orderData };
    this.orders.push(order);
    return order;
  }

  // get order by id
  getOrderById(id: number): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  // create payment method
  createPayment(paymentData: Omit<Payment, "id">): Payment {
    const payment: Payment = { id: this.getNextId(), ...paymentData };
    this.payments.push(payment);
    return payment;
  }

  // update status of payment
  updatePaymentStatus(paymentId: number, status: Payment["status"]): boolean {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (payment) {
      payment.status = status;
      return true;
    }
    return false;
  }

  // create review
  createReview(reviewData: Omit<Review, "id" | "createdAt">): Review {
    const review: Review = {
      id: this.getNextId(),
      ...reviewData,
      createdAt: new Date(),
    };
    this.reviews.push(review);
    return review;
  }

  // get reviews by book_id
  getReviewsByBookId(bookId: number): Review[] {
    return this.reviews.filter((r) => r.bookId === bookId);
  }

  // Clear all data
  clear(): void {
    this.users = [];
    this.categories = [];
    this.books = [];
    this.carts = [];
    this.orders = [];
    this.payments = [];
    this.reviews = [];
    this.nextId = 1;
  }
}
