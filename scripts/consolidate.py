"""
Colorado Resources - Data Consolidation Script
Merges all CSVs into a clean Master.csv with:
  - Name/Title, Phone, Web/Link, Email, Physical Address, Information/Details, Tags
"""

import csv
import os
import re
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
URL_RE   = re.compile(r'https?://\S+|www\.\S+')
PHONE_RE = re.compile(r'(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})')

PLACEHOLDER_NAMES = {'harry potter', 'name/title', 'name of organization', 'name',
                     '[addresses and contact info below each apt] '}

OUTPUT_COLS = ['Name/Title', 'Phone', 'Web/Link', 'Email',
               'Physical Address', 'Information/Details', 'Tags']

# ── Tag files (standard 5-col format) ────────────────────────────────────────
TAG_FILES = [
    'Benefits', 'Education', 'Elderly', 'Employment', 'Food',
    'LGBTQ', 'Legal', 'Medical', 'Native-Indigenous',
    'Resource-Databases', 'Rural', 'SO', 'Transportation',
    'Unknown', 'Veterans', 'Youth-and-Family',
]

# ── Keyword → tag auto-assignment ────────────────────────────────────────────
KEYWORD_TAGS = [
    ('Veterans',          ['veteran', 'military', 'soldier', 'armed force', 'navy', 'army',
                           'air force', 'marine', 'va benefit', 'va health', 'va service']),
    ('Food',              ['food', 'nutrition', 'meal', 'pantry', 'snap', 'hunger',
                           'grocery', 'wic', 'food bank', 'food shelf', 'feeding']),
    ('Housing',           ['housing', 'shelter', 'homeless', 'apartment', 'rent',
                           'evict', 'lodging', 'transitional living', 'sober living',
                           'residential']),
    ('Medical',           ['medical', 'health', 'clinic', 'doctor', 'hospital',
                           'therapy', 'counseling', 'treatment', 'substance',
                           'addiction', 'recovery', 'rehab', 'dental', 'pharmacy',
                           'prescription', 'mental health', 'psychiatric', 'behavioral',
                           'medication']),
    ('Education',         ['education', 'school', 'college', 'training', 'ged',
                           'learn', 'degree', 'class', 'academic', 'literacy', 'tutor']),
    ('Employment',        ['employ', 'job', 'work', 'career', 'resume', 'hire',
                           'labor', 'vocational', 'workforce', 'occupation']),
    ('Legal',             ['legal', 'attorney', 'lawyer', 'court', ' law ', 'criminal',
                           'arrest', 'custody', 'rights', 'domestic violence',
                           'advocacy', 'paralegal']),
    ('Benefits',          ['benefit', 'medicaid', 'medicare', 'ssi', 'ssdi',
                           'financial assistance', 'tanf', 'government assistance',
                           'cash assistance', 'insurance']),
    ('Youth-and-Family',  ['youth', 'child', 'family', 'parent', 'kid', 'teen',
                           'adolescent', 'foster', 'juvenile', 'newborn', 'infant',
                           'baby', 'parenting']),
    ('Elderly',           ['elder', 'senior', 'aging', 'older adult', 'geriatric',
                           'assisted living', 'long-term care', 'memory care']),
    ('LGBTQ',             ['lgbt', 'gay', 'lesbian', 'transgender', 'bisexual',
                           'queer', 'non-binary', 'nonbinary']),
    ('Native-Indigenous', ['native', 'indigenous', 'tribal', 'indian tribe',
                           'first nation']),
    ('Transportation',    ['transport', 'bus', 'ride', 'car', 'vehicle',
                           'drive', 'transit', 'mobility']),
    ('Rural',             ['rural', 'frontier county']),
    ('SO',                ['sex offender', 'sex offense', 'registry', 'so list',
                           'sexual offense']),
]

# ── Housing-Felon-Friendly crime columns (row 1, indices 1-15) ───────────────
HFF_CRIME_COLS = [
    'Sex Offenses', 'Violence Against Other Person', 'Destruction of Property',
    'Controlled Substance', 'Manuf Controlled Substance', 'Arson',
    'Lifetime Sex Offender Registry', 'Sex Crimes Last 5 Years', 'On Any SO List',
    'Medicaid', 'Private Pay', 'Medicare', 'M/F/A', 'Children Allowed', 'Pets Allowed',
]


def read_csv_raw(fname):
    path = os.path.join(DATA_DIR, fname + '.csv')
    with open(path, 'r', encoding='utf-8-sig', errors='replace') as f:
        return list(csv.reader(f))


