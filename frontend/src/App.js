import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

const SIMPLE_STORAGE_ABI = [
  "function store(uint256 newValue) public",
  "function retrieve() public view returns (uint256)",
];
const TODO_LIST_ABI = [
  "function createTodo(string calldata content) external",
  "function toggleTodo(uint256 id) external",
  "function getTodos() external view returns (tuple(uint256 id, string content, bool completed)[])",
];
const PAYMENT_PROCESSOR_ABI = [
  "function pay(address seller, string calldata productId, string calldata productName) external payable",
  "function getBuyerPayments() external view returns (tuple(uint256 id, address buyer, address seller, uint256 amount, string productId, string productName, uint256 timestamp)[])",
  "function getSellerPayments(address seller) external view returns (tuple(uint256 id, address buyer, address seller, uint256 amount, string productId, string productName, uint256 timestamp)[])",
  "function getPaymentCount() external view returns (uint256)",
];

const CONTRACTS = {
  SimpleStorage: { address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", abi: SIMPLE_STORAGE_ABI },
  TodoList: { address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", abi: TODO_LIST_ABI },
  PaymentProcessor: { address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", abi: PAYMENT_PROCESSOR_ABI },
};

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [storedValue, setStoredValue] = useState("0");
  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [sellerAddr, setSellerAddr] = useState("");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (signer) {
      loadStoredValue();
      loadTodos();
      loadPayments();
    }
  }, [signer]);

  async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask");
    const p = new ethers.BrowserProvider(window.ethereum);
    const s = await p.getSigner();
    setProvider(p);
    setSigner(s);
    setAccount(await s.getAddress());
  }

  async function loadStoredValue() {
    const contract = new ethers.Contract(
      CONTRACTS.SimpleStorage.address,
      CONTRACTS.SimpleStorage.abi,
      provider
    );
    const val = await contract.retrieve();
    setStoredValue(val.toString());
  }

  async function storeValue() {
    const contract = new ethers.Contract(
      CONTRACTS.SimpleStorage.address,
      CONTRACTS.SimpleStorage.abi,
      signer
    );
    const tx = await contract.store(inputValue);
    await tx.wait();
    await loadStoredValue();
    setInputValue("");
  }

  async function loadTodos() {
    const contract = new ethers.Contract(
      CONTRACTS.TodoList.address,
      CONTRACTS.TodoList.abi,
      signer
    );
    const items = await contract.getTodos();
    setTodos(items.map((t) => ({ id: t.id.toString(), content: t.content, completed: t.completed })));
  }

  async function createTodo() {
    if (!newTodo.trim()) return;
    const contract = new ethers.Contract(
      CONTRACTS.TodoList.address,
      CONTRACTS.TodoList.abi,
      signer
    );
    const tx = await contract.createTodo(newTodo);
    await tx.wait();
    setNewTodo("");
    await loadTodos();
  }

  async function toggleTodo(id) {
    const contract = new ethers.Contract(
      CONTRACTS.TodoList.address,
      CONTRACTS.TodoList.abi,
      signer
    );
    const tx = await contract.toggleTodo(id);
    await tx.wait();
    await loadTodos();
  }

  async function loadPayments() {
    const contract = new ethers.Contract(
      CONTRACTS.PaymentProcessor.address,
      CONTRACTS.PaymentProcessor.abi,
      signer
    );
    const items = await contract.getBuyerPayments();
    setPayments(
      items.map((p) => ({
        id: p.id.toString(),
        seller: p.seller,
        amount: ethers.formatEther(p.amount),
        productId: p.productId,
        productName: p.productName,
        timestamp: new Date(Number(p.timestamp) * 1000).toLocaleString(),
      }))
    );
  }

  async function payProduct() {
    if (!sellerAddr || !productId || !productName || !ethAmount) return;
    setPaying(true);
    try {
      const contract = new ethers.Contract(
        CONTRACTS.PaymentProcessor.address,
        CONTRACTS.PaymentProcessor.abi,
        signer
      );
      const tx = await contract.pay(sellerAddr, productId, productName, {
        value: ethers.parseEther(ethAmount),
      });
      await tx.wait();
      setSellerAddr("");
      setProductId("");
      setProductName("");
      setEthAmount("");
      await loadPayments();
    } catch (err) {
      alert("Payment failed: " + err.message);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>dApp App</h1>
        {account ? (
          <span className="account">{account.slice(0, 6)}...{account.slice(-4)}</span>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </header>

      <main>
        <section>
          <h2>SimpleStorage</h2>
          <p>Stored value: <strong>{storedValue}</strong></p>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a number"
          />
          <button onClick={storeValue}>Store</button>
        </section>

        <section>
          <h2>TodoList</h2>
          <div className="todo-form">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="New todo..."
            />
            <button onClick={createTodo}>Add</button>
          </div>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} className={todo.completed ? "done" : ""}>
                <span onClick={() => toggleTodo(todo.id)}>
                  {todo.completed ? "✓" : "○"} {todo.content}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>DeFi Payments</h2>
          <div className="pay-form">
            <input
              value={sellerAddr}
              onChange={(e) => setSellerAddr(e.target.value)}
              placeholder="Seller address (0x...)"
            />
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Product ID"
            />
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Product name"
            />
            <input
              type="number"
              step="0.001"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="Amount in ETH"
            />
            <button onClick={payProduct} disabled={paying}>
              {paying ? "Processing..." : "Pay with ETH"}
            </button>
          </div>

          {payments.length > 0 && (
            <div className="pay-history">
              <h3>Payment History</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Seller</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.productName} ({p.productId})</td>
                      <td className="addr">{p.seller.slice(0, 6)}...{p.seller.slice(-4)}</td>
                      <td>{p.amount} ETH</td>
                      <td>{p.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
