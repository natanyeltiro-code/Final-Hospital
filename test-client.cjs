const http = require("http");

const postData = JSON.stringify({
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  role: "patient"
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/test",
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    console.log("Response:", data);
  });
});

req.on("error", (error) => {
  console.error("Error:", error.message);
});

req.end();
