const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TodoList", function () {
  it("Should create and toggle todos", async function () {
    const TodoList = await ethers.getContractFactory("TodoList");
    const todoList = await TodoList.deploy();
    await todoList.waitForDeployment();

    await todoList.createTodo("Learn Solidity");
    await todoList.createTodo("Build a dApp");

    const todos = await todoList.getTodos();
    expect(todos.length).to.equal(2);
    expect(todos[0].content).to.equal("Learn Solidity");
    expect(todos[0].completed).to.equal(false);

    await todoList.toggleTodo(todos[0].id);
    const updated = await todoList.getTodos();
    expect(updated[0].completed).to.equal(true);
  });
});
