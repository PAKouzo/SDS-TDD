// tests/book-shopping.test.ts
import { test, expect } from "@playwright/test";
import { Database } from "../src/database/database";
import { Book, Category, User } from "../src/shared/interface";
import { BookShoppingService } from "../src/services/service";

// Test setup
let db: Database;
let service: BookShoppingService;
let testUser: User;
let testCategory: Category;
let testBook: Book;

test.beforeEach(async () => {
  db = new Database();
  service = new BookShoppingService(db);

  // Setup test data
  testCategory = service.createCategory({
    name: "Science",
    description: "Science books",
  });

  testBook = service.createBook({
    title: "Test Book",
    author: "Test Author",
    publisher: "Test Publisher",
    isbn: "1234567890",
    price: 10,
    stockQuantity: 10,
    description: "A test book",
    categoryId: testCategory.id,
  });

  testUser = service.registerUser({
    username: "testUser",
    password: "12345678",
    email: "test@example.com",
    fullName: "Test User",
    address: "123 Test St",
    phone: "555-1234",
    role: "user",
  });
});

test.afterEach(async () => {
  db.clear();
});

test.describe("Test for user", () => {
  test("Register user successfully", async () => {
    const newUser = service.registerUser({
      username: "newUser",
      password: "12345678",
      email: "newuser@example.com",
      fullName: "New User",
      address: "456 New St",
      phone: "555-5678",
      role: "user",
    });

    expect(newUser.id).toBeGreaterThan(0);
    expect(newUser.username).toBe("newUser");
    expect(newUser.email).toBe("newuser@example.com");
  });

  test("Username of user has already existed", async () => {
    expect(() => {
      service.registerUser({
        username: "testUser",
        password: "12345678",
        email: "duplicate@example.com",
        fullName: "Duplicate User",
        address: "789 Duplicate St",
        phone: "555-9999",
        role: "user",
      });
    }).toThrow("Username already exists!");
  });

  test("Login successfully", async () => {
    const loggedInUser = service.loginUser("testUser", "12345678");
    expect(loggedInUser).not.toBeNull();
    expect(loggedInUser?.username).toBe("testUser");
  });

  test("Login failed! Please try again!", async () => {
    const loggedInUser = service.loginUser("testUser", "123456789");
    expect(loggedInUser).toBeNull();
  });
});

test.describe("Test for category", () => {
  test("Create category successfully", async () => {
    const category = service.createCategory({
      name: "Math",
      description: "Math books",
    });

    expect(category.id).toBeGreaterThan(0);
    expect(category.name).toBe("Math");
    expect(category.description).toBe("Math books");
  });
});

test.describe("Test for book", () => {
  test("Create book successfully", async () => {
    const book = service.createBook({
      title: "Another Book",
      author: "Another Author",
      publisher: "Another Publisher",
      isbn: "0987654321",
      price: 29.99,
      stockQuantity: 5,
      description: "Another test book",
      categoryId: testCategory.id,
    });

    expect(book.id).toBeGreaterThan(0);
    expect(book.title).toBe("Another Book");
    expect(book.price).toBe(29.99);
    expect(book.stockQuantity).toBe(5);
  });

  test("Create book but category is invalid", async () => {
    expect(() => {
      service.createBook({
        title: "Hieu Book",
        author: "Hieu Author",
        publisher: "Hieu Publisher",
        isbn: "1111111111",
        price: 10,
        stockQuantity: 3,
        description: "Hieu book",
        categoryId: 999,
      });
    }).toThrow("Category not found");
  });
});

test.describe("Test for cart", () => {
  test("Add to cart successfully", async () => {
    const result = service.addToCart(testUser.id, testBook.id, 2);
    expect(result).toBe(true);

    const cart = db.getCartByUserId(testUser.id);
    expect(cart).not.toBeUndefined();
    expect(cart!.items.length).toBe(1);
    expect(cart!.items[0].bookId).toBe(testBook.id);
    expect(cart!.items[0].quantity).toBe(2);
  });

  test("Case insufficient stock quantity", async () => {
    expect(() => {
      service.addToCart(testUser.id, testBook.id, 15);
    }).toThrow("Insufficient stock quantity");
  });

  test("Add a item many times with different quantities", async () => {
    service.addToCart(testUser.id, testBook.id, 2);
    service.addToCart(testUser.id, testBook.id, 3);

    const cart = db.getCartByUserId(testUser.id);
    expect(cart!.items.length).toBe(1);
    expect(cart!.items[0].quantity).toBe(5);
  });

  test("Total quantity to exceed stock when accumulating", async () => {
    service.addToCart(testUser.id, testBook.id, 6);

    expect(() => {
      service.addToCart(testUser.id, testBook.id, 5);
    }).toThrow("Total quantity exceeds stock quantity");
  });

  test("Add book that is not existed", async () => {
    expect(() => {
      service.addToCart(testUser.id, 999, 1);
    }).toThrow("Book not found!");
  });
});

