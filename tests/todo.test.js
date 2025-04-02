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
  describe("post api", () => {
    describe("happy post path", () => {
      it("should create a new todo", async () => {
        // First todo
        Todo.mockImplementation(() => mockTodo);
        const res1 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send({ title: "Test Todo" });

        // Second todo
        Todo.mockImplementation(() => mockTodo2);
        const res2 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send({ title: "Test2 Todo" });

        // Third todo
        Todo.mockImplementation(() => mockTodo3);
        const res3 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send({ title: "Test3 Todo" });

        expect(res1.statusCode).toBe(201);
        expect(res2.statusCode).toBe(201);
        expect(res3.statusCode).toBe(201);

        expect(mockTodo.save).toHaveBeenCalled();
      });
    });

    describe("sad post paths", () => {
      //:<
      it("should return a 404 when creating an empty todo", async () => {
        Todo.mockImplementation(() => emptyMock);

        const res = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(400);
      });

      it("should return a 401 when no token provided", async () => {
        Todo.mockImplementation(() => mockTodo);
        const res = await request(app).post("/api/todos");
        expect(res.statusCode).toBe(401);
      });
    });
  });







  describe("get all to dos api", () => {

    describe("happy get all todos paths", ()=> {

      it("should get all todos", async () => {
        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);
  
        expect(res.statusCode).toBe(200);
      });
    })

    describe("sad get all todos paths", ()=> {

      it("should return a 401 when there's no token", async () => {
        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer `);
  
        expect(res.statusCode).toBe(401);
      });
      it("should return 500 when database operations fail", async () => {
        const originalFind = Todo.find;
        Todo.find = jest
          .fn()
          .mockRejectedValue(new Error("Database connection failed"));
  
        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);
  
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Database connection failed");
  
        Todo.find = originalFind;
      });
    })

  });







  describe("put api", () => {
    //:>
    it("should update an existing todo", async () => {
      Todo.findByIdAndUpdate.mockResolvedValue(mockUpdatedTodo);

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
    //:<
    it("should return 401 when token is missing", async () => {
      const res = await request(app).put("/api/todos/123").send({
        title: "Unauthorized Todo",
        completed: true,
      });

      expect(res.statusCode).toBe(401);
    });
  });







  describe("get single todo", () => {
    it("should return a single todo", async () => {
      Todo.findById.mockResolvedValue(mockTodo);

      const res = await request(app)
        .get("/api/todos/123")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe("Test Todo");
    });
  });







  describe("patch api", () => {
    describe("happy patch api path", ()=> {

      it("should successfully update a todo", async () => {
        
        const mockTodoPatch = {
          _id: "007",
          title: "Original Title",
          completed: false,
        };
  
        const updatedmockTodoPatch = {
          _id: "007",
          title: "Updated Title",
          completed: true,
        };
  
  
        Todo.findByIdAndUpdate.mockResolvedValue(updatedmockTodoPatch);
  
  
        const res = await request(app)
          .patch(`/api/todos/${mockTodoPatch._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({
            title: "Updated Title",
            completed: true,
          });
  
  
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(updatedmockTodoPatch);
        expect(Todo.findByIdAndUpdate).toHaveBeenCalledWith(
          mockTodoPatch._id,
          { title: "Updated Title", completed: true },
          { new: true }
        );
      });
      it("should return 200 when the request body is empty", async () => {
        const mockTodo = {
          _id: "777",
          title: "Original Title",
          completed: false,
        };
        Todo.findByIdAndUpdate.mockResolvedValue(mockTodo);
  
        const res = await request(app)
          .patch(`/api/todos/${mockTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({});
  
        expect(res.statusCode).toBe(200);
      });
    })

    describe("sad patch paths", ()=> {

      it("should return 404 when the todo is not found", async () => {
        Todo.findByIdAndUpdate.mockResolvedValue(null);
  
        const res = await request(app)
          .patch("/api/todos/123")
          .set("Authorization", `Bearer ${testToken}`)
          .send({
            title: "Non-existent Todo",
            completed: true,
          });
  
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Todo not found");
      });
  
      it("should return 401 when no authorization token is provided", async () => {
        // Mock the database behavior to return a valid Todo
        const mockTodo = {
          _id: "456",
          title: "Original Title",
          completed: false,
        };
        Todo.findByIdAndUpdate.mockResolvedValue(mockTodo);
  
        // Make the PATCH request without an authorization token
        const res = await request(app).patch(`/api/todos/${mockTodo._id}`).send({
          title: "Updated Title",
          completed: true,
        });
  
        // Assertions
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Access Denied! No token provided.");
      });
    })
  });
});
