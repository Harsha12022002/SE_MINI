process.env.NODE_ENV = "test";

const request = require("supertest");
const express = require("express");

jest.mock("../config/db", () => ({
  pool: { execute: jest.fn() }
}));
const { pool } = require("../config/db");

// mock json2csv
jest.mock("json2csv", () => {
  return {
    Parser: jest.fn().mockImplementation(() => ({
      parse: () => "csv-data"
    }))
  };
});

// mock auth → always authenticated
jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, role: "user" };
    next();
  }
}));

const reportsRouter = require("../routes/reports");
const app = express();
app.use(express.json());
app.use("/api/reports", reportsRouter);

describe("REPORT ROUTES – FULL COVERAGE BOOST", () => {
  beforeEach(() => jest.clearAllMocks());

  // ===========================
  // GET /kpis
  // ===========================
  test("GET /kpis → success", async () => {
    pool.execute.mockResolvedValueOnce([[{ kpi_name: "total_deals", value: 10 }]]);
    const res = await request(app).get("/api/reports/kpis");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("GET /kpis → DB error", async () => {
    pool.execute.mockRejectedValueOnce(new Error("fail"));
    const res = await request(app).get("/api/reports/kpis");
    expect(res.statusCode).toBe(500);
  });

  // ===========================
  // GET /forecast
  // ===========================
  test("GET /forecast → success", async () => {
    pool.execute.mockResolvedValueOnce([[{ month: "2025-01", forecasted_value: 200 }]]);
    const res = await request(app).get("/api/reports/forecast?months=2");
    expect(res.statusCode).toBe(200);
  });

  test("GET /forecast → DB error", async () => {
    pool.execute.mockRejectedValueOnce(new Error("fail"));
    const res = await request(app).get("/api/reports/forecast");
    expect(res.statusCode).toBe(500);
  });

  // ===========================
  // GET /export/deals
  // ===========================
  test("GET /export/deals → success CSV", async () => {
    pool.execute.mockResolvedValueOnce([[{ title: "Deal A" }]]);

    const res = await request(app).get("/api/reports/export/deals");

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toBe("csv-data");
  });

  test("GET /export/deals → DB error", async () => {
    pool.execute.mockRejectedValueOnce(new Error("fail"));

    const res = await request(app).get("/api/reports/export/deals");
    expect(res.statusCode).toBe(500);
  });

  // ===========================
  // GET /insights
  // ===========================
  test("GET /insights → success", async () => {
    pool.execute.mockResolvedValueOnce([[{ id: 1, stage_name: "Stage" }]]);
    const res = await request(app).get("/api/reports/insights?stage_id=2");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("GET /insights → DB error", async () => {
    pool.execute.mockRejectedValueOnce(new Error("fail"));
    const res = await request(app).get("/api/reports/insights");
    expect(res.statusCode).toBe(500);
  });
});
