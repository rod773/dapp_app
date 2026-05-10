// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TodoList {
    struct Todo {
        uint256 id;
        string content;
        bool completed;
    }

    uint256 private _nextId;
    mapping(address => Todo[]) private _todos;
    mapping(address => mapping(uint256 => bool)) private _todoExists;

    event TodoCreated(uint256 indexed id, address indexed owner, string content);
    event TodoToggled(uint256 indexed id, address indexed owner, bool completed);

    function createTodo(string calldata content) external {
        uint256 id = _nextId++;
        _todos[msg.sender].push(Todo(id, content, false));
        _todoExists[msg.sender][id] = true;
        emit TodoCreated(id, msg.sender, content);
    }

    function toggleTodo(uint256 id) external {
        require(_todoExists[msg.sender][id], "Todo does not exist");
        Todo storage todo = _todos[msg.sender][_findIndex(id)];
        todo.completed = !todo.completed;
        emit TodoToggled(id, msg.sender, todo.completed);
    }

    function getTodos() external view returns (Todo[] memory) {
        return _todos[msg.sender];
    }

    function _findIndex(uint256 id) private view returns (uint256) {
        Todo[] storage userTodos = _todos[msg.sender];
        for (uint256 i = 0; i < userTodos.length; i++) {
            if (userTodos[i].id == id) return i;
        }
        revert("Todo not found");
    }
}
