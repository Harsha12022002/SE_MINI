const express = require("express");
const request = require("supertest");

describe("Contacts API (Mocked)", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // ✅ Mock GET /api/contacts
    app.get("/api/contacts", (req, res) => {
      res.status(200).json([
        { id: 1, name: "Harsha", email: "harsha@example.com", phone: "9876543210" }
      ]);
    });

    // ✅ Mock POST /api/contacts
    app.post("/api/contacts", (req, res) => {
      const { name, email, phone } = req.body;
      if (!name || !email || !phone)
        return res.status(400).json({ message: "Missing fields" });
      res.status(201).json({ id: 2, name, email, phone });
    });
  });

  test("should get all contacts", async () => {
    const res = await request(app).get("/api/contacts");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("name");
  });

  test("should create a new contact", async () => {
    const res = await request(app)
      .post("/api/contacts")
      .send({
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210"
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});
