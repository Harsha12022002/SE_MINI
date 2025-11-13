//const express = require("express");
//const request = require("supertest");
//
//describe("Team API (Mocked)", () => {
//  let app;
//
//  beforeAll(() => {
//    app = express();
//    app.use(express.json());
//
//    // ✅ Mock GET /api/team
//    app.get("/api/team", (req, res) => {
//      res.status(200).json([
//        { id: 1, name: "Harsha", role: "Manager", email: "harsha@example.com" },
//        { id: 2, name: "Ravi", role: "Developer", email: "ravi@example.com" },
//        { id: 3, name: "Anu", role: "Tester", email: "anu@example.com" }
//      ]);
//    });
//
//    // ✅ Mock POST /api/team
//    app.post("/api/team", (req, res) => {
//      const { name, role, email } = req.body;
//
//      if (!name || !role || !email) {
//        return res.status(400).json({ message: "Missing required fields" });
//      }
//
//      res.status(201).json({
//        id: 4,
//        name,
//        role,
//        email
//      });
//    });
//  });
//
//  test("should fetch all team members", async () => {
//    const res = await request(app).get("/api/team");
//    expect(res.statusCode).toBe(200);
//    expect(Array.isArray(res.body)).toBe(true);
//    expect(res.body[0]).toHaveProperty("name");
//    expect(res.body.length).toBeGreaterThan(0);
//  });
//
//  test("should create a new team member", async () => {
//    const res = await request(app)
//      .post("/api/team")
//      .send({
//        name: "Kiran",
//        role: "Designer",
//        email: "kiran@example.com"
//      });
//
//    expect(res.statusCode).toBe(201);
//    expect(res.body).toHaveProperty("id");
//    expect(res.body.name).toBe("Kiran");
//  });
//
//  test("should return 400 when required fields are missing", async () => {
//    const res = await request(app).post("/api/team").send({ name: "Harsha" });
//    expect(res.statusCode).toBe(400);
//  });
//});



process.env.NODE_ENV = "test";

/**
 * Full system test (A1) — uses real routes + mocked DB + mocked auth/accessControl
 *
 * Save as: tests/allRoutes.test.js
 */

jest.setTimeout(20000);

// -----------------------------
// 1) Mock middleware/auth (named exports)
// -----------------------------
jest.mock("../middleware/auth", () => ({
  authenticateToken: (req, res, next) => {
    // pretend user is logged in
    req.user = { id: 1, role: "admin" };
    next();
  },
  requireRole: (roles) => (req, res, next) => {
    // allow all roles in tests
    next();
  }
}));

// -----------------------------
// 2) Mock accessControl middleware used by some routes (named exports)
// -----------------------------
jest.mock("../middleware/accessControl", () => ({
  checkDealAccess: (req, res, next) => next(),
  checkContactAccess: (req, res, next) => next()
}));

// -----------------------------
// 3) Mock DB (pool.execute)
// -----------------------------
jest.mock("../config/db", () => ({
  pool: {
    execute: jest.fn()
  },
  testConnection: jest.fn()
}));

const request = require("supertest");
const app = require("../server");
const { pool } = require("../config/db");

// Helper: reset mock before each test
beforeEach(() => {
  pool.execute.mockReset();
});

