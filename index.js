const http = require("http");
const https = require("https");
const url = require("url");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Skip favicon requests
  if (req.url === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Get the target URL from the request URL (skip the leading slash)
    const targetUrl = req.url.slice(1);
    
    // Decode the URL-encoded URL
    const decodedUrl = decodeURIComponent(targetUrl);
    
    if (!decodedUrl) {
      res.writeHead(400);
      res.end("Missing URL parameter");
      return;
    }

    console.log(`Proxying request to: ${decodedUrl}`);

    // Parse the URL to determine if we need http or https
    const parsedUrl = url.parse(decodedUrl);
    const httpModule = parsedUrl.protocol === "https:" ? https : http;

    // Make the request to the target URL
    const proxyReq = httpModule.request(decodedUrl, (proxyRes) => {
      // Copy the headers from the proxied response
      Object.keys(proxyRes.headers).forEach((key) => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      // Set the status code
      res.writeHead(proxyRes.statusCode);
      
      // Pipe the proxied response to the client response
      proxyRes.pipe(res);
    });

    // Handle errors in the proxy request
    proxyReq.on("error", (error) => {
      console.error(`Error fetching ${decodedUrl}:`, error.message);
      res.writeHead(500);
      res.end(`Error fetching URL: ${error.message}`);
    });

    // End the proxy request
    proxyReq.end();
  } catch (error) {
    console.error("Server error:", error.message);
    res.writeHead(500);
    res.end(`Server error: ${error.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`CORS Proxy server running on port ${PORT}`);
});
