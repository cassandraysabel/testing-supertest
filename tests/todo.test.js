const connect = require("../utils/connect");
const mongoose = require("mongoose");
const {

  mockTodo,
  mockTodo2,
  mockTodo3,

} = require("./mock");
const request = require("supertest");
const app = require("../index");
// const Todo = require("../models/Todo");
const jwt = require("jsonwebtoken");

// jest.mock("../models/Todo");

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
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully");
  } else if (mongoose.connection.collections) {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      await mongoose.connection.collections[collectionName].deleteMany({});
      console.log(`Cleared collection: ${collectionName}`);
    }
  }

  await mongoose.disconnect();
  console.log("Disconnected successfully");
});

describe("Todo API Tests", () => {
  describe("post api", () => {
    describe("happy post path", () => {
      it("should create a new todo", async () => {
        const res1 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send(mockTodo);

        const res2 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send(mockTodo2);

        const res3 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send(mockTodo3);

        expect(res1.statusCode).toBe(201);

        expect(res2.statusCode).toBe(201);
        expect(res3.statusCode).toBe(201);
      });
    });

    describe("sad post paths", () => {
      it("should return a 404 when creating an empty todo", async () => {
        const res = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send({});

        expect(res.statusCode).toBe(400);
      });

      it("should return a 401 when no token provided", async () => {
        const res = await request(app).post("/api/todos").send(mockTodo);

        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe("get all to dos api", () => {
    describe("happy get all todos paths", () => {
      it("should get all todos", async () => {
        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(200);
      });
    });

    describe("sad get all todos paths", () => {
      it("should return a 401 when there's no token", async () => {
        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer `);

        expect(res.statusCode).toBe(401);
      });
      it("should return 500 when database operations fail", async () => {
        await mongoose.disconnect();
        const res = await request(app)
          .get("/api/todos")
          .set("Authorization", `Bearer ${testToken}`);

        expect(res.statusCode).toBe(500);

        await mongoose.connect("mongodb://localhost:27017/testing-api-lab");
     
      }, 1000);
    });
  });

  describe("patch api", () => {
    describe("happy patch api path", () => {
      it("should successfully update a todo", async () => {
        const todoPatch = {
          title: "Some title",
          completed: false,
        };
    
   
        const resPost = await request(app)
          .post("/api/todos") 
          .set("Authorization", `Bearer ${testToken}`)
          .send(todoPatch);
    
        expect(resPost.statusCode).toBe(201); 
        
    

        const res = await request(app)
          .patch(`/api/todos/${resPost.body._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({
            title: "Updated Title",
            completed: true,
          });
    
        expect(res.statusCode).toBe(200);
      });
    
      it("should return 200 when the request body is empty", async () => {
        const beforePatchTodo = {
          title: "Original Title",
          completed: false,
        };
    
        const resPost = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send(beforePatchTodo);
    
        expect(resPost.statusCode).toBe(201);
    
   
        const res = await request(app)
          .patch(`/api/todos/${resPost.body._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({});
    
        expect(res.statusCode).toBe(200);
      });
    });

    describe("sad patch paths", () => {
      it("should return 500 id is invalid", async () => {
        const todoPatch = {
          title: "Some title",
          completed: false,
        };
    
        const res = await request(app)
          .patch(`/api/todos/234567890987sdfgreg`) 
          .set("Authorization", `Bearer ${testToken}`)
          .send(todoPatch);
    
        expect(res.statusCode).toBe(500); 
 
      });

      it("should return 401 when no token is provided", async () => {
        const mockTodo = {
          _id: "456",
          title: "Original Title",
          completed: false,
        };


        const res = await request(app)
          .patch(`/api/todos/${mockTodo._id}`)
          .send({
            title: "Updated Title",
            completed: true,
          });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Access Denied! No token provided.");
      });
    });
  });
});
