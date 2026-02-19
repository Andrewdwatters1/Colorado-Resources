/**
 * Loads and formats the resource database from Master.csv.
 * Runs server-side only — never expose raw CSV to the client.
 */

import fs from 'fs';
import path from 'path';

export interface Resource {
  name: string;
  phone: string;
  web: string;
  email: string;
  address: string;
  details: string;
  tags: string[];
}

let _cachedResources: Resource[] | null = null;

export function loadResources(): Resource[] {
  if (_cachedResources) return _cachedResources;

  const csvPath = path.join(process.cwd(), 'data', 'Master.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');

  const lines = raw.split('\n');
  const resources: Resource[] = [];

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (!row || row.length < 7 || !row[0]?.trim()) continue;

    const [name, phone, web, email, address, details, tagsRaw] = row;
    resources.push({
      name:    name?.trim()    ?? '',
      phone:   phone?.trim()   ?? '',
      web:     web?.trim()     ?? '',
      email:   email?.trim()   ?? '',
      address: address?.trim() ?? '',
      details: details?.trim() ?? '',
      tags:    tagsRaw ? tagsRaw.split(';').map(t => t.trim()).filter(Boolean) : [],
    });
  }

  _cachedResources = resources;
  return resources;
}

/**
 * Returns resources filtered to the given tags (union — any match).
 * If no tags given, returns all resources.
 */
export function filterByTags(resources: Resource[], tags: string[]): Resource[] {
  if (!tags.length) return resources;
  const tagSet = new Set(tags.map(t => t.toLowerCase()));
  return resources.filter(r =>
    r.tags.some(t => tagSet.has(t.toLowerCase()))
  );
}

/**
 * Formats resources into the compact pipe-separated string injected
 * into the system prompt.
 */
export function formatResources(resources: Resource[]): string {
  return resources
    .map(r => {
      const parts: string[] = [`NAME: ${r.name}`];
      if (r.tags.length)  parts.push(`TAGS: ${r.tags.join('; ')}`);
      if (r.phone)        parts.push(`PHONE: ${r.phone}`);
      if (r.web)          parts.push(`WEB: ${r.web}`);
      if (r.email)        parts.push(`EMAIL: ${r.email}`);
      if (r.address)      parts.push(`ADDR: ${r.address}`);
      if (r.details)      parts.push(`INFO: ${r.details}`);
      return parts.join(' | ');
    })
    .join('\n');
}

/**
 * Infers relevant resource tags from the conversation so far,
 * so we can inject a smaller, more relevant subset of the database.
 * Falls back to full dataset if nothing detected.
 */
export function inferTagsFromConversation(messages: { role: string; content: string }[]): string[] {
  const text = messages.map(m => m.content).join(' ').toLowerCase();

  const tagKeywords: [string, string[]][] = [
    ['Employment',        ['employ', 'job', 'work', 'career', 'resume', 'hire', 'labor', 'vocational', 'workforce']],
    ['Jobs-Felon-Friendly', ['felon', 'convicted', 'record', 'reentry', 're-entry', 'released', 'prison', 'parole', 'probation']],
    ['Housing',           ['housing', 'shelter', 'homeless', 'apartment', 'rent', 'evict', 'lodge', 'transitional', 'sober living']],
    ['Housing-Felon-Friendly', ['felon', 'convicted', 'record', 'background check', 'released', 'parole']],
    ['Food',              ['food', 'nutrition', 'meal', 'pantry', 'snap', 'hunger', 'grocery', 'wic', 'eat', 'feeding']],
    ['Medical',           ['medical', 'health', 'clinic', 'doctor', 'hospital', 'therapy', 'counseling', 'treatment', 'substance', 'addiction', 'recovery', 'rehab', 'dental', 'pharmacy', 'mental health', 'behavioral']],
    ['Legal',             ['legal', 'attorney', 'lawyer', 'court', ' law ', 'criminal', 'arrest', 'custody', 'rights', 'domestic violence', 'dv', 'restraining']],
    ['Benefits',          ['benefit', 'medicaid', 'medicare', 'ssi', 'ssdi', 'tanf', 'financial assistance', 'cash assistance', 'insurance', 'disability']],
    ['Youth-and-Family',  ['youth', 'child', 'family', 'parent', 'kid', 'teen', 'adolescent', 'foster', 'juvenile', 'baby', 'parenting']],
    ['Elderly',           ['elder', 'senior', 'aging', 'older adult', 'geriatric', 'assisted living', 'long-term care', 'memory care']],
    ['Veterans',          ['veteran', 'military', 'soldier', 'navy', 'army', 'air force', 'marine', 'va ', 'served']],
    ['LGBTQ',             ['lgbt', 'gay', 'lesbian', 'transgender', 'bisexual', 'queer', 'non-binary', 'nonbinary', 'trans']],
    ['Native-Indigenous', ['native', 'indigenous', 'tribal', 'tribe', 'first nation']],
    ['Transportation',    ['transport', 'bus', 'ride', 'car', 'vehicle', 'drive', 'transit', 'mobility', 'license']],
    ['Rural',             ['rural', 'frontier', 'small town', 'county']],
    ['SO',                ['sex offender', 'sex offense', 'registry', 'so list', 'sexual offense']],
    ['Education',         ['education', 'school', 'college', 'training', 'ged', 'learn', 'degree', 'class', 'literacy', 'tutor']],
    ['Weather-Shelter',   ['weather', 'cold', 'freeze', 'shelter', 'tonight', 'emergency shelter', 'warming']],
  ];

  const detected = new Set<string>();
  for (const [tag, keywords] of tagKeywords) {
    if (keywords.some(kw => text.includes(kw))) {
      detected.add(tag);
    }
  }

  // Always include Resource-Databases as a fallback category
  detected.add('Resource-Databases');

  return detected.size ? [...detected] : [];
}

// ── CSV parser (handles quoted fields with embedded commas/newlines) ──────────
function parseCSVRow(line: string): string[] | null {
  if (!line.trim()) return null;
  const fields: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}
