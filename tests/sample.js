module.exports = {
  sampleTodo: {
    _id: "123",
    title: "Test Todo",
    save: jest.fn().mockResolvedValue({ _id: "123", title: "Test Todo", completed: true }),
  },

  sampleTodo2: {
    _id: "321",
    title: "Test2 Todo",
    save: jest.fn().mockResolvedValue({ _id: "321", title: "Test2 Todo", completed: false }),
  },
  sampleTodo3: {
    _id: "213",
    title: "Test3 Todo",
    save: jest.fn().mockResolvedValue({ _id: "213", title: "Test3 Todo", completed: true }),
  },

  sampleUpdatedTodo: {
    _id: "123",
    title: "Updated Todo",
    completed: true,
  },

  noCompletedValue: {
    _id: "321",
    title: "Test todo",

  },
  emptySample: {},

  allTodos: [
    {_id:"762", title:"Get laundry", complete:false},
    {_id:"234", title:"Do math homework", complete:true},
    {_id:"143", title:"Read book", complete:false},
  ]
};
