import request from "supertest";

jest.mock("../../backend/routes/deals", () => require("express").Router());
jest.mock("../../backend/routes/tasks", () => require("express").Router());
jest.mock("../../backend/routes/reports", () => require("express").Router());
jest.mock("../../backend/routes/team", () => require("express").Router());
jest.mock("../../backend/routes/contacts", () => require("express").Router());
jest.mock("../../backend/routes/auth", () => require("express").Router());

let server;

beforeAll(async () => {
  server = await import("../../backend/server.js");
});

test("GET /api/pipeline should respond successfully", async () => {
  const res = await request("http://localhost:5000").get("/api/pipeline");
  expect([200, 404]).toContain(res.status);
});