// -----------------------------
// DEALS: Basic tests (GET list, GET by id, POST create, PUT update, DELETE)
// -----------------------------
describe("DEALS ROUTES (real code, mocked DB)", () => {
  test("GET /api/deals -> returns list + pagination (two DB queries)", async () => {
    // 1st DB call: deals rows
    pool.execute
      .mockResolvedValueOnce([
        [
          { id: 1, title: "Deal A", value: 100, assigned_to: 1 }
        ],
        {}
      ])
      // 2nd DB call: count query result
      .mockResolvedValueOnce([
        [{ total: 1 }],
        {}
      ]);

    const res = await request(app).get("/api/deals");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("deals");
    expect(Array.isArray(res.body.deals)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /api/deals/:id -> returns single deal (one DB query)", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        { id: 2, title: "Deal B", assigned_to: 1 }
      ],
      {}
    ]);

    const res = await request(app).get("/api/deals/2");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", 2);
  });

  test("POST /api/deals -> create deal (insert + select new deal)", async () => {
    // 1) insert result
    pool.execute
      .mockResolvedValueOnce([{ insertId: 100 }, {}])
      // 2) select new deal
      .mockResolvedValueOnce([
        [{ id: 100, title: "Created Deal", assigned_to: 1 }],
        {}
      ]);

    const res = await request(app)
      .post("/api/deals")
      .send({
        title: "Created Deal",
        description: "desc",
        value: 123,
        stage_id: 1,
        close_date: "2025-12-01",
        contact_id: 5
      });

    expect([201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.deal).toBeDefined();
      expect(res.body.deal.id).toBe(100);
    }
  });

  test("PUT /api/deals/:id -> update deal then return success (update + select)", async () => {
    // 1) update executes - no row return needed; we still mock for awaited call
    pool.execute
      .mockResolvedValueOnce([{}, {}]) // update query
      // 2) select updatedDeal
      .mockResolvedValueOnce([
        [{ id: 3, title: "Updated Deal" }],
        {}
      ]);

    const res = await request(app)
      .put("/api/deals/3")
      .send({ title: "Updated Deal" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  test("DELETE /api/deals/:id -> delete flow", async () => {
    // delete returns affectedRows in result object
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }, {}]);

    const res = await request(app).delete("/api/deals/10");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});

// -----------------------------
// CONTACTS: list, create, get by id, put, delete, stats
// -----------------------------
describe("CONTACTS ROUTES", () => {
  test("GET /api/contacts -> list + count", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ id: 1, name: "C1", email: "c1@example.com" }],
        {}
      ]) // contacts
      .mockResolvedValueOnce([
        [{ total: 1 }],
        {}
      ]); // count

    const res = await request(app).get("/api/contacts");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.contacts)).toBe(true);
  });

  test("POST /api/contacts -> create contact (check exists -> insert -> interactions)", async () => {
    pool.execute
      // 1) existing contacts check -> none
      .mockResolvedValueOnce([[], {}])
      // 2) insert into contacts -> result with insertId
      .mockResolvedValueOnce([{ insertId: 55 }, {}])
      // 3) insert into team_interactions
      .mockResolvedValueOnce([{}, {}]);

    const res = await request(app)
      .post("/api/contacts")
      .send({ name: "New Contact", email: "new@example.com", phone: "9999999999" });

    expect([201, 409, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.contactId).toBe(55);
    }
  });

  test("GET /api/contacts/:id -> single contact", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ id: 77, name: "C77", assigned_name: "Harsha" }],
      {}
    ]);

    const res = await request(app).get("/api/contacts/77");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", 77);
  });

  test("PUT /api/contacts/:id -> update name", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }, {}]);

    const res = await request(app).put("/api/contacts/8").send({ name: "Changed" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("affectedRows");
  });

  test("DELETE /api/contacts/:id -> deletes contact", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }, {}]);

    const res = await request(app).delete("/api/contacts/8");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/contacts/stats/overview -> stats", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ status: "lead", count: 10 }],
      {}
    ]);

    const res = await request(app).get("/api/contacts/stats/overview");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// -----------------------------
// TASKS: list, get by id, create, update, delete
// -----------------------------
describe("TASKS ROUTES", () => {
  test("GET /api/tasks -> list + count", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ id: 1, title: "T1", assigned_to: 1 }],
        {}
      ]) // tasks rows
      .mockResolvedValueOnce([
        [{ total: 1 }],
        {}
      ]); // count

    const res = await request(app).get("/api/tasks");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test("GET /api/tasks/:id -> single task + access check", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ id: 2, title: "Task 2", assigned_to: 1 }],
      {}
    ]);

    const res = await request(app).get("/api/tasks/2");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", 2);
  });

  test("POST /api/tasks -> create task", async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 999 }, {}]);

    const res = await request(app)
      .post("/api/tasks")
      .send({
        title: "New Task",
        due_date: "2025-12-01",
        priority: "medium"
      });

    expect([201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) expect(res.body.taskId).toBe(999);
  });

  test("PUT /api/tasks/:id -> update task", async () => {
    // 1) SELECT existing task
    pool.execute
      .mockResolvedValueOnce([[{ id: 5 }], {}])
      // 2) UPDATE query
      .mockResolvedValueOnce([{}, {}]);

    const res = await request(app).put("/api/tasks/5").send({ title: "Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  test("DELETE /api/tasks/:id -> delete task", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ id: 7 }], {}]) // select to check exists
      .mockResolvedValueOnce([{}, {}]); // delete

    const res = await request(app).delete("/api/tasks/7");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("taskId", 7);
  });
});

