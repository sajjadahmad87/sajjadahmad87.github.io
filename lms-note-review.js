(()=>{
  const KEY='sea_lms_course_notes_v1';
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
  const write=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const announce=message=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const refresh=()=>{
    const panel=document.querySelector('[data-lms-study-notes-summary]');
    if(!panel)return false;
    const rows=[...panel.querySelectorAll('[data-lms-note-row]')];
    if(!rows.length)return true;
    const state=read();
    rows.forEach(row=>{
      const link=row.querySelector('a[href]');
      const href=link?.getAttribute('href')||'';
      let id='';
      if(href.startsWith('course.html')) id='industrial-hvac-troubleshooting';
      else if(href.includes('#')) id=decodeURIComponent(href.split('#')[1]||'');
      if(!id||!state[id])return;
      row.dataset.noteId=id;
      row.dataset.noteReview=state[id].needsReview?'1':'0';
      let button=row.querySelector('[data-lms-note-review-toggle]');
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='btn btn-secondary';
        button.dataset.lmsNoteReviewToggle='';
        link.insertAdjacentElement('beforebegin',button);
      }
      const updateButton=()=>{
        const on=!!read()[id]?.needsReview;
        button.textContent=on?'Review ✓':'Needs review';
        button.setAttribute('aria-pressed',String(on));
        button.setAttribute('aria-label',(on?'Remove review marker from ':'Mark for review: ')+(row.querySelector('h3')?.textContent||'study note'));
        row.dataset.noteReview=on?'1':'0';
      };
      if(!button.dataset.bound){
        button.dataset.bound='1';
        button.addEventListener('click',()=>{
          const current=read();
          if(!current[id])return;
          current[id].needsReview=!current[id].needsReview;
          current[id].reviewUpdatedAt=new Date().toISOString();
          write(current);
          updateButton();
          apply();
          announce(current[id].needsReview?'Study note added to revision queue.':'Study note removed from revision queue.');
        });
      }
      updateButton();
    });
    let select=panel.querySelector('[data-lms-note-review-filter]');
    if(!select){
      const tools=panel.querySelector('.catalog-tools');
      if(tools){
        select=document.createElement('select');
        select.dataset.lmsNoteReviewFilter='';
        select.setAttribute('aria-label','Filter study notes by revision status');
        select.innerHTML='<option value="">All revision states</option><option value="review">Needs review</option><option value="done">Not marked for review</option>';
        tools.appendChild(select);
        select.addEventListener('change',apply);
      }
    }
    let sort=panel.querySelector('[data-lms-note-sort]');
    if(!sort){
      const tools=panel.querySelector('.catalog-tools');
      if(tools){
        sort=document.createElement('select');
        sort.dataset.lmsNoteSort='';
        sort.setAttribute('aria-label','Sort saved study notes');
        sort.innerHTML='<option value="newest">Newest saved first</option><option value="oldest">Oldest saved first</option><option value="review">Needs review first</option>';
        tools.appendChild(sort);
        tools.style.gridTemplateColumns='minmax(0,1fr) repeat(3,minmax(160px,220px))';
        sort.addEventListener('change',apply);
      }
    }
    const searchInput=panel.querySelector('[data-lms-note-search]');
    const categorySelect=panel.querySelector('[data-lms-note-category]');
    if(searchInput&&!searchInput.dataset.noteReviewBound){
      searchInput.dataset.noteReviewBound='1';
      searchInput.addEventListener('input',apply);
    }
    if(categorySelect&&!categorySelect.dataset.noteReviewBound){
      categorySelect.dataset.noteReviewBound='1';
      categorySelect.addEventListener('change',apply);
    }
    let summary=panel.querySelector('[data-lms-note-review-summary]');
    if(!summary){
      summary=document.createElement('p');
      summary.className='lms-local-note';
      summary.dataset.lmsNoteReviewSummary='';
      summary.setAttribute('aria-live','polite');
      const result=panel.querySelector('[data-lms-note-results]');
      if(result)result.insertAdjacentElement('afterend',summary);
    }
    apply();
    return true;

    function apply(){
      const search=panel.querySelector('[data-lms-note-search]');
      const category=panel.querySelector('[data-lms-note-category]');
      const review=panel.querySelector('[data-lms-note-review-filter]');
      const sortControl=panel.querySelector('[data-lms-note-sort]');
      const empty=panel.querySelector('[data-lms-note-empty]');
      const result=panel.querySelector('[data-lms-note-results]');
      const list=panel.querySelector('[data-lms-note-list]');
      const q=String(search?.value||'').trim().toLowerCase();
      const cat=category?.value||'';
      const rev=review?.value||'';
      const sortMode=sortControl?.value||'newest';
      const current=read();
      const time=(row,key)=>{
        const value=current[row.dataset.noteId||'']?.[key];
        const ms=Date.parse(value||'');
        return Number.isNaN(ms)?0:ms;
      };
      const ordered=[...rows].sort((a,b)=>{
        if(sortMode==='oldest')return time(a,'updatedAt')-time(b,'updatedAt');
        if(sortMode==='review'){
          const reviewDelta=(b.dataset.noteReview==='1'?1:0)-(a.dataset.noteReview==='1'?1:0);
          if(reviewDelta)return reviewDelta;
          const reviewTime=time(b,'reviewUpdatedAt')-time(a,'reviewUpdatedAt');
          if(reviewTime)return reviewTime;
        }
        return time(b,'updatedAt')-time(a,'updatedAt');
      });
      if(list)ordered.forEach(row=>list.appendChild(row));
      let shown=0,marked=0;
      ordered.forEach(row=>{
        const matchQ=!q||String(row.dataset.noteSearch||'').includes(q);
        const matchCat=!cat||row.dataset.noteCategory===cat;
        const isReview=row.dataset.noteReview==='1';
        const matchRev=!rev||(rev==='review'?isReview:!isReview);
        const show=matchQ&&matchCat&&matchRev;
        row.hidden=!show;
        if(show)shown++;
        if(isReview)marked++;
      });
      if(result)result.textContent=`${shown} of ${rows.length} saved ${rows.length===1?'note':'notes'} shown`;
      if(summary)summary.textContent=`${marked} ${marked===1?'note':'notes'} currently in your revision queue. “Needs review” is a personal study reminder only, not a competency status.`;
      if(empty)empty.hidden=shown!==0;
    }
  };
  const init=()=>{
    if(refresh())return;
    let tries=0;
    const timer=setInterval(()=>{tries++;if(refresh()||tries>20)clearInterval(timer)},100);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
