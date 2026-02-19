import fs from "fs";
import path from "path";
import { MENTAL_HEALTH_KEYWORDS } from "./categories";

export interface Resource {
  name: string;
  phone: string;
  web: string;
  email: string;
  address: string;
  info: string;
  tags: string[];
}

function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

let cachedResources: Resource[] | null = null;

export function getAllResources(): Resource[] {
  if (cachedResources) return cachedResources;

  const csvPath = path.join(process.cwd(), "..", "data", "Master.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const [, ...dataRows] = lines;

  cachedResources = dataRows
    .map((row) => {
      const fields = parseCSVRow(row);
      return {
        name: (fields[0] ?? "").trim(),
        phone: (fields[1] ?? "").trim(),
        web: (fields[2] ?? "").trim(),
        email: (fields[3] ?? "").trim(),
        address: (fields[4] ?? "").trim(),
        info: (fields[5] ?? "").trim(),
        tags: (fields[6] ?? "")
          .split(";")
          .map((t) => t.trim())
          .filter(Boolean),
      };
    })
    .filter((r) => r.name && r.name.length > 1);

  return cachedResources;
}

export function getResourcesByCategory(categoryTag: string): Resource[] {
  const all = getAllResources();

  if (categoryTag === "all") return all;

  if (categoryTag === "mental-health") {
    return all.filter((r) => {
      const combined = (r.info + " " + r.tags.join(" ")).toLowerCase();
      return MENTAL_HEALTH_KEYWORDS.some((kw) => combined.includes(kw));
    });
  }

  return all.filter((r) =>
    r.tags.some(
      (t) => t.toLowerCase() === categoryTag.toLowerCase()
    )
  );
}
