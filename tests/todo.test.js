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




});