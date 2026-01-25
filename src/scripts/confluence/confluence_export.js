import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";

dotenv.config();

// --------- Configuration from .env ----------
const EMAIL = process.env.EMAIL;
const API_TOKEN = process.env.ATALASSIAN_API_TOKEN;
const SPACE_KEY = process.env.SPACE_KEY;
const BASE_URL = process.env.BASE_URL;
const OVERVIEW_PAGE_TITLE = process.env.OVERVIEW_PAGE_TITLE || "Overview";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "src/data";
// --------------------------------------------

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const authConfig = {
  auth: {
    username: EMAIL,
    password: API_TOKEN,
  },
};

// Fetch all pages in the space
async function getAllPages(spaceKey) {
  let pages = [];
  let start = 0;

  while (true) {
    const resp = await axios.get(`${BASE_URL}/rest/api/content`, {
      ...authConfig,
      params: { spaceKey, type: "page", limit: 200, start },
    });

    const results = resp.data.results;
    if (!results || results.length === 0) break;

    pages = pages.concat(results);
    start += results.length;
  }

  return pages;
}

// Fetch children of a page
async function getChildren(pageId) {
  const resp = await axios.get(`${BASE_URL}/rest/api/content/${pageId}/child/page`, authConfig);
  return resp.data.results || [];
}

// Recursive build
async function buildFlatList(pageId, printedIds, flatList) {
  if (printedIds.has(pageId)) return;
  printedIds.add(pageId);

  const resp = await axios.get(`${BASE_URL}/rest/api/content/${pageId}`, {
    ...authConfig,
    params: { expand: "body.storage" },
  });

  const page = resp.data;
  const title = page.title;
  const content = page.body?.storage?.value || "";
  const pageType = page.type || "page";
  const webLink = BASE_URL + (page._links?.webui || "");

  const children = await getChildren(pageId);
  const childTitles = children.map((child) => child.title);

  flatList.push({
    title,
    pageType,
    content,
    hasChildren: children.length > 0,
    children: childTitles,
    link: webLink,
  });

  for (const child of children) {
    await buildFlatList(child.id, printedIds, flatList);
  }
}

// -------- Main Execution --------
(async () => {
  try {
    const flatPages = [];
    const printedIds = new Set();
    const allPages = await getAllPages(SPACE_KEY);

    for (const page of allPages) {
      if (page.title !== OVERVIEW_PAGE_TITLE) {
        await buildFlatList(page.id, printedIds, flatPages);
      }
    }

    const outputFile = path.join(OUTPUT_DIR, "confluence_pages.json");
    fs.writeFileSync(outputFile, JSON.stringify(flatPages, null, 2), "utf8");

    console.log(`✅ Exported ${flatPages.length} pages to ${outputFile}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();