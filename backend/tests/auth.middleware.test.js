// tests/auth.middleware.test.js
process.env.NODE_ENV = "test";

const jwt = require("jsonwebtoken");
jest.mock("jsonwebtoken");

const { pool } = require("../config/db");
jest.mock("../config/db", () => ({
  pool: {
    execute: jest.fn(),
  },
}));

const { authenticateToken, requireRole } = require("../middleware/auth");

describe("AUTH MIDDLEWARE", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test("should reject missing token", async () => {
    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("should reject invalid token", async () => {
    req.headers.authorization = "Bearer badtoken";
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid");
    });

    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("should authenticate valid token", async () => {
    req.headers.authorization = "Bearer good";
    jwt.verify.mockReturnValue({ userId: 1 });

    pool.execute.mockResolvedValue([[{ id: 1, role: "user" }]]);

    await authenticateToken(req, res, next);
    expect(req.user.id).toBe(1);
    expect(next).toHaveBeenCalled();
  });

  test("should reject if user not found", async () => {
    req.headers.authorization = "Bearer good";
    jwt.verify.mockReturnValue({ userId: 1 });

    pool.execute.mockResolvedValue([[]]); // no user

    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  // requireRole
  test("requireRole: should allow correct role", () => {
    req.user.role = "admin";
    const middleware = requireRole(["admin", "manager"]);
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("requireRole: should reject wrong role", () => {
    req.user.role = "user";
    const middleware = requireRole(["admin"]);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