def split_web_email(raw):
    """Split a combined web/email cell into (url, email) strings."""
    raw = raw.strip()
    emails = EMAIL_RE.findall(raw)
    urls   = URL_RE.findall(raw)
    # Clean trailing punctuation from URLs
    urls = [u.rstrip('.,;)>') for u in urls]
    email = '; '.join(emails) if emails else ''
    url   = '; '.join(urls)   if urls   else ''
    # If nothing matched but there's text, keep it in url field as-is
    if not email and not url and raw:
        url = raw
    return url, email


def normalize_name(name):
    return re.sub(r'\s+', ' ', name.strip().lower())


def auto_tag(text):
    """Return list of tags suggested by keyword scanning of text."""
    text_lower = text.lower()
    found = []
    for tag, keywords in KEYWORD_TAGS:
        if any(kw in text_lower for kw in keywords):
            found.append(tag)
    return found


def read_standard_file(fname):
    """Read a standard 5-col CSV; return list of dicts."""
    rows = read_csv_raw(fname)
    if not rows:
        return []
    # Find header row (first row with 'Name' in col 0)
    data_start = 0
    for i, row in enumerate(rows):
        if row and row[0].strip().lower() in ('name/title', 'name', 'name of organization'):
            data_start = i + 1
            break
        # Some files start directly with data
    entries = []
    for row in rows[data_start:]:
        if not row or not row[0].strip():
            continue
        name = row[0].strip()
        if normalize_name(name) in PLACEHOLDER_NAMES:
            continue
        phone   = row[1].strip() if len(row) > 1 else ''
        web_raw = row[2].strip() if len(row) > 2 else ''
        addr    = row[3].strip() if len(row) > 3 else ''
        details = row[4].strip() if len(row) > 4 else ''
        url, email = split_web_email(web_raw)
        entries.append({
            'Name/Title':          name,
            'Phone':               phone,
            'Web/Link':            url,
            'Email':               email,
            'Physical Address':    addr,
            'Information/Details': details,
            'Tags':                set(),
        })
    return entries


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1 – Build name → tags map from all tag files
# ══════════════════════════════════════════════════════════════════════════════
print('Building tag map from sub-files...')
name_to_tags = defaultdict(set)

for fname in TAG_FILES:
    tag = fname  # filename = tag name
    entries = read_standard_file(fname)
    for e in entries:
        key = normalize_name(e['Name/Title'])
        name_to_tags[key].add(tag)

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2 – Load Master.csv
# ══════════════════════════════════════════════════════════════════════════════
print('Loading Master.csv...')
master_rows = read_csv_raw('Master')

records = {}  # key = normalized name → dict

for row in master_rows[1:]:  # skip header
    if not row or not row[0].strip():
        continue
    name = row[0].strip()
    key  = normalize_name(name)
    if key in PLACEHOLDER_NAMES:
        continue

    phone   = row[1].strip() if len(row) > 1 else ''
    web_raw = row[2].strip() if len(row) > 2 else ''
    addr    = row[3].strip() if len(row) > 3 else ''
    details = row[4].strip() if len(row) > 4 else ''

    url, email = split_web_email(web_raw)
    tags = name_to_tags.get(key, set()).copy()

    if key in records:
        # Duplicate in Master – merge tags, keep most-complete fields
        existing = records[key]
        existing['Tags'] |= tags
        if not existing['Phone']               and phone:   existing['Phone']               = phone
        if not existing['Web/Link']            and url:     existing['Web/Link']            = url
        if not existing['Email']               and email:   existing['Email']               = email
        if not existing['Physical Address']    and addr:    existing['Physical Address']    = addr
        if not existing['Information/Details'] and details: existing['Information/Details'] = details
    else:
        records[key] = {
            'Name/Title':          name,
            'Phone':               phone,
            'Web/Link':            url,
            'Email':               email,
            'Physical Address':    addr,
            'Information/Details': details,
            'Tags':                tags,
        }

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3 – Add missing entries from Rural & SO sub-files
# ══════════════════════════════════════════════════════════════════════════════
print('Adding missing entries from Rural and SO...')
for fname in ('Rural', 'SO'):
    for e in read_standard_file(fname):
        key = normalize_name(e['Name/Title'])
        if key not in records:
            e['Tags'] = {fname}
            records[key] = e
        else:
            records[key]['Tags'].add(fname)

# ══════════════════════════════════════════════════════════════════════════════
# STEP 4 – Add Weather-Shelter entries
# ══════════════════════════════════════════════════════════════════════════════
print('Adding Weather-Shelter entries...')
ws_rows = read_csv_raw('Weather-Shelter')
# Row 0: description header; Row 1: real column names; Row 2+: data
ws_header_note = ws_rows[0][0] if ws_rows else ''
ws_cols = ws_rows[1] if len(ws_rows) > 1 else []
# Cols: Name, County/Region, Activation Threshold, Phone, Email, Address,
#       Hours of Operation, Population Served, Shelter or Motel Vouchers?,
#       Reservation Required?, Pets allowed?, Website, Additional Notes

