import socketIOClient from "socket.io-client";

const SERVER_URL = "http://localhost:3001/price-feed";

interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
}

const socket: ReturnType<typeof socketIOClient> = socketIOClient(SERVER_URL, {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected, id:", socket.id);

  const symbols = ["BTCUSDT", "ETHUSDT"];
  socket.emit("subscribe", { symbols });
  console.log(`📩 Subscribed: ${symbols.join(", ")}`);
});

socket.on("price-update", (data: PriceData) => {
  console.log("📈 Price update:", data);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("connect_error", (err: any) => {
  console.error("⚠️ Connection error:", err.message);
});
