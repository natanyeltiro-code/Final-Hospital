import app from "../backend/server.js";

export default (req, res) => {
  // Vercel function path is `/api/*`. Strip that prefix so existing Express routes
  // like `/login`, `/register`, `/appointments`, and router-mounted paths keep working.
  if (req.url === "/api") {
    req.url = "/";
  } else if (req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  }

  return app(req, res);
};
