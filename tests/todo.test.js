const connect = require("../utils/connect");
const mongoose = require("mongoose");
const { mockUpdatedTodo, mockTodo, emptyMock } = require("./mock");
const request = require("supertest");
const app = require("../index");
const Todo = require("../models/Todo");
const jwt = require("jsonwebtoken");

jest.mock("../models/Todo");

const testUser = { id: "testUserId", email: "test@example.com" };
const testToken = jwt.sign(testUser, process.env.JWT_SECRET, {
  expiresIn: "1h",
});

beforeAll(async () => {
  try {
    await connect();
    console.log("Test database connected");
  } catch (error) {
    console.error("Connection error:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    console.log("Starting test cleanup...");

    // Check if connection exists and is ready
    if (
      !mongoose.connection ||
      !mongoose.connection.db ||
      mongoose.connection.readyState === 0
    ) {
      console.log("No active database connection to clean");
      return;
    }

    // Alternative cleanup methods in order of preference
    if (mongoose.connection.db) {
      // Method 1: Drop entire database (fastest)
      await mongoose.connection.db.dropDatabase();
      console.log("Database dropped successfully");
    } else if (mongoose.connection.collections) {
      // Method 2: Fallback to collection-by-collection cleanup
      const collections = Object.keys(mongoose.connection.collections);
      for (const collectionName of collections) {
        await mongoose.connection.collections[collectionName].deleteMany({});
        console.log(`Cleared collection: ${collectionName}`);
      }
    }

    // Close connection
    await mongoose.disconnect();
    console.log("Disconnected successfully");
  } catch (error) {
    console.error("Cleanup error:", error.message);
    // Forcefully close connection if normal methods fail
    await mongoose.disconnect().catch(() => {});
  }
});
describe("Todo API Tests", () => {
  describe("post api", () => {
    //:>
    it("should create a new todo", async () => {
      Todo.mockImplementation(() => mockTodo);

      const res = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ title: "Test Todo" });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe("Test Todo");
      expect(mockTodo.save).toHaveBeenCalled();
      // expect(res.body.completed).toBe(false)
    });

    //:<
    it("should return a 404 when creating an empty todo", async () => {
      Todo.mockImplementation(() => emptyMock);

      const res = await request(app)
        .post("/api/todos")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.statusCode).toBe(400);
    });

    it("should return a 401 when no token provided", async ()=> {
      Todo.mockImplementation(()=> mockTodo)
      const res= (await request(app).post("/api/todos"))
      expect(res.statusCode).toBe(401)
    })
  });


  describe("patch api", () => {
    it("should update an existing todo", async () => {
      Todo.findByIdAndUpdate.mockResolvedValue(mockUpdatedTodo);
      //:>
      const res = await request(app)
        .put("/api/todos/123")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          title: "Updated Todo",
          completed: true,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe("Updated Todo");
      expect(res.body.completed).toBe(true);
      expect(Todo.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        { title: "Updated Todo", completed: true },
        { new: true }
      );
    });
    //:<
    it ("should return a 404 when updating a todo that doesn't exist", async () => {
      Todo.findByIdAndUpdate.mockResolvedValue(null)

      const res = await request(app).put(/api/todos)
    })

    // it("should return an error when completed is not boolean when updating")

    // it("should return an error when required is not boolean when updating")
  });

  it("should return 404 when todo is not found", async () => {
    Todo.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/todos/123")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        title: "Non-existent Todo",
        completed: true,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Todo not found");
  });

  it("should return 401 when token is missing", async () => {
    const res = await request(app).put("/api/todos/123").send({
      title: "Unauthorized Todo",
      completed: true,
    });

    expect(res.statusCode).toBe(401);
  });

  // it("should get all todos")
});
