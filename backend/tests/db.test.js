// tests/db.test.js
process.env.NODE_ENV = "test";

jest.mock("mysql2/promise", () => {
  return {
    createPool: jest.fn(() => ({
      getConnection: jest.fn().mockResolvedValue({
        release: jest.fn(),
      }),
      execute: jest.fn(),
    })),
  };
});

const mysql = require("mysql2/promise");
const { pool, testConnection } = require("../config/db");

describe("DB CONFIG TESTS", () => {
  test("Pool should be created", () => {
    expect(mysql.createPool).toHaveBeenCalled();
    expect(pool).toBeDefined();
  });

  test("testConnection should return true on success", async () => {
    const result = await testConnection();
    expect(result).toBe(true);
  });

  test("testConnection should return false on failure", async () => {
    // 👇 override getConnection to throw
    pool.getConnection = jest.fn().mockRejectedValue(new Error("fail"));

    const result = await testConnection();

    expect(result).toBe(false);
  });
});