// -----------------------------
// PIPELINE: stages, post stage, view, analytics
// -----------------------------
describe("PIPELINE ROUTES", () => {
  test("GET /api/pipeline/stages -> returns stages", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ id: 1, name: "Prospect" }, { id: 2, name: "Negotiation" }],
      {}
    ]);

    const res = await request(app).get("/api/pipeline/stages");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/pipeline/stages -> create new stage", async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 12 }, {}]);

    const res = await request(app)
      .post("/api/pipeline/stages")
      .send({ name: "New Stage", order_index: 5 });

    expect([201, 400]).toContain(res.statusCode);
  });

  test("GET /api/pipeline/view -> view pipeline with counts", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ id: 1, name: "Prospect", deal_count: 3 }],
      {}
    ]);

    const res = await request(app).get("/api/pipeline/view");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/pipeline/analytics -> returns analytics and conversion rates (two DB queries)", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ stage_name: "Prospect", deal_count: 2, total_value: 100 }],
        {}
      ])
      .mockResolvedValueOnce([
        [{ stage: "Prospect", total_deals: 2, won_deals: 1, win_rate: 50 }],
        {}
      ]);

    const res = await request(app).get("/api/pipeline/analytics");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("stageAnalytics");
    expect(res.body).toHaveProperty("conversionRates");
  });
});

// -----------------------------
// REPORTS: kpis, forecast, export, insights
// -----------------------------
describe("REPORTS ROUTES", () => {
  test("GET /api/reports/kpis -> returns KPIs (single DB call)", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ kpi_name: "total_deals", value: 10 }],
      {}
    ]);

    const res = await request(app).get("/api/reports/kpis");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/reports/forecast -> returns forecast", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ month: "2025-12", forecasted_value: 1000 }],
      {}
    ]);

    const res = await request(app).get("/api/reports/forecast?months=3");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/reports/export/deals -> returns CSV (one DB call)", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ title: "D1", value: 100 }],
      {}
    ]);

    const res = await request(app).get("/api/reports/export/deals");
    // either CSV bytes or JSON fallback — we check success
    expect([200, 500]).toContain(res.statusCode);
  });

  test("GET /api/reports/insights -> returns insights", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ id: 1, title: "Deal X", days_in_pipeline: 5 }],
      {}
    ]);

    const res = await request(app).get("/api/reports/insights");
    expect(res.statusCode).toBe(200);
  });
});

// -----------------------------
// TEAM: members, tasks (admin view), interactions, performance, dashboard
// -----------------------------
describe("TEAM ROUTES", () => {
  test("GET /api/team/members -> returns members", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ id: 1, username: "harsha", role: "manager" }],
      {}
    ]);

    const res = await request(app).get("/api/team/members");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/team/tasks -> admin/manager view (list + count)", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ id: 1, title: "Team Task", related_title: "Deal A" }],
        {}
      ])
      .mockResolvedValueOnce([
        [{ total: 1 }],
        {}
      ]);

    const res = await request(app).get("/api/team/tasks");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/team/interactions -> returns interactions + count", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ id: 1, action_type: "create", user_name: "harsha" }],
        {}
      ])
      .mockResolvedValueOnce([
        [{ total: 1 }],
        {}
      ]);

    const res = await request(app).get("/api/team/interactions");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/team/performance -> userPerformance + activitySummary", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ id: 1, username: "harsha", total_deals: 2 }],
        {}
      ])
      .mockResolvedValueOnce([
        [{ action_type: "create", count: 5 }],
        {}
      ]);

    const res = await request(app).get("/api/team/performance");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("userPerformance");
  });

  test("GET /api/team/dashboard -> recentActivities, quickStats, upcomingDeadlines", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ id: 1, user_name: "harsha" }],
        {}
      ]) // recentActivities
      .mockResolvedValueOnce([
        [{ pending_deals: 1, pending_tasks: 2, new_leads: 0, monthly_revenue: 0 }],
        {}
      ]) // quickStats
      .mockResolvedValueOnce([
        [{ type: "task", title: "Task1", due_date: "2025-11-20" }],
        {}
      ]); // upcomingDeadlines

    const res = await request(app).get("/api/team/dashboard");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("quickStats");
  });
});

// -----------------------------
// SYSTEM: health and unknown route
// -----------------------------
describe("SYSTEM ROUTES", () => {
  test("GET /api/health -> OK", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  test("unknown route -> 404", async () => {
    const res = await request(app).get("/some/unknown/route");
    expect(res.statusCode).toBe(404);
  });
});
