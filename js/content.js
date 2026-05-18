// Fetch and parse Google Sheets published as JSON (gviz format)
// Set SHEET_ID to your published spreadsheet ID and call the functions below as needed.
const SHEET_ID = '1Ocb2jOeygDfP2lMTeR9FU0zPldH1Nir_a9bfbYpFO_0';

async function fetchSheet(sheetName){
  if(!SHEET_ID || SHEET_ID.startsWith('REPLACE')) return [];
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  // The response is JSON wrapped in a function call, strip it
  const jsonText = text.replace(/^.*?\(/s,'').replace(/\);?\s*$/,'');
  const data = JSON.parse(jsonText);
  const cols = data.table.cols.map(c=> (c.label||c.id||'col').toString());
  const rows = data.table.rows.map(r=>{
    const obj = {};
    r.c.forEach((cell,i)=>{ obj[cols[i]||`col${i}`] = cell ? cell.v : '' });
    return obj;
  });
  return rows;
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
    const rows = await fetchSheet('WhosWho'); if(rows && rows.length){
      const root = document.getElementById('whosWho'); root.innerHTML = '';
      rows.forEach(r=>{ const section = document.createElement('section'); section.innerHTML = `<h3>${escapeHtml(r.Role||r.role||'')}</h3><p>${escapeHtml(r.Description||r.Bio||r.bio||'')}</p>`; root.appendChild(section); });
    }
  }
};

// Backwards-compatible auto-load for pages that exist at initial load
document.addEventListener('DOMContentLoaded', ()=>{ if(window.loadContent) window.loadContent(); });
