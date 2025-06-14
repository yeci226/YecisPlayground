const socket = new WebSocket(
  "wss://supposed-artificial-blackberry-scheme.trycloudflare.com"
);

socket.onopen = () => console.log("✅ WebSocket connected!");
socket.onerror = (err) => console.error("❌ WebSocket error:", err);
socket.onmessage = (msg) => console.log("📩 Message from server:", msg.data);