for row in ws_rows[2:]:
    if not row or not row[0].strip():
        continue
    name = row[0].strip()
    key  = normalize_name(name)
    if key in PLACEHOLDER_NAMES:
        continue

    county    = row[1].strip()  if len(row) > 1  else ''
    threshold = row[2].strip()  if len(row) > 2  else ''
    phone     = row[3].strip()  if len(row) > 3  else ''
    email     = row[4].strip()  if len(row) > 4  else ''
    address   = row[5].strip()  if len(row) > 5  else ''
    hours     = row[6].strip()  if len(row) > 6  else ''
    pop       = row[7].strip()  if len(row) > 7  else ''
    vouchers  = row[8].strip()  if len(row) > 8  else ''
    reserv    = row[9].strip()  if len(row) > 9  else ''
    pets      = row[10].strip() if len(row) > 10 else ''
    website   = row[11].strip() if len(row) > 11 else ''
    notes     = row[12].strip() if len(row) > 12 else ''

    # Build a rich details string
    detail_parts = []
    if county:    detail_parts.append(f'County/Region: {county}')
    if threshold: detail_parts.append(f'Activation: {threshold}')
    if hours:     detail_parts.append(f'Hours: {hours}')
    if pop:       detail_parts.append(f'Serves: {pop}')
    if vouchers:  detail_parts.append(f'Shelter/Voucher: {vouchers}')
    if reserv:    detail_parts.append(f'Reservation required: {reserv}')
    if pets:      detail_parts.append(f'Pets allowed: {pets}')
    if notes:     detail_parts.append(notes)
    detail_parts.append(f'[Threshold note: {ws_header_note}]')
    details = ' | '.join(filter(None, detail_parts))

    url, parsed_email = split_web_email(website)
    if not parsed_email and email:
        parsed_email = email

    if key not in records:
        records[key] = {
            'Name/Title':          name,
            'Phone':               phone,
            'Web/Link':            url,
            'Email':               parsed_email,
            'Physical Address':    address,
            'Information/Details': details,
            'Tags':                {'Weather-Shelter', 'Housing'},
        }
    else:
        rec = records[key]
        rec['Tags'] |= {'Weather-Shelter', 'Housing'}
        if not rec['Phone']               and phone:          rec['Phone']               = phone
        if not rec['Web/Link']            and url:            rec['Web/Link']            = url
        if not rec['Email']               and parsed_email:   rec['Email']               = parsed_email
        if not rec['Physical Address']    and address:        rec['Physical Address']    = address
        # Prepend weather-shelter details if not already there
        if details and details not in rec['Information/Details']:
            rec['Information/Details'] = (details + ' | ' + rec['Information/Details']).strip(' | ')

# ══════════════════════════════════════════════════════════════════════════════
# STEP 5 – Parse & add Housing-Felon-Friendly entries
# ══════════════════════════════════════════════════════════════════════════════
print('Parsing Housing-Felon-Friendly entries...')
hff_rows = read_csv_raw('Housing-Felon-Friendly')
# Row 0: title row; Row 1: crime-category headers; Row 2+: data
crime_headers = hff_rows[1][1:16] if len(hff_rows) > 1 else HFF_CRIME_COLS

for row in hff_rows[2:]:
    if not row or not row[0].strip():
        continue
    cell = row[0].strip()
    if normalize_name(cell.split('\n')[0]) in PLACEHOLDER_NAMES:
        continue

    lines = [l.strip() for l in cell.split('\n') if l.strip()]
    if not lines:
        continue

    # First line = name (may contain price/notes after dash/comma)
    name_raw = lines[0]
    # Strip price notes like "$995", "1b/1a", etc. — keep the actual name
    name = re.split(r'\s{2,}|\$|\bfor\b', name_raw)[0].strip().rstrip('-').strip()
    key  = normalize_name(name)

    # Identify remaining lines as phone, url, email, or address
    phone = url = email = address = ''
    remaining_notes = []
    for line in lines[1:]:
        if PHONE_RE.search(line) and not url and not re.search(r'https?://', line):
            phone = phone or line
        elif URL_RE.search(line):
            u, e = split_web_email(line)
            url   = url   or u
            email = email or e
        elif EMAIL_RE.search(line):
            email = email or line
        elif re.search(r'\d{3,}', line) and any(c in line.lower() for c in ['st', 'ave', 'blvd', 'dr', 'ln', 'rd', 'way', 'co ', 'colorado']):
            address = address or line
        else:
            remaining_notes.append(line)

    # Crime policy columns
    crime_vals = row[1:16]
    policy_parts = []
    for i, val in enumerate(crime_vals):
        val = val.strip()
        if val and val.upper() not in ('', 'UNK'):
            col_name = crime_headers[i].strip() if i < len(crime_headers) else f'Col{i}'
            policy_parts.append(f'{col_name}: {val}')

    details_parts = []
    if remaining_notes:
        details_parts.append(' '.join(remaining_notes))
    if policy_parts:
        details_parts.append('Policy — ' + ', '.join(policy_parts))
    details = ' | '.join(details_parts)

    if key not in records:
        records[key] = {
            'Name/Title':          name,
            'Phone':               phone,
            'Web/Link':            url,
            'Email':               email,
            'Physical Address':    address,
            'Information/Details': details,
            'Tags':                {'Housing', 'Housing-Felon-Friendly'},
        }
    else:
        rec = records[key]
        rec['Tags'] |= {'Housing', 'Housing-Felon-Friendly'}
        if not rec['Phone']               and phone:   rec['Phone']               = phone
        if not rec['Web/Link']            and url:     rec['Web/Link']            = url
        if not rec['Email']               and email:   rec['Email']               = email
        if not rec['Physical Address']    and address: rec['Physical Address']    = address
        if details:
            rec['Information/Details'] = (rec['Information/Details'] + ' | ' + details).strip(' | ')

