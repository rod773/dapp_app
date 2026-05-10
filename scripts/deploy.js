const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy SimpleStorage
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const storage = await SimpleStorage.deploy();
  await storage.waitForDeployment();
  console.log("SimpleStorage deployed to:", await storage.getAddress());

  // Deploy TodoList
  const TodoList = await hre.ethers.getContractFactory("TodoList");
  const todoList = await TodoList.deploy();
  await todoList.waitForDeployment();
  console.log("TodoList deployed to:", await todoList.getAddress());

  // Deploy PaymentProcessor
  const PaymentProcessor = await hre.ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy();
  await paymentProcessor.waitForDeployment();
  console.log("PaymentProcessor deployed to:", await paymentProcessor.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
