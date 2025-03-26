const request = require("supertest");
const app = require("../index"); // Import the app, NOT `listen()`

describe("Todo API Tests", () => {
  it("should create a new todo", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ title: "Test Todo" });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Todo");
  });

  it("should fetch all todos", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