# ══════════════════════════════════════════════════════════════════════════════
# STEP 6 – Add Jobs-Felon-Friendly employer names
# ══════════════════════════════════════════════════════════════════════════════
print('Adding Jobs-Felon-Friendly employer names...')
jff_rows = read_csv_raw('Jobs-Felon-Friendly')
for row in jff_rows:
    if not row or not row[0].strip():
        continue
    name = row[0].strip()
    key  = normalize_name(name)
    if key in PLACEHOLDER_NAMES or key in ('abbott laboratories',):  # skip header
        pass
    if key not in records:
        records[key] = {
            'Name/Title':          name,
            'Phone':               '',
            'Web/Link':            '',
            'Email':               '',
            'Physical Address':    '',
            'Information/Details': 'Employer known to hire individuals with felony records.',
            'Tags':                {'Employment', 'Jobs-Felon-Friendly'},
        }
    else:
        records[key]['Tags'] |= {'Employment', 'Jobs-Felon-Friendly'}

# ══════════════════════════════════════════════════════════════════════════════
# STEP 7 – Auto-tag entries with no tags (or sparse tags)
# ══════════════════════════════════════════════════════════════════════════════
print('Auto-tagging untagged entries...')
auto_tagged = 0
for key, rec in records.items():
    if not rec['Tags']:
        text = ' '.join([rec['Name/Title'], rec['Information/Details']])
        guessed = auto_tag(text)
        if guessed:
            rec['Tags'] |= set(guessed)
            auto_tagged += 1
        else:
            rec['Tags'].add('Uncategorized')

print(f'  Auto-tagged {auto_tagged} entries.')

# ══════════════════════════════════════════════════════════════════════════════
# STEP 8 – Remove junk entries (URLs as names, very short nonsensical names)
# ══════════════════════════════════════════════════════════════════════════════
print('Removing junk entries...')
junk_keys = set()
for key, rec in records.items():
    name = rec['Name/Title']
    if URL_RE.match(name):           # name is a bare URL
        junk_keys.add(key)
    elif len(name.strip()) < 3:      # name is just 1-2 chars
        junk_keys.add(key)
for k in junk_keys:
    del records[k]
print(f'  Removed {len(junk_keys)} junk entries.')

# ══════════════════════════════════════════════════════════════════════════════
# STEP 9 – Write output Master.csv
# ══════════════════════════════════════════════════════════════════════════════
print('Writing consolidated Master.csv...')
out_path = os.path.join(DATA_DIR, 'Master.csv')

# Sort: tagged entries first (alphabetically), then uncategorized
def sort_key(rec):
    tags = rec['Tags']
    is_uncategorized = tags == {'Uncategorized'}
    return (int(is_uncategorized), rec['Name/Title'].lower())

sorted_records = sorted(records.values(), key=sort_key)

with open(out_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(OUTPUT_COLS)
    for rec in sorted_records:
        tags_str = '; '.join(sorted(rec['Tags']))
        writer.writerow([
            rec['Name/Title'],
            rec['Phone'],
            rec['Web/Link'],
            rec['Email'],
            rec['Physical Address'],
            rec['Information/Details'],
            tags_str,
        ])

total = len(sorted_records)
print(f'\nDone! {total} records written to data/Master.csv')

# Summary stats
from collections import Counter
tag_counts = Counter()
for rec in sorted_records:
    for t in rec['Tags']:
        tag_counts[t] += 1

print('\nEntries per tag:')
for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
    print(f'  {tag:<30} {count}')
