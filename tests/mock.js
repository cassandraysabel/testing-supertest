module.exports = {
  mockTodo: {
    _id: "123",
    title: "Test Todo",
    save: jest.fn().mockResolvedValue({ _id: "123", title: "Test Todo" }),
  },

  mockUpdatedTodo: {
    _id: "123",
    title: "Updated Todo",
    completed: true,
  },

  noCompletedValue: {
    _id: "321",
    title: "Test todo",

  },

  emptyMock: {}
};
