const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getToDosQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getToDosQuery = `
         SELECT *
         FROM todo
         WHERE todo LIKE '%${search_q}%'
         AND status='${status}'
         AND priority='${priority}';`;
      break;

    case hasPriorityProperty(request.query):
      getToDosQuery = `
         SELECT * 
         FROM todo 
         WHERE todo LIKE '%${search_q}%'
         AND priority='${priority}';`;
      break;
    case hasPriorityStatus(request.query):
      getToDosQuery = `
          SELECT *
          FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND status='${status}';`;
      break;
    default:
      getToDosQuery = `
              SELECT *
              FROM todo 
              WHERE todo LIKE '%${search_q}%';`;
  }
  data = await database.all(getToDosQuery);
  response.send(data);
});
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT * 
    FROM todo
    WHERE 
    id='${todoId}';`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});
app.post("/todos", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postToDoQuery = `
    INSERT INTO 
    todo (id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;
  await database.run(postToDoQuery);
  response.send("Todo Successfully Added");
});
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousToDoQuery = `
    SELECT * 
    FROM todo 
    WHERE 
    id=${todoId};`;
  const previousToDo = await database.get(previousToDoQuery);
  const {
    todo = previousToDo.todo,
    priority = previousToDo.priority,
    status = previousToDo.status,
  } = request.body;
  const updateTodoQuery = `
    UPDATE
    todo 
    SET 
    todo='${todo}',
    priority='${priority}',
    status='${status}'
    WHERE id=${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteToDoQuery = `
    DELETE FROM 
    todo 
    WHERE id=${todoId};`;
  await database.run(deleteToDoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
