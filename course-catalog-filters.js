(()=>{
  const search=document.querySelector('#courseSearch');
  const mobileSearch=document.querySelector('#courseSearchMobile');
  const category=document.querySelector('#categoryFilter');
  const level=document.querySelector('#levelFilter');
  const count=document.querySelector('#courseCount');
  const cards=[...document.querySelectorAll('.course-card[data-title]')];
  if(!search||!mobileSearch||!count||!cards.length)return;

  const describeResults=()=>{
    const shown=cards.filter(card=>!card.classList.contains('hidden')).length;
    count.textContent=shown===1
      ?'1 learning path shown'
      :shown
        ?`${shown} learning paths shown`
        :'No learning paths match. Clear or change the search and filters.';
  };

  const syncFromDesktop=()=>{
    if(mobileSearch.value!==search.value)mobileSearch.value=search.value;
    describeResults();
  };
  const syncFromMobile=()=>{
    if(search.value!==mobileSearch.value){
      search.value=mobileSearch.value;
      search.dispatchEvent(new Event('input'));
    }else{
      describeResults();
    }
  };

  search.addEventListener('input',syncFromDesktop);
  mobileSearch.addEventListener('input',syncFromMobile);
  [category,level].forEach(control=>control?.addEventListener('change',describeResults));
  syncFromDesktop();
})();