test.describe("Test checkout", () => {
  test.beforeEach(async () => {
    service.addToCart(testUser.id, testBook.id, 3);
  });

  test("Checkout successfully", async () => {
    const { orders, totalAmount } = service.checkout(testUser.id);

    expect(orders.length).toBe(1);
    expect(orders[0].bookId).toBe(testBook.id);
    expect(orders[0].quantity).toBe(3);
    expect(totalAmount).toBe(30);

    const book = db.getBookById(testBook.id);
    expect(book!.stockQuantity).toBe(7);

    const cart = db.getCartByUserId(testUser.id);
    expect(cart!.items.length).toBe(0);
  });

  test("Checkout with empty card", async () => {
    const cart = db.getCartByUserId(testUser.id);
    cart!.items = [];
    db.updateCart(cart!);

    expect(() => {
      service.checkout(testUser.id);
    }).toThrow("Cart is empty!");
  });

  test("Can not checkout b/c insufficient stock", async () => {
    db.updateBookStock(testBook.id, 2);

    expect(() => {
      service.checkout(testUser.id);
    }).toThrow("Insufficient stock for book: Test Book");
  });
});

test.describe("Test order", () => {
  let orderId: number;

  test.beforeEach(async () => {
    service.addToCart(testUser.id, testBook.id, 2);
    const { orders } = service.checkout(testUser.id);
    orderId = orders[0].id;
  });

  test("Cancel order and restore", async () => {
    const result = service.cancelOrder(orderId);
    expect(result).toBe(true);

    const book = db.getBookById(testBook.id);
    expect(book!.stockQuantity).toBe(10);
  });

  test("Dont exist order", async () => {
    expect(() => {
      service.cancelOrder(999);
    }).toThrow("Order not found!");
  });
});

test.describe("Test payment", () => {
  let orderId: number;

  test.beforeEach(async () => {
    service.addToCart(testUser.id, testBook.id, 1);
    const { orders } = service.checkout(testUser.id);
    orderId = orders[0].id;
  });

  test("Payment for valid order", async () => {
    const payment = service.processPayment(orderId, "credit_card", 19.99);

    expect(payment.id).toBeGreaterThan(0);
    expect(payment.orderId).toBe(orderId);
    expect(payment.method).toBe("credit_card");
    expect(payment.amount).toBe(19.99);
    expect(payment.status).toBe("pending");
  });

  test("Payment for invalid order", async () => {
    expect(() => {
      service.processPayment(999, "credit_card", 19.99);
    }).toThrow("Order not found!");
  });
});

test.describe("Test review", () => {
  test("Add review successfully", async () => {
    const review = service.createReview(
      testUser.id,
      testBook.id,
      5,
      "Great book!"
    );

    expect(review.id).toBeGreaterThan(0);
    expect(review.userId).toBe(testUser.id);
    expect(review.bookId).toBe(testBook.id);
    expect(review.rating).toBe(5);
    expect(review.comment).toBe("Great book!");
    expect(review.createdAt).toBeInstanceOf(Date);
  });

  test("Can not add review b/c invalid rating", async () => {
    expect(() => {
      service.createReview(testUser.id, testBook.id, 6, "Invalid rating");
    }).toThrow("Rating must be between 1 and 5");

    expect(() => {
      service.createReview(testUser.id, testBook.id, 0, "Invalid rating");
    }).toThrow("Rating must be between 1 and 5");
  });

  test("Can not add review b/c the book is not exist", async () => {
    expect(() => {
      service.createReview(testUser.id, 999, 5, "Non-existent book");
    }).toThrow("Book not found");
  });

  test("Login for adding review", async () => {
    expect(() => {
      service.createReview(999, testBook.id, 5, "Non-existent user");
    }).toThrow("User not found!");
  });

  test("Get review for book", async () => {
    service.createReview(testUser.id, testBook.id, 5, "Great book!");
    service.createReview(testUser.id, testBook.id, 4, "Good book!");

    const reviews = service.getBookReviews(testBook.id);
    expect(reviews.length).toBe(2);
    expect(reviews[0].rating).toBe(5);
    expect(reviews[1].rating).toBe(4);
  });
});

test.describe("Integration Tests", () => {
  test("Handle complete shopping flow", async () => {
    const book2 = service.createBook({
      title: "Second Book",
      author: "Second Author",
      publisher: "Second Publisher",
      isbn: "2222222222",
      price: 10,
      stockQuantity: 8,
      description: "Second test book",
      categoryId: testCategory.id,
    });

    service.addToCart(testUser.id, testBook.id, 2);
    service.addToCart(testUser.id, book2.id, 1);

    const { orders, totalAmount } = service.checkout(testUser.id);
    expect(orders.length).toBe(2);
    expect(totalAmount).toBe(30);

    const payment = service.processPayment(orders[0].id, "paypal", 39.98);
    expect(payment.method).toBe("paypal");

    const review = service.createReview(
      testUser.id,
      testBook.id,
      5,
      "Excellent book!"
    );
    expect(review.rating).toBe(5);

    const updatedBook1 = db.getBookById(testBook.id);
    const updatedBook2 = db.getBookById(book2.id);
    expect(updatedBook1!.stockQuantity).toBe(8);
    expect(updatedBook2!.stockQuantity).toBe(7);
  });

  test("Handle stock validation across multiple users", async () => {
    const user2 = service.registerUser({
      username: "IPMAC",
      password: "12345678",
      email: "user2@example.com",
      fullName: "User Two",
      address: "456 Second St",
      phone: "555-5678",
      role: "user",
    });

    service.addToCart(testUser.id, testBook.id, 6);
    service.addToCart(user2.id, testBook.id, 5);

    const { orders: orders1 } = service.checkout(testUser.id);
    expect(orders1.length).toBe(1);

    expect(() => {
      service.checkout(user2.id);
    }).toThrow("Insufficient stock for book: Test Book");

    const book = db.getBookById(testBook.id);
    expect(book!.stockQuantity).toBe(4);
  });
});
