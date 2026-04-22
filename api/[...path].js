import app from "../backend/server.js";

export default (req, res) => {
  if (req.url === "/api") {
    req.url = "/";
  } else if (req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  }

  return app(req, res);
};
