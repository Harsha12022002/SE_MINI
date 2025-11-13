// tests/accessControl.test.js
process.env.NODE_ENV = "test";

// ---- MOCK DB FIRST (before loading middleware) ----
jest.mock("../config/db", () => ({
  pool: {
    execute: jest.fn(),
  },
}));

const { pool } = require("../config/db");

// ---- NOW load middleware, DB is already mocked ----
const {
  checkDealAccess,
  checkContactAccess,
} = require("../middleware/accessControl");

describe("ACCESS CONTROL", () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {}, user: { id: 1, role: "user" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    pool.execute.mockReset();
  });

  // ---------------- DEAL ACCESS ----------------

  test("Admin should always pass deal access", async () => {
    req.user.role = "admin";
    await checkDealAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("User should access own deal", async () => {
    req.params.id = 10;

    pool.execute.mockResolvedValue([[{ id: 10, assigned_to: 1 }]]);

    await checkDealAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("User should be denied for others' deal", async () => {
    req.params.id = 10;

    pool.execute.mockResolvedValue([[]]); // no rows found

    await checkDealAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  // ---------------- CONTACT ACCESS ----------------

  test("Admin should always pass contact access", async () => {
    req.user.role = "admin";
    await checkContactAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("User should access own contact", async () => {
    req.params.id = 5;

    pool.execute.mockResolvedValue([[{ id: 5, assigned_to: 1 }]]);

    await checkContactAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("User should be denied for others' contact", async () => {
    req.params.id = 5;

    pool.execute.mockResolvedValue([[]]); // forbidden

    await checkContactAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
