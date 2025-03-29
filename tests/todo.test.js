const request = require('supertest');
const app = require('../index');
const Todo = require('../models/Todo');
const jwt = require('jsonwebtoken');

jest.mock('../models/Todo');

const testUser = { id: "testUserId", email: "test@example.com" };
const testToken = jwt.sign(testUser, process.env.JWT_SECRET, {
  expiresIn: "1h",
});

describe("Todo API Tests", () => {
  beforeEach(() => {

    Todo.mockClear();
  });

  it("should create a new todo", async () => {

    const mockTodo = {
      _id: '123',
      title: 'Test Todo',
      save: jest.fn().mockResolvedValue({ _id: '123', title: 'Test Todo' })
    };
    
    Todo.mockImplementation(() => mockTodo);

    const res = await request(app)
      .post("/api/todos")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ title: "Test Todo" });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Todo");
    expect(mockTodo.save).toHaveBeenCalled();
  });

  it("should update an existing todo", async () => {
    const mockUpdatedTodo = {
      _id: '123',
      title:'Updated Todo',
      completed: true,
    };

    Todo.findByIdAndUpdate.mockResolvedValue(mockUpdatedTodo);

    const res = await request(app)
      .put("/api/todos/123")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        title:"Updated Todo",
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
    expect(res.body.message).toBe("Todo not found")
  });

  it("should return 401 when token is missing", async () => {
    const res = await request(app)
      .put("/api/todos/123")
      .send({
        title: "Unauthorized Todo",
        completed: true,
      });

    expect(res.statusCode).toBe(401);
  });
});