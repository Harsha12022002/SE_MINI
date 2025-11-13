//require("./coverage-bootstrap"); // ✅ Add this line on top
//
//const express = require("express");
//const request = require("supertest");
//
//describe("Auth API (Mocked)", () => {
//  let app;
//
//  beforeAll(() => {
//    app = express();
//    app.use(express.json());
//
//    app.post("/api/auth/login", (req, res) => {
//      const { email, password } = req.body;
//
//      if (email === "test@example.com" && password === "123456") {
//        return res.status(200).json({
//          token: "mocked-jwt-token",
//          message: "Login successful"
//        });
//      }
//
//      res.status(401).json({ message: "Invalid credentials" });
//    });
//
//    app.post("/api/auth/register", (req, res) => {
//      const { name, email, password } = req.body;
//
//      if (!name || !email || !password) {
//        return res.status(400).json({ message: "Missing required fields" });
//      }
//
//      if (email === "existing@example.com") {
//        return res.status(403).json({ message: "User already exists" });
//      }
//
//      return res.status(201).json({
//        message: "User registered successfully",
//        user: { id: 1, name, email }
//      });
//    });
//  });
//
//  test("should return 401 for invalid login credentials", async () => {
//    const res = await request(app)
//      .post("/api/auth/login")
//      .send({ email: "fake@email.com", password: "wrongpass" });
//
//    expect(res.statusCode).toBe(401);
//    expect(res.body).toHaveProperty("message", "Invalid credentials");
//  });
//
//  test("should login successfully with valid credentials", async () => {
//    const res = await request(app)
//      .post("/api/auth/login")
//      .send({ email: "test@example.com", password: "123456" });
//
//    expect(res.statusCode).toBe(200);
//    expect(res.body).toHaveProperty("token");
//    expect(res.body).toHaveProperty("message", "Login successful");
//  });
//
//  test("should register user successfully", async () => {
//    const res = await request(app)
//      .post("/api/auth/register")
//      .send({
//        name: "NewUser",
//        email: "newuser@example.com",
//        password: "pass123"
//      });
//
//    expect(res.statusCode).toBe(201);
//    expect(res.body).toHaveProperty("user");
//  });
//});



/**
 * AUTH ROUTES TEST FILE
 * 
 * Covers:
 *  - POST /api/auth/register
 *  - POST /api/auth/login
 *  - GET  /api/auth/me
 *  - GET  /api/auth/profile
 *  - POST /api/auth/logout
 */

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../server");

jest.mock("../config/db", () => {
  return {
    pool: {
      execute: jest.fn()
    },
    testConnection: jest.fn()
  };
});

const { pool } = require("../config/db");

const jwt = require("jsonwebtoken");
jest.mock("jsonwebtoken");

const bcrypt = require("bcryptjs");
jest.mock("bcryptjs");

describe("AUTH ROUTES", () => {

  // ---------------------------
  // REGISTER
  // ---------------------------
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      pool.execute
        .mockResolvedValueOnce([[]])                     // no existing user
        .mockResolvedValueOnce([{ insertId: 1 }]);       // insert result

      bcrypt.hash.mockResolvedValue("hashedpwd");
      jwt.sign.mockReturnValue("fake-jwt-token");

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "harsha",
          email: "harsha@gmail.com",
          password: "123456"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBe("fake-jwt-token");
      expect(res.body.user.email).toBe("harsha@gmail.com");
    });

    it("should reject missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it("should reject if user exists", async () => {
      pool.execute.mockResolvedValueOnce([[{ id: 1 }]]); // existing user

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "harsha",
          email: "harsha@gmail.com",
          password: "123456"
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ---------------------------
  // LOGIN
  // ---------------------------
  describe("POST /api/auth/login", () => {
    it("should login user", async () => {
      pool.execute.mockResolvedValueOnce([[
        { id: 1, email: "harsha@gmail.com", username: "harsha", role: "user", password_hash: "hash" }
      ]]);

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake-login-token");

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "harsha@gmail.com",
          password: "123456"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBe("fake-login-token");
    });

    it("should reject invalid credentials", async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "wrong@gmail.com",
          password: "123456"
        });

      expect(res.statusCode).toBe(401);
    });
  });

  // ---------------------------
  // /me & /profile
  // ---------------------------
  describe("GET /api/auth/me", () => {
    it("should return user info", async () => {
      jwt.verify.mockReturnValue({ userId: 1 });
      pool.execute.mockResolvedValueOnce([[
        { id: 1, username: "harsha", email: "harsha@gmail.com", role: "user" }
      ]]);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer test-token");

      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe("harsha@gmail.com");
    });
  });

  describe("GET /api/auth/profile", () => {
    it("should return profile data", async () => {
      jwt.verify.mockReturnValue({ userId: 1 });
      pool.execute.mockResolvedValueOnce([[
        { id: 1, username: "harsha", email: "harsha@gmail.com", role: "user" }
      ]]);

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer test-token");

      expect(res.statusCode).toBe(200);
      expect(res.body.user.username).toBe("harsha");
    });
  });

  // ---------------------------
  // LOGOUT
  // ---------------------------
  describe("POST /api/auth/logout", () => {
    it("should logout", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Logout successful");
    });
  });

});
