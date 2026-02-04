const fs = require("fs");
const path = require("path");

const blogDir = path.resolve(__dirname, "..", "blog");
const indexPath = path.join(blogDir, "index.json");

function readMeta(html, name) {
  const regex = new RegExp(`<meta\\s+name=[\"']${name}[\"']\\s+content=[\"']([^\"']*)[\"']\\s*\\/?>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

function buildIndex() {
  const rawIndex = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf-8")) : { categories: [], posts: [] };
  const categories = rawIndex.categories || [];
  const files = fs.readdirSync(blogDir).filter((file) => file.endsWith(".html") && file !== "index.html" && file !== "template.html");

  const posts = files.map((file) => {
    const filePath = path.join(blogDir, file);
    const html = fs.readFileSync(filePath, "utf-8");
    const stats = fs.statSync(filePath);
    const title = readMeta(html, "blog:title") || readMeta(html, "title") || file.replace(".html", "");
    const category = readMeta(html, "blog:category") || "";
    const excerpt = readMeta(html, "blog:excerpt") || "";
    const cover = readMeta(html, "blog:cover") || "";
    const published = readMeta(html, "blog:published_at") || stats.mtime.toISOString();
    return {
      title,
      category,
      excerpt,
      cover_image: cover,
      published_at: published,
      url: `https://www.plushouse.cz/blog/${file}`
    };
  });

  const output = {
    categories,
    posts
  };

  fs.writeFileSync(indexPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✔ Blog index updated: ${indexPath}`);
}

buildIndex();
