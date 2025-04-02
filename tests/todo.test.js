const connect = require("../utils/connect");
const mongoose = require("mongoose");
const {
  mockUpdatedTodo,
  mockTodo,
  mockTodo2,
  mockTodo3,
  emptyMock,
} = require("./mock");
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
  describe("Post API", () => {
    describe("Happy Path", () => {
      it("should create multiple new todos", async () => {
        Todo.mockImplementation(() => mockTodo);
        const res1 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send({ title: "Test Todo 1" });

        Todo.mockImplementation(() => mockTodo2);
        const res2 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send({ title: "Test Todo 2" });

        expect(res1.statusCode).toBe(201);
        expect(res2.statusCode).toBe(201);
      });
    });

    describe("Sad Path", () => {
      it("should return 400 when creating an empty todo", async () => {
        Todo.mockImplementation(() => emptyMock);
        const res = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(400);
      });

      it("should return 401 when no token provided", async () => {
        const res = await request(app).post("/api/todos");
        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe("Get all to-dos", () => {
    describe("Happy Path", () => {
      it("should get all todos", async () => {
        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(200);
      });
    });

    describe("Sad Path", () => {
      it("should return 401 when no token is provided", async () => {
        const res = await request(app).get("/api/todos");
        expect(res.statusCode).toBe(401);
      });

      it("should return 500 when database operations fail", async () => {
        const originalFind = Todo.find;
        Todo.find = jest.fn().mockRejectedValue(new Error("Database error"));

        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Database error");

        Todo.find = originalFind;
      });
    });
  });

  describe("Get single todo", () => {
    describe("Happy Path", () => {
      it("should return a single todo", async () => {
        Todo.findById.mockResolvedValue(mockTodo);

        const res = await request(app)
          .get(`/api/todos/${mockTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe(mockTodo.title);
      });
    });

    describe("Sad Path", () => {
      it("should return 404 when todo is not found", async () => {
        Todo.findById.mockResolvedValue(null);

        const res = await request(app)
          .get(`/api/todos/invalidId`)
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Todo not found");
      });

      it("should return 500 when database error occurs", async () => {
        Todo.findById.mockRejectedValue(new Error("Database error"));

        const res = await request(app)
          .get(`/api/todos/${mockTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Database error");
      });
    });
  });

  describe("Put API", () => {
    describe("Happy Path", () => {
      it("should update a todo", async () => {
        Todo.findByIdAndUpdate.mockResolvedValue(mockUpdatedTodo);

        const res = await request(app)
          .put(`/api/todos/${mockUpdatedTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({
            title: "Updated Todo",
            completed: true,
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe("Updated Todo");
        expect(res.body.completed).toBe(true);
      });
    });

    describe("Sad Path", () => {
      it("should return 404 when todo is not found", async () => {
        Todo.findByIdAndUpdate.mockResolvedValue(null);

        const res = await request(app)
          .put(`/api/todos/invalidId`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({
            title: "Updated Todo",
            completed: true,
          });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Todo not found");
      });

      it("should return 401 when token is missing", async () => {
        const res = await request(app).put(`/api/todos/${mockUpdatedTodo._id}`).send({
          title: "Unauthorized Todo",
          completed: true,
        });

        expect(res.statusCode).toBe(401);
      });

      it("should return 500 when database error occurs", async () => {
        Todo.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

        const res = await request(app)
          .put(`/api/todos/${mockUpdatedTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({
            title: "Updated Todo",
            completed: true,
          });

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Database error");
      });
    });
  });

  describe("Delete API", () => {
    describe("Happy Path", () => {
      it("should delete a todo", async () => {
        Todo.findByIdAndDelete.mockResolvedValue(mockTodo);

        const res = await request(app)
          .delete(`/api/todos/${mockTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Todo deleted");
      });
    });

    describe("Sad Path", () => {
      it("should return 404 when todo is not found", async () => {
        Todo.findByIdAndDelete.mockResolvedValue(null);

        const res = await request(app)
          .delete(`/api/todos/invalidId`)
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Todo not found");
      });

      it("should return 401 when no token is provided", async () => {
        const res = await request(app).delete(`/api/todos/${mockTodo._id}`);
        expect(res.statusCode).toBe(401);
      });

      it("should return 500 when database error occurs", async () => {
        Todo.findByIdAndDelete.mockRejectedValue(new Error("Database error"));

        const res = await request(app)
          .delete(`/api/todos/${mockTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Database error");
      });
    });
  });
});

