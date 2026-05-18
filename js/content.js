// Fetch and parse Google Sheets published as CSV.
// Configure `SHEET_CSV_MAP` mapping sheet names to their published CSV URLs.
// Example CSV map:
// const SHEET_CSV_MAP = { 'News': 'https://docs.google.com/spreadsheets/d/.../pub?output=csv&gid=0' };
const SHEET_CSV_MAP = {
'About': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSI0aB0F73jFZ7QvOjHQv-gSHJZaIVnIQK7hCGasxbYFKIJbrLtiR5XS57RZKhZsnRNod0iymIAin7q/pub?gid=0&single=true&output=csv',
'WhosWho' : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSI0aB0F73jFZ7QvOjHQv-gSHJZaIVnIQK7hCGasxbYFKIJbrLtiR5XS57RZKhZsnRNod0iymIAin7q/pub?gid=223590804&single=true&output=csv'
};

// NOTE: legacy gviz/Sheet ID fallback removed — use `SHEET_CSV_MAP`.

// Very small CSV parser that handles quoted fields and newlines inside quotes.
function parseCSV(text){
  const rows = [];
  let cur = [];
  let i = 0;
  const len = text.length;
  while(i < len){
    let field = '';
    let inQuotes = false;
    if(text[i] === '"'){
      inQuotes = true;
      i++;
      while(i < len){
        if(text[i] === '"'){
          if(text[i+1] === '"'){
            field += '"'; i += 2; continue;
          }
          i++; break;
        }
        field += text[i++];
      }
      // after closing quote, skip until comma or newline
      while(i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') i++;
    } else {
      while(i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') field += text[i++];
    }
    cur.push(field);
    // handle separators
    if(i >= len){ rows.push(cur); break; }
    if(text[i] === ',') { i++; continue; }
    // newline handling (CRLF or LF)
    if(text[i] === '\r'){
      i++; if(text[i] === '\n') i++; rows.push(cur); cur = []; continue;
    }
    if(text[i] === '\n'){ i++; rows.push(cur); cur = []; continue; }
  }
  // edge: if last char was comma, ensure row captured
  if(cur.length && (rows.length === 0 || rows[rows.length-1] !== cur)) rows.push(cur);
  return rows;
}

async function fetchSheet(sheetName){
  // If a CSV URL for this sheetName is provided, fetch and parse CSV
  const csvUrl = SHEET_CSV_MAP && SHEET_CSV_MAP[sheetName];
  if(csvUrl){
    try{
      const res = await fetch(csvUrl);
      const text = await res.text();
      const table = parseCSV(text);
      if(!table || table.length === 0) return [];
      const headers = table[0].map(h=> (h||'').toString());
      const rows = [];
      for(let r=1;r<table.length;r++){
        const row = {};
        for(let c=0;c<headers.length;c++){
          row[headers[c] || `col${c}`] = table[r][c] !== undefined ? table[r][c] : '';
        }
        rows.push(row);
      }
      return rows;
    }catch(e){
      console.warn('Failed to fetch/parse CSV for', sheetName, e);
      return [];
    }
  }

  // No CSV mapping found for this sheetName — return empty array.
  return [];
}

function renderCards(containerSelector, rows){
  const el = document.querySelector(containerSelector);
  if(!el) return;
  el.innerHTML = '';
  if(!rows || rows.length===0){ el.innerHTML = '<p class="muted">No items found.</p>'; return; }
  rows.forEach(r=>{
    const card = document.createElement('article');
    card.className='card';
    const title = r.Title || r.title || r.Name || '';
    const date = r.Date || r.date || '';
    const body = r.Body || r.body || r.Description || r.description || '';
    const media = r.Media || r.media || '';
    card.innerHTML = `<h3>${escapeHtml(title)}</h3><p class="muted">${escapeHtml(date)}</p><div>${escapeHtml(body)}</div>`;
    if(media){
      const m = document.createElement('div'); m.className='media'; m.innerHTML = `<img src="${escapeHtml(media)}" alt="" style="max-width:100%;border-radius:8px;margin-top:8px">`;
      card.appendChild(m);
    }
    el.appendChild(card);
  });
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

// Expose a function to load sheet-driven content for elements currently in the DOM.
window.loadContent = async function(route){
  // News
  if(document.getElementById('newsList')){
    const rows = await fetchSheet('News'); renderCards('#newsList', rows);
  }
  if(document.getElementById('upcomingList')){
    const rows = await fetchSheet('Upcoming'); renderCards('#upcomingList', rows);
  }
  if(document.getElementById('previousList')){
    const rows = await fetchSheet('Previous'); renderCards('#previousList', rows);
  }

  // About and Who's Who can also be loaded if the sheet has HTML in a 'Content' column
  // About: support two common layouts:
  // 1) Single-row with columns named 'AboutUs' and 'OurStory' (or 'About Us' / 'Our Story')
  // 2) Key/Content rows where Key='About Us' and Key='Our Story'
  if(document.getElementById('aboutUs') || document.getElementById('ourStory')){
    const rows = await fetchSheet('About');
    if(rows && rows.length){
      const first = rows[0] || {};
      // Try direct columns first
      const aboutHtml = first.AboutUs || first['About Us'] || first.Content || first.ContentHtml || '';
      const storyHtml = first.OurStory || first['Our Story'] || '';
      if(aboutHtml && document.getElementById('aboutUs')) document.getElementById('aboutUs').innerHTML = aboutHtml;
      if(storyHtml && document.getElementById('ourStory')) document.getElementById('ourStory').innerHTML = storyHtml;

      // Fallback: Key/Content layout (multiple rows)
      if((!aboutHtml || !storyHtml)){
        const map = {};
        rows.forEach(r=>{
          const key = (r.Key || r.key || r.Section || r.section || '').toString().trim().toLowerCase();
          const content = r.Content || r.content || r.Body || r.body || '';
          if(key) map[key] = content;
        });
        if(!aboutHtml && document.getElementById('aboutUs') && map['about us']) document.getElementById('aboutUs').innerHTML = map['about us'];
        if(!storyHtml && document.getElementById('ourStory') && (map['our story'] || map['our_story'])) document.getElementById('ourStory').innerHTML = map['our story'] || map['our_story'];
      }
    }
  }
  // Who's who
  if(document.getElementById('whosWho')){
    const rows = await fetchSheet('WhosWho');
    const root = document.getElementById('whosWho');
    root.innerHTML = '';
    if(rows && rows.length){
      const placeholderSvg = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>"+
        "<rect width='100%' height='100%' fill='%23e6eef8'/>"+
        "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239aa9bf' font-family='Inter,Arial' font-size='18'>Image not found</text>"+
        "</svg>");
      const fallback = 'data:image/svg+xml;utf8,' + placeholderSvg;

      rows.forEach(r=>{
        const name = r.Name || r.name || '';
        const role = r.Role || r.role || '';
        const bio = r.Bio || r.bio || r.Description || r.description || '';
        const photo = (r.Photo || r.photo || r.Picture || r.picture || '').toString().trim();

        const card = document.createElement('article');
        card.className = 'whos-card';
        if(!bio) card.classList.add('no-bio');
        card.setAttribute('tabindex','0');
        card.setAttribute('role','button');
        card.setAttribute('aria-expanded','false');

        const img = document.createElement('img');
        img.alt = name ? (`Photo of ${name}`) : 'Person photo';
        img.loading = 'lazy';
        if(photo){ img.src = 'assets/' + photo; } else { img.src = fallback; }
        img.onerror = function(){ this.onerror = null; this.src = fallback; };

        const meta = document.createElement('div'); meta.className = 'meta';
        const nameEl = document.createElement('div'); nameEl.className = 'name'; nameEl.textContent = name || '';
        const roleEl = document.createElement('div'); roleEl.className = 'role'; roleEl.textContent = role || '';
        const bioEl = document.createElement('div'); bioEl.className = 'bio';
        if(bio){ bioEl.innerHTML = '<p>' + escapeHtml(bio) + '</p>'; }

        meta.appendChild(nameEl);
        meta.appendChild(roleEl);
        meta.appendChild(bioEl);

        card.appendChild(img);
        card.appendChild(meta);

        // Toggle expansion (only if bio exists)
        if(bio){
          const toggle = ()=>{
            const isExpanded = card.classList.toggle('expanded');
            card.setAttribute('aria-expanded', String(isExpanded));
          };
          card.addEventListener('click', toggle);
          card.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        }

        root.appendChild(card);
      });
    } else {
      root.innerHTML = '<p class="muted">No entries found.</p>';
    }
  }
};

// Backwards-compatible auto-load for pages that exist at initial load
document.addEventListener('DOMContentLoaded', ()=>{ if(window.loadContent) window.loadContent(); });
