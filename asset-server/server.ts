import { serveDir } from "jsr:@std/http/file-server";

const PORT = 8001;

Deno.serve({
  port: PORT,
  hostname: "localhost",
  handler: (req: Request) => {
    return serveDir(req, {
      fsRoot: "assets",
      showDirListing: true,
      enableCors: true,
    });
  },
});

console.log(`File server running on http://localhost:${PORT}/`);
