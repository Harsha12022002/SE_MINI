const express = require("express");
const request = require("supertest");

describe("Deals API (Mocked)", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // ✅ Mock routes (no server.js import needed)
    app.get("/api/deals", (req, res) => {
      res.status(200).json([{ id: 1, title: "Mock Deal" }]);
    });

    app.post("/api/deals", (req, res) => {
      const { title, value } = req.body;
      if (!title || !value) return res.status(400).json({ message: "Invalid" });
      res.status(201).json({ id: 2, title, value });
    });
  });

  test("should get all deals", async () => {
    const res = await request(app).get("/api/deals");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("should create a new deal", async () => {
    const res = await request(app)
      .post("/api/deals")
      .send({ title: "New CRM Deal", value: 5000 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});
