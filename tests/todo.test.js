const {
  sampleUpdatedTodo,
  sampleTodo,
  sampleTodo2,
  sampleTodo3,
  emptySample,
} = require("./sample");
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../index");
const Todo = require("../models/Todo");
const jwt = require("jsonwebtoken");

const testUser = { id: "testUserId", email: "test@example.com" };
const testToken = jwt.sign(testUser, process.env.JWT_SECRET, {
  expiresIn: "1h",
});

beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to test database");
  } catch (error) {
    console.error("Connection error:", error);
    throw error;
  }
});

beforeEach(async () => {
  await Todo.create([
    { title: "Test Todo 1", completed: false },
    { title: "Test Todo 2", completed: true },
    { title: "Test Todo 3", completed: false },
  ]);
});

afterEach(async () => {
  await Todo.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  console.log("Disconnected from test database");
});

describe("Todo API Tests", () => {
  describe("post api", () => {
    describe("happy post path", () => {
      it("should create a new todo", async () => {
        const res1 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send(sampleTodo);

        const res2 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send(sampleTodo2);

        const res3 = await request(app)
          .post("/api/todos")
          .set("Authorization", `Bearer ${testToken}`)
          .send(sampleTodo3);

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
        const res = await request(app).post("/api/todos").send(sampleTodo);

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
        const sampleTodo = {
          _id: "456",
          title: "Original Title",
          completed: false,
        };


        const res = await request(app)
          .patch(`/api/todos/${sampleTodo._id}`)
          .send({
            title: "Updated Title",
            completed: true,
          });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Access Denied! No token provided.");
      });
    });
  });
  describe("Get Single Todo", () => {
    describe("Happy Single To-do Path", () => {
      it("should return a single todo", async () => {
        const existingTodo = await Todo.create({ title: "Test Todo" });
        
        const res = await request(app)
          .get(`/api/todos/${existingTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`);
  
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe(existingTodo._id.toString());
      });
    });
  
    describe("Sad Single To-do Path", () => {
      it("should return 404 when todo is not found", async () => {
        const nonExistingId = new mongoose.Types.ObjectId();
        
        const res = await request(app)
          .get(`/api/todos/${nonExistingId}`)
          .set("Authorization", `Bearer ${testToken}`);
  
        expect(res.statusCode).toBe(404);
      });
  
      it("should return 500 for invalid ID format", async () => {
        const res = await request(app)
          .get("/api/todos/invalid-id-format")
          .set("Authorization", `Bearer ${testToken}`);
  
        expect(res.statusCode).toBe(500);
      });
    });
  });
  describe("Put API", () => {
    let existingTodo;
  
    beforeEach(async () => {
      existingTodo = await Todo.create({
        title: "Original Todo",
        completed: false
      });
    });
  
    describe("Happy Put Path", () => {
      it("should fully update a todo (200)", async () => {
        const updates = { 
          title: "Updated Todo", 
          completed: true 
        };
        
        const res = await request(app)
          .put(`/api/todos/${existingTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send(updates);
  
        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe("Updated Todo");
        expect(res.body.completed).toBe(true);

        const updatedTodo = await Todo.findById(existingTodo._id);
        expect(updatedTodo.title).toBe("Updated Todo");
        expect(updatedTodo.completed).toBe(true);
      });
    });
  
    describe("Sad Put Path", () => {
      it("should return 404 when todo is not found", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const updates = { 
          title: "Non-existent Todo", 
          completed: true 
        };
        
        const res = await request(app)
          .put(`/api/todos/${nonExistentId}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send(updates);
  
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Todo not found");
      });
  
      it("should return 500 for invalid update data", async () => {
        const res = await request(app)
          .put(`/api/todos/${existingTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`)
          .send({ title: "", completed: "inde-true-or-false" }); 
  
        expect(res.statusCode).toBe(500);
      });
    });
  });
  describe("Delete API", () => {
    let existingTodo;
  
    beforeEach(async () => {
      existingTodo = await Todo.create({
        title: "Todo to delete",
        completed: false
      });
    });
  
    describe("Happy Delete Path", () => {
      it("should delete a todo (200)", async () => {
        const res = await request(app)
          .delete(`/api/todos/${existingTodo._id}`)
          .set("Authorization", `Bearer ${testToken}`);
  
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Todo deleted");

        const deletedTodo = await Todo.findById(existingTodo._id);
        expect(deletedTodo).toBeNull();
      });
    });
  
    describe("Sad Delete Path", () => {
      it("should return 404 when todo is not found", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        
        const res = await request(app)
          .delete(`/api/todos/${nonExistentId}`)
          .set("Authorization", `Bearer ${testToken}`);
  
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Todo not found");
      });
  
      it("should return 401 without authorization token", async () => {
        const res = await request(app)
          .delete(`/api/todos/${existingTodo._id}`);
  
        expect(res.statusCode).toBe(401);
      });
    });
  });


});