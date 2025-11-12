const express = require("express");
const request = require("supertest");

describe("Auth API (Mocked)", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // ✅ Mock POST /api/auth/login route
    app.post("/api/auth/login", (req, res) => {
      const { email, password } = req.body;

      if (email === "test@example.com" && password === "123456") {
        return res.status(200).json({
          token: "mocked-jwt-token",
          message: "Login successful"
        });
      }

      res.status(401).json({
        message: "Invalid credentials"
      });
    });
  });

  test("should return 401 for invalid login credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "fake@email.com", password: "wrongpass" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid credentials");
  });

  test("should login successfully with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
