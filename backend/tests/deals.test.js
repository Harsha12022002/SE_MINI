const request = require("supertest");
const express = require("express");

// Mock DB
jest.mock("../config/db", () => ({
  pool: { execute: jest.fn() }
}));

// Mock auth
jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, role: "user" };
    next();
  }
}));

// Mock BOTH access controls (fixes Contacts.js + Deals.js errors)
jest.mock("../middleware/accessControl", () => ({
  checkDealAccess: (req, res, next) => next(),
  checkContactAccess: (req, res, next) => next()
}));

const { pool } = require("../config/db");
const dealsRouter = require("../routes/deals");

const app = express();
app.use(express.json());
app.use("/api/deals", dealsRouter);

describe("DEALS ROUTES – FULL COVERAGE", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET /api/deals", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ id: 1, title: "Deal A" }]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const res = await request(app).get("/api/deals");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/deals/:id", async () => {
    pool.execute.mockResolvedValueOnce([[{ id: 1, title: "X" }]]);
    const res = await request(app).get("/api/deals/1");
    expect(res.statusCode).toBe(200);
  });

  test("POST /api/deals", async () => {
    pool.execute
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockResolvedValueOnce([[{ id: 10, title: "New Deal" }]]);

    const res = await request(app)
      .post("/api/deals")
      .send({ title: "New Deal", stage_id: 1 });

    expect(res.statusCode).toBe(201);
  });

  test("PUT /api/deals/1", async () => {
    pool.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ id: 1, title: "Updated" }]]);

    const res = await request(app)
      .put("/api/deals/1")
      .send({ title: "Updated" });

    expect(res.statusCode).toBe(200);
  });

  test("DELETE /api/deals/1", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete("/api/deals/1");
    expect(res.statusCode).toBe(200);
  });
});
