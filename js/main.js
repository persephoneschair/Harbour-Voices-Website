// Main UI interactions: mobile nav toggle and small helpers
document.addEventListener('DOMContentLoaded', function(){
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  if(navToggle && siteNav){
    navToggle.addEventListener('click', ()=>{
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      if(siteNav.style.display === 'block') siteNav.style.display=''; else siteNav.style.display='block';
    });
    window.addEventListener('resize', ()=>{ if(window.innerWidth>800) siteNav.style.display=''; });
  }
});

// Simple hash-based router and active-link handling for SPA
(function setupRouter(){
  const app = document.getElementById('app');

  function setActive(route){
    document.querySelectorAll('.site-nav a, a.brand').forEach(a=>a.classList.remove('active'));
    const selector = `.site-nav a[href="#${route}"]`;
    const navMatch = document.querySelector(selector);
    if(navMatch) navMatch.classList.add('active');
    const brand = document.querySelector('a.brand');
    if(route === 'home' && brand) brand.classList.add('active');
    else if(brand) brand.classList.remove('active');
  }

  function animateOut(){
    return new Promise(resolve=>{
      if(!app) return resolve();
      let done = false;
      function onEnd(e){
        if(e.propertyName === 'opacity'){
          if(done) return; done = true;
          app.removeEventListener('transitionend', onEnd);
          resolve();
        }
      }
      app.addEventListener('transitionend', onEnd);
      // trigger the CSS fade-out
      app.classList.add('is-hidden');
      // safety timeout in case transitionend doesn't fire
      setTimeout(()=>{ if(!done){ done=true; app.removeEventListener('transitionend', onEnd); resolve(); } }, 600);
    });
  }

  function animateIn(){
    return new Promise(resolve=>{
      if(!app) return resolve();
      let done = false;
      function onEnd(e){
        if(e.propertyName === 'opacity'){
          if(done) return; done = true;
          app.removeEventListener('transitionend', onEnd);
          resolve();
        }
      }
      app.addEventListener('transitionend', onEnd);
      // ensure starting hidden state is removed to play fade-in
      requestAnimationFrame(()=> requestAnimationFrame(()=> app.classList.remove('is-hidden')));
      setTimeout(()=>{ if(!done){ done=true; app.removeEventListener('transitionend', onEnd); resolve(); } }, 600);
    });
  }

  function render(route){
    const tpl = document.getElementById('tpl-' + route);
    if(!app) return;
    if(tpl){
      app.innerHTML = '';
      app.appendChild(tpl.content.cloneNode(true));
      setActive(route);
      attachPageHandlers(route);
      if(window.loadContent) window.loadContent(route);
    } else {
      app.innerHTML = `<section class="container"><h1>Page not found</h1><p>No content for ${route}</p></section>`;
      setActive('');
    }
    // after content is injected, ensure we fade it in
    animateIn().catch(()=>{});
  }

  function currentRoute(){
    const h = (location.hash || '#home').replace(/^#/,'');
    return h || 'home';
  }

  // Intercept clicks on internal links so we can animate out first
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href) return;
    // Hash navigation within SPA
    if(href.startsWith('#')){
      const target = (href.replace(/^#/, '') || 'home');
      if(target === currentRoute()){
        e.preventDefault();
        return;
      }
      e.preventDefault();
      animateOut().then(()=>{ location.hash = '#' + target; });
      return;
    }

    // Other internal links (relative paths) - fade out then navigate
    const isExternal = href.match(/^([a-z]+:)?\/\//i) || href.startsWith('mailto:') || href.startsWith('tel:');
    if(!isExternal && a.target !== '_blank'){
      e.preventDefault();
      animateOut().then(()=>{ window.location = href; });
    }
  });

  // Handle back/forward & hash changes
  window.addEventListener('hashchange', ()=> render(currentRoute()));

  // On first load, start hidden then render and fade in
  document.addEventListener('DOMContentLoaded', ()=>{
    if(app) app.classList.add('is-hidden');
    render(currentRoute());
  });

  // Attach behaviors for specific pages after template is injected
  function attachPageHandlers(route){
    if(route === 'contact'){
      const form = document.getElementById('contactForm');
      if(form){
        form.addEventListener('submit', function(e){
          e.preventDefault();
          const f = e.target;
          const subject = encodeURIComponent('Website contact from ' + f.name.value);
          const body = encodeURIComponent(f.message.value + '\n\nFrom: ' + f.name.value + ' <' + f.email.value + '>');
          window.location.href = `mailto:info@example.org?subject=${subject}&body=${body}`;
        });
      }
    }

    if(route === 'members'){
      const enterBtn = document.getElementById('enterMembers');
      if(enterBtn){
        enterBtn.addEventListener('click', async ()=>{
          const p = prompt('Enter members password');
          if(!p) return;
          try{
            const enc = new TextEncoder();
            const data = enc.encode(p);
            const hashBuf = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuf));
            const h = hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
            const MEMBERS_HASH = 'REPLACE_WITH_SHA256_HASH';
            if(h === MEMBERS_HASH){
              const membersContent = document.getElementById('membersContent');
              const membersArea = document.getElementById('membersArea');
              if(membersContent && membersArea){
                membersContent.style.display='block';
                membersArea.style.display='none';
                const driveLink = document.getElementById('driveLink');
                if(driveLink) driveLink.href = 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID';
              }
            } else {
              alert('Incorrect password');
            }
          }catch(e){
            console.warn('members handler error', e);
          }
        });
      }
    }
  }
})();
