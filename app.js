/* ============================================================
   PLAYLENS PROTOTYPE — APPLICATION LOGIC
   Everything here is a simulated AI/AR backend driving a genuinely
   interactive frontend. Predetermined outputs, real state machine.
   ============================================================ */

// ---------- tiny helpers ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function waitForEvent(el, type){ return new Promise(res => { const h = (e) => { el.removeEventListener(type,h); res(e); }; el.addEventListener(type,h); }); }

// ============================================================
// PROFILE STATE
// ============================================================
const profile = {
  name: '',
  age: '',
  movement: '',
  sensory: '',
  communication: '',
  support: '',
  tags: [],      // diagnoses
  context: [],   // functional "keep in mind" notes
  notes: '',
};

const LABELS = {
  movement: { independent:'On her own', occasional:'Sometimes needs a hand', aid:'Uses a mobility aid' },
  sensory: { sensitive:'Calmer is better', quiet:'Prefers quiet corners', seeking:'Loves busy & active', none:'No strong preference' },
  communication: { verbal:'Talks with words', limited:'A few words', visual:'Signs, cards or a device', other:'Another way' },
  support: { minimal:'Watches from nearby', occasional:'Close by, steps in sometimes', close:'Within reach most of the time' },
};
// safe helpers for when a field wasn't answered
function lbl(group, val){ return (LABELS[group] && LABELS[group][val]) || 'Not set'; }
function childName(){ return (profile.name && profile.name !== 'this child') ? profile.name : 'your child'; }

// ============================================================
// AREA / FINDING DATA MODEL
// This is the "predetermined AI" — deterministic, but assembled
// from the profile so the reasoning reads as context-aware.
// ============================================================
const AREAS = [
  {
    id: 'swings', name: 'Swings', clip: 'A',
    enterAt: 2.55, focusAt: 3.42, pos: { x: 26, y: 58 },
    moveCloser: false,
    scanSteps: ['Structure detected','Entry identified','Reach assessed'],
    tone: 'good', symbol: '✓', label: 'Clear approach', score: 90,
    notice: ['Direct, level entry', 'Low reach demand'],
    relate: (p) => {
      const seeks = p.sensory === 'seeking';
      return `Low reach and a clear, level entry. ${seeks ? `A calm first win before the busier equipment ${childName()} tends to head for.` : `A good place for ${childName()} to start.`}`;
    },
    response: 'A good first stop. Let her lead here.',
    stats: { Reach: 'Low', Entry: 'Direct', Visibility: 'Full' },
    still: 'assets/still-swings.jpg',
    wireImg: 'assets/wire-swings.jpg',
    wire: [
      [[56,98],[57,40],[58,16],[62,7]],
      [[71,98],[69,40],[67,14],[62,7]],
      [[62,7],[90,8]],
      [[89,60],[87,20],[90,9]],
      [[90,9],[93,14],[95,58]],
      [[55,13],[53,55],[52,70],[49,73],[60,73],[57,70],[55,55],[57,13]],
      [[63,13],[61,55],[59,83],[55,87],[66,87],[63,83],[65,55],[65,13]]
    ],
    footprint: [[18,20],[42,20],[38,86],[20,86]],
    measures: [['Reach','Low'],['Entry','Direct']],
    zoneDesc: 'A set of low swings on level ground. Easy to walk up to and get on.',
  },
  {
    id: 'climber', name: 'Climber', clip: 'A',
    enterAt: 3.85, focusAt: 5.18, pos: { x: 49, y: 27 },
    moveCloser: true,
    scanSteps: ['Structure detected','Entry identified','Reach assessed','Visibility checked'],
    tone: 'warn', symbol: '△', label: 'Needs a hand', score: 45,
    notice: ['Higher reach point', 'Limited entry', 'Partial view for you'],
    relate: (p) => {
      if (p.sensory === 'seeking'){
        return `${childName()} may be drawn to this. The height and grip are a good challenge, but the reach means staying close while she gets the hang of it.`;
      }
      const base = p.support === 'close' ? 'Staying within reach already suits this' : (p.support === 'minimal' ? 'Even watching from nearby, this one' : 'With the occasional hand she needs, this');
      return `${base}. The higher reach and tight entry mean a hand here would help.`;
    },
    response: 'Stay where you can see her, near the entry.',
    alternate: { title:'Try the swings instead', text:'Same fun, much lower reach. A better independent option nearby.' },
    stats: { Reach: 'High', Entry: 'Limited', Visibility: 'Partial' },
    still: 'assets/still-climber.jpg',
    wireImg: 'assets/wire-climber.jpg',
    wire: [
      [[36,31],[38,22],[42,20],[46,22],[48,31],[46,42],[42,47],[38,42],[36,31]],
      [[36,31],[48,31]],
      [[38,24],[46,24]], [[37,38],[47,38]],
      [[42,20],[42,47]],
      [[39,21],[40,46]], [[45,21],[44,46]],
      [[37,44],[33,57]], [[40,46],[38,56]], [[44,46],[45,55]], [[47,44],[48,54]]
    ],
    footprint: [[40,12],[59,12],[60,44],[38,44]],
    measures: [['Reach','High'],['Entry','Tight'],['View','Partial']],
    caregiverSightline: true,
    zoneDesc: 'A tall climbing dome. Higher hand-holds and a narrow way in.',
  },
  {
    id: 'surface', name: 'Ground', clip: 'B',
    enterAt: 0.6, focusAt: 2.45, pos: { x: 55, y: 78 },
    moveCloser: false,
    scanSteps: ['Ground detected','Surface assessed','Footing checked'],
    tone: 'caution', symbol: '!', label: 'Uneven', score: 38,
    notice: ['Loose gravel', 'Uneven underfoot'],
    relate: (p) => {
      const mob = p.movement === 'aid' ? `With a mobility aid, the loose gravel here is worth avoiding. ` : (p.movement === 'occasional' ? `Since ${childName()} sometimes needs a hand, ` : '');
      return `${mob}the uneven footing could catch her out moving between areas.`;
    },
    response: 'Take it slow here, or use the smoother path alongside.',
    alternate: { title:'Use the paved path', text:'The smoother path runs right alongside, and it is steadier underfoot.' },
    stats: { Surface: 'Loose', Slope: 'Slight', Visibility: 'Full' },
    still: 'assets/still-surface.jpg',
    wireImg: 'assets/wire-surface.jpg',
    wire: [
      [[2,60],[62,56],[78,96],[0,98]],
      [[16,58],[26,97]], [[32,57],[46,96]], [[48,57],[64,95]],
      [[6,70],[70,66]], [[3,82],[74,79]], [[0,92],[77,90]]
    ],
    footprint: [[14,64],[72,60],[86,92],[4,94]],
    measures: [['Surface','Loose'],['Slope','Slight']],
    confidence: 'Moderate',
    confidenceNote: 'Part of the ground was in shadow during the scan.',
    zoneDesc: 'Loose gravel between the play areas. A bit uneven to walk across.',
  },
  {
    id: 'bench', name: 'Bench', clip: 'B',
    enterAt: 2.45, focusAt: 2.45, pos: { x: 39, y: 54 },
    moveCloser: false,
    scanSteps: ['Seat detected','Sightlines checked','View assessed'],
    tone: 'good', symbol: '✓', label: 'Good to watch from', score: 88,
    notice: ['Clear view of the play areas', 'Shaded and out of the way'],
    relate: (p) => `A good place to sit and keep ${childName()} in view. You can see the swings and climber from here without being in the middle of things.`,
    response: 'A comfortable base to watch from between activities.',
    stats: { View: 'Wide', Shade: 'Yes', Distance: 'Close' },
    still: 'assets/still-bench.jpg',
    wireImg: 'assets/wire-bench.jpg',
    wire: [
      [[29,42],[46,41]],
      [[29,42],[29,54]], [[46,41],[47,54]],
      [[29,48],[46,47]],
      [[27,54],[49,53],[48,57],[26,58],[27,54]],
      [[31,57],[31,66]], [[44,56],[45,66]]
    ],
    footprint: [[31,44],[48,43],[49,64],[30,64]],
    measures: [['View','Wide'],['Shade','Yes']],
    isViewpoint: true,
    zoneDesc: 'A shaded bench beside the path. The best spot to sit and watch from.',
  },
];

const areaState = {}; // id -> { state, scannedAt }
AREAS.forEach(a => areaState[a.id] = { state: 'unscanned', scannedAt: null, rescans: 0, skipped: false });

function toneVars(tone){
  return { good: {cls:'tone-good'}, warn:{cls:'tone-warn'}, caution:{cls:'tone-caution'} }[tone];
}
function symbolFor(a){ return a.symbol; }

// ============================================================
// SCREEN ROUTER + LANDSCAPE + AUTO-SCALE
// ============================================================
const body = document.body;
const device = document.getElementById('device');
const deviceScaler = document.getElementById('deviceScaler');

// screens that render in landscape
const LANDSCAPE_SCREENS = new Set(['ar']);

function applyOrientation(name){
  const wantLandscape = LANDSCAPE_SCREENS.has(name);
  device.classList.toggle('landscape', wantLandscape);
  // rescale after the frame swaps dimensions
  requestAnimationFrame(fitDevice);
}

function fitDevice(){
  const isLandscape = device.classList.contains('landscape');
  const w = isLandscape ? 800 : 390;
  const h = isLandscape ? 390 : 800;
  const margin = 56;
  const availH = window.innerHeight - margin;
  const availW = window.innerWidth - margin;
  // landscape can scale up (bigger, closer view); portrait caps at 1
  const cap = isLandscape ? 1.45 : 1;
  const scale = Math.min(availW / w, availH / h, cap);
  deviceScaler.style.setProperty('--scale', scale.toFixed(3));
}
window.addEventListener('resize', fitDevice);

function goScreen(name){
  applyOrientation(name);
  $$('.screen').forEach(s => s.classList.remove('is-active','is-in'));
  const target = $(`.screen[data-name="${name}"]`);
  target.classList.add('is-active');
  requestAnimationFrame(() => target.classList.add('is-in'));
  body.setAttribute('data-screen', name);
  if (name === 'onboarding' && !onbSuppressAuto) startOnboarding(onbFromHelp);
  if (name === 'home') renderHome();
  if (name === 'blueprint') renderBlueprint();
  if (name === 'assessment') renderAssessment();
  if (name === 'saved') renderSaved();
  if (name === 'replay') renderReplay();
  // build the reflection navbars (map/summary/saved) on demand
  if (['blueprint','assessment','saved'].includes(name)) buildReflectNav(name);
}
let onbSuppressAuto = false;
$$('[data-go]').forEach(btn => btn.addEventListener('click', () => goScreen(btn.getAttribute('data-go'))));

// reflection screens share one navbar layout (Map / Summary / Saved / Home)
function buildReflectNav(active){
  const items = [
    { go:'blueprint', icon:'i-map', label:'Map' },
    { go:'assessment', icon:'i-summary', label:'Summary' },
    { go:'saved', icon:'i-saved', label:'Saved' },
    { go:'home', icon:'i-child', label:'Home' },
  ];
  $$('.ar-bottomnav[data-nav="reflect"]').forEach(nav => {
    nav.innerHTML = items.map(it => `<button class="navbtn ${it.go===active?'is-active':''}" data-go="${it.go}"><svg class="ic"><use href="#${it.icon}"/></svg>${it.label}</button>`).join('');
    $$('.navbtn', nav).forEach(b => b.addEventListener('click', () => goScreen(b.getAttribute('data-go'))));
  });
}

// ============================================================
// ONBOARDING — short animated instruction walkthrough.
// Explains the whole loop AND primes the caregiver on the fact
// that the profile is what makes the results personal.
// ============================================================
const ONB_SLIDES = [
  {
    title: 'Point your phone at the playground',
    text: 'PlayLens uses your camera to read the space: the equipment, the ground, the paths.',
    art: 'video', clip: 'assets/still-wide.jpg', overlay: 'scan',
  },
  {
    title: 'It reads each spot for your child',
    text: 'Using what you shared about your child, it works out what each area means for them.',
    art: 'video', clip: 'assets/still-swings.jpg', overlay: 'chip-good',
  },
  {
    title: 'Findings stay where you found them',
    text: 'Walk around and build a picture of the whole playground. Nothing gets lost.',
    art: 'video', clip: 'assets/still-climber.jpg', overlay: 'chips-multi',
  },
  {
    title: 'You decide what to do',
    text: 'PlayLens gives notes and ideas, never a safety score. Your judgement comes first.',
    art: 'video', clip: 'assets/still-surface.jpg', overlay: 'chip-caution',
  },
];
let onbIndex = 0;

function onbArtHtml(s){
  // real playground frame with a small realistic overlay composited on top
  const overlays = {
    'scan': `<div class="oa-scanline"></div><div class="oa-reticle"></div>`,
    'chip-good': `<div class="oa-chip tone-good" style="left:50%; top:58%;"><svg class="ic ic-sm" style="stroke-width:3"><use href="#i-check"/></svg> Clear approach</div>`,
    'chips-multi': `
      <div class="oa-chip tone-good" style="left:20%; top:34%;"><svg class="ic ic-sm" style="stroke-width:3"><use href="#i-check"/></svg> Swings</div>
      <div class="oa-chip tone-warn" style="left:54%; top:26%;"><svg class="ic ic-sm" style="stroke-width:3"><use href="#i-alert"/></svg> Climber</div>`,
    'chip-caution': `<div class="oa-chip tone-caution" style="left:44%; top:64%;"><svg class="ic ic-sm" style="stroke-width:3"><use href="#i-flag"/></svg> Uneven</div>`,
  };
  return `<div class="oa-photo" style="background-image:url('${s.clip}')">
    <div class="oa-photo-scrim"></div>
    ${overlays[s.overlay] || ''}
  </div>`;
}

function renderOnb(){
  const s = ONB_SLIDES[onbIndex];
  $('#onbArt').innerHTML = onbArtHtml(s);
  $('#onbTitle').textContent = s.title;
  $('#onbText').textContent = s.text;
  const dots = $('#onbDots'); dots.innerHTML = '';
  ONB_SLIDES.forEach((_, i) => {
    const d = document.createElement('i');
    if (i === onbIndex) d.classList.add('on');
    dots.appendChild(d);
  });
  $('#onbNext').textContent = onbIndex === ONB_SLIDES.length - 1 ? (onbFromHelp ? 'Got it' : 'Set up profile') : 'Next';
}
let onbFromHelp = false;
function startOnboarding(fromHelp){ onbFromHelp = !!fromHelp; onbIndex = 0; renderOnb(); }
$('#onbNext').addEventListener('click', () => {
  if (onbIndex === ONB_SLIDES.length - 1){ goScreen(onbFromHelp ? 'home' : 'profile'); return; }
  onbIndex++; renderOnb();
});
$('#onbBack').addEventListener('click', () => {
  if (onbIndex === 0){ goScreen(onbFromHelp ? 'home' : 'welcome'); return; }
  onbIndex--; renderOnb();
});
$('#onbSkip').addEventListener('click', () => goScreen(onbFromHelp ? 'home' : 'profile'));
// CHILD PROFILE FLOW  (create + edit; 6 input steps + summary)
// ============================================================
let profileStep = 0;
const LAST_INPUT_STEP = 3;   // steps 0-3 are inputs (diagnosis, age+move, sensory+support, comms)
const SUMMARY_STEP = 4;
let profileReturnTo = 'home';
let editingProfile = false;

function renderDots(){
  const wrap = $('#profileDots'); wrap.innerHTML = '';
  for (let i = 0; i <= LAST_INPUT_STEP; i++){
    const d = document.createElement('i');
    if (i < Math.min(profileStep, SUMMARY_STEP)) d.classList.add('on');
    wrap.appendChild(d);
  }
}
function showProfileStep(i){
  $$('.p-step').forEach(el => el.hidden = (+el.dataset.step !== i));
  renderDots();
  $('#profileDots').style.visibility = (i === SUMMARY_STEP) ? 'hidden' : 'visible';
  const nextBtn = $('#profileNext');
  if (i === SUMMARY_STEP){
    nextBtn.textContent = editingProfile ? 'Save changes' : 'Go to home';
  } else {
    nextBtn.textContent = 'Continue';
  }
  if (i === SUMMARY_STEP) buildSummary();
  $('#profileSteps').scrollTop = 0;
}
function openProfileForEdit(returnTo){
  editingProfile = true;
  profileReturnTo = returnTo || 'home';
  profileStep = 0;
  syncProfileControlsToState();
  goScreen('profile');
  showProfileStep(0);
}
$('#profileBack').addEventListener('click', () => {
  if (profileStep === 0) { goScreen(editingProfile ? profileReturnTo : 'onboarding'); return; }
  profileStep--; showProfileStep(profileStep);
});
$('#profileNext').addEventListener('click', () => {
  if (profileStep === SUMMARY_STEP) {
    const dest = editingProfile ? profileReturnTo : 'home';
    editingProfile = false;
    profileDone = true;
    goScreen(dest);
    return;
  }
  profileStep++; showProfileStep(profileStep);
});

// option selection (single-select groups)
$$('.opt-pill, .opt-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.parentElement.dataset.group;
    Array.from(btn.parentElement.children).forEach(c => c.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    const val = btn.dataset.value;
    if (group === 'age') profile.age = val;
    else profile[group] = val;
  });
});
// diagnosis (medical) dropdown options
const DIAGNOSIS_OPTIONS = [
  { cat:'Neurodevelopmental', items:['Autism','ADHD','Sensory processing disorder','Dyspraxia (DCD)','Learning disability','Global developmental delay','Speech & language delay'] },
  { cat:'Physical & mobility', items:['Cerebral palsy','Muscular dystrophy','Spina bifida','Hypermobility','Limb difference','Epilepsy'] },
  { cat:'Sensory', items:['Low vision','Blind','Deaf or hard of hearing'] },
  { cat:'Emotional & mental health', items:['Anxiety','Selective mutism','OCD','Attachment difficulties'] },
  { cat:'Other', items:['Down syndrome','Chromosomal condition','Medical / physical condition','Prefer not to say'] },
];
// functional context (how they experience play) — separate, plain-language
const CONTEXT_OPTIONS = [
  { cat:'Moving around', items:['Tires easily','Careful on steps & heights','Uses a wheelchair','Uses a walker or frame','Still building balance','Big, energetic mover'] },
  { cat:'Sights & sounds', items:['Finds noise overwhelming','Sensitive to bright or busy spaces','Loves movement & spinning','Seeks textures & sensation','Startles at sudden things'] },
  { cat:'Focus & feelings', items:['Needs time to warm up','Gets anxious in new places','Prefers a clear routine','Big reactions to change'] },
  { cat:'Other', items:['Needs breaks','Prefers quieter times of day','Likes company nearby'] },
];
// reusable multi-select dropdown (used for both diagnosis and functional context)
function setupDropdown(cfg){
  const trigger = $(cfg.trigger), panel = $(cfg.panel), list = $(cfg.list),
        search = $(cfg.search), tagsWrap = $(cfg.tags), triggerText = $(cfg.triggerText);
  const getArr = () => profile[cfg.key];
  function renderList(filter=''){
    const f = filter.trim().toLowerCase();
    let html = '';
    cfg.options.forEach(group => {
      const matches = group.items.filter(it => it.toLowerCase().includes(f));
      if (!matches.length) return;
      html += `<div class="dropdown-cat">${group.cat}</div>`;
      matches.forEach(it => {
        const sel = getArr().includes(it);
        html += `<button type="button" class="dropdown-opt ${sel?'sel':''}" data-value="${it}"><span class="dd-check"><svg class="ic"><use href="#i-check"/></svg></span>${it}</button>`;
      });
    });
    if (!html) html = `<div class="dropdown-cat">No matches</div>`;
    list.innerHTML = html;
    $$('.dropdown-opt', list).forEach(b => b.addEventListener('click', () => toggle(b.dataset.value)));
  }
  function toggle(val){
    const arr = getArr();
    if (arr.includes(val)) profile[cfg.key] = arr.filter(t=>t!==val);
    else arr.push(val);
    renderList(search.value); renderTags();
  }
  function renderTags(){
    const arr = getArr();
    tagsWrap.innerHTML = arr.map(t => `<span class="selected-tag">${t}<button type="button" data-rm="${t}"><svg class="ic"><use href="#i-close"/></svg></button></span>`).join('');
    $$('[data-rm]', tagsWrap).forEach(b => b.addEventListener('click', () => toggle(b.dataset.rm)));
    triggerText.textContent = arr.length ? `${arr.length} selected` : cfg.placeholder;
    trigger.classList.toggle('has-value', arr.length>0);
  }
  trigger.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    trigger.classList.toggle('open', open);
    if (open){ renderList(); search.value=''; }
  });
  search.addEventListener('input', (e) => renderList(e.target.value));
  return { renderTags };
}
const diagDropdown = setupDropdown({ key:'tags', options:DIAGNOSIS_OPTIONS, placeholder:'Select any that apply',
  trigger:'#diagTrigger', panel:'#diagPanel', list:'#diagList', search:'#diagSearch', tags:'#selectedTags', triggerText:'#diagTriggerText' });
const ctxDropdown = setupDropdown({ key:'context', options:CONTEXT_OPTIONS, placeholder:'How they experience play',
  trigger:'#ctxTrigger', panel:'#ctxPanel', list:'#ctxList', search:'#ctxSearch', tags:'#ctxSelectedTags', triggerText:'#ctxTriggerText' });
function renderSelectedTags(){ diagDropdown.renderTags(); ctxDropdown.renderTags(); }

$('#childName').addEventListener('input', (e) => { profile.name = e.target.value || 'this child'; });
$('#childNotes').addEventListener('input', (e) => { profile.notes = e.target.value.trim(); });

// reflect current profile object back into the form controls (for edit mode)
function syncProfileControlsToState(){
  $('#childName').value = profile.name === 'this child' ? '' : profile.name;
  $('#childNotes').value = profile.notes || '';
  const setGroup = (group, val) => {
    const wrap = document.querySelector(`[data-group="${group}"]`);
    if (!wrap) return;
    Array.from(wrap.children).forEach(c => c.classList.toggle('is-selected', c.dataset.value === val));
  };
  setGroup('age', profile.age);
  setGroup('movement', profile.movement);
  setGroup('sensory', profile.sensory);
  setGroup('communication', profile.communication);
  setGroup('support', profile.support);
  renderSelectedTags();
}

function buildSummary(){
  $('#summaryName').textContent = childName();
  $('#summaryAge').textContent = profile.age ? ('Age ' + profile.age) : 'Age not set';
  $('#summaryAvatar').textContent = (childName()[0]||'C').toUpperCase();
  const p = $('#summaryPromise');
  if (p) p.textContent = `I'll use these when I read the playground for ${childName()}.`;
  const grid = $('#summaryGrid');
  const rows = [
    ['Getting around', lbl('movement',profile.movement)],
    ['Sights & sounds', lbl('sensory',profile.sensory)],
    ['Communication', lbl('communication',profile.communication)],
    ['Staying close', lbl('support',profile.support)],
  ];
  if (profile.notes) rows.push(['Notes', profile.notes]);
  grid.innerHTML = rows.map(([k,v]) => `<div class="summary-row"><span class="sr-k">${k}</span><span class="sr-v">${v}</span></div>`).join('');
  const tagsWrap = $('#summaryTagsWrap');
  const allTags = [...profile.tags, ...profile.context];
  if (allTags.length){
    tagsWrap.hidden = false;
    $('#summaryTags').innerHTML = allTags.map(t => `<span class="tag readonly">${t}</span>`).join('');
  } else { tagsWrap.hidden = true; }
}
showProfileStep(0);

// edit-profile entry points
// edit-profile entry points wired below via home + settings

// ============================================================
// HOME SCREEN (hub) + SETTINGS
// ============================================================
let profileDone = false;

function renderHome(){
  const card = $('#homeChildCard');
  const tags = profile.tags.length ? `<div class="child-card-tags">${profile.tags.map(t=>`<span class="child-card-tag">${t}</span>`).join('')}</div>` : `<div class="child-card-tags"><span class="child-card-tag">${profile.age?('Age '+profile.age):'Profile set'}</span>${profile.movement?('<span class="child-card-tag">'+lbl('movement',profile.movement)+'</span>'):''}</div>`;
  card.innerHTML = `
    <div class="child-card-top">
      <div class="child-card-avatar">${(childName()[0]||'C').toUpperCase()}</div>
      <div>
        <div class="child-card-name">${childName()}</div>
        <div class="child-card-sub">${profile.age?('Age '+profile.age+' · '):''}profile active</div>
      </div>
      <button class="child-card-edit" id="homeEditChild"><svg class="ic ic-sm" style="stroke:#fff"><use href="#i-edit"/></svg> Edit</button>
    </div>
    ${tags}
  `;
  $('#homeEditChild').addEventListener('click', () => openProfileForEdit('home'));

  // saved playgrounds list
  const list = $('#homeSavedList');
  const hasScans = AREAS.some(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  if (!hasScans){
    list.innerHTML = `<div class="home-empty"><svg class="ic"><use href="#i-map"/></svg><p class="small-text">No saved playgrounds yet.<br>Scan one to start your record.</p></div>`;
    return;
  }
  const scanned = AREAS.filter(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  renderBlueprint(); // ensures svg content exists for the mini
  const mini = $('#blueprintSvg').innerHTML;
  list.innerHTML = `
    <div class="saved-tile" id="homeSavedTile">
      <div class="saved-tile-map"><svg viewBox="0 0 320 400" width="100%" height="100%">${mini}</svg></div>
      <div class="saved-tile-body">
        <b>This playground</b>
        <div class="sub">${scanned.length} areas · today</div>
        <div class="saved-tile-chips">${scanned.map(a=>`<span class="mini-chip ${toneVars(a.tone).cls}">${toneIconInline(a.tone)} ${a.name}</span>`).join('')}</div>
      </div>
      <svg class="ic ic-sm" style="color:var(--ink-30)"><use href="#i-chevron"/></svg>
    </div>`;
  $('#homeSavedTile').addEventListener('click', () => goScreen('saved'));
}

function toneIconInline(tone){
  const id = tone==='good'?'i-check':tone==='warn'?'i-alert':'i-flag';
  return `<svg class="ic" style="width:11px;height:11px;stroke-width:3"><use href="#${id}"/></svg>`;
}

$('#homeScanBtn').addEventListener('click', () => goScreen('before-scan'));
$('#homeHelp').addEventListener('click', () => { onbFromHelp = true; goScreen('onboarding'); });
$('#homeSettings').addEventListener('click', () => { $('#setChildName').textContent = `${childName()}'s profile`; const n = AREAS.filter(a=>['processed','needs-attention'].includes(areaState[a.id].state)).length; $('#setScanCount').textContent = n ? `${n} areas saved` : 'No scans yet'; $('#settingsScrim').hidden = false; });

// settings sheet actions
$('#settingsScrim').addEventListener('click', (e) => { if (e.target === $('#settingsScrim')) $('#settingsScrim').hidden = true; });
$('#setEditChild').addEventListener('click', () => { $('#settingsScrim').hidden = true; openProfileForEdit('home'); });
$('#setOldScans').addEventListener('click', () => { $('#settingsScrim').hidden = true; const hasScans = AREAS.some(a => ['processed','needs-attention'].includes(areaState[a.id].state)); goScreen(hasScans ? 'saved' : 'home'); });
$('#setHelp').addEventListener('click', () => { $('#settingsScrim').hidden = true; onbFromHelp = true; goScreen('onboarding'); });

// accessibility toggles
function wireToggle(id, cls){
  const btn = $(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-checked') !== 'true';
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    document.body.classList.toggle(cls, on);
  });
}
wireToggle('#toggleMotion', 'reduce-motion');
wireToggle('#toggleText', 'larger-text');

// in-app info modal (replaces browser alert)
function showInfo(title, body){
  $('#infoTitle').textContent = title;
  $('#infoBody').textContent = body;
  $('#infoScrim').hidden = false;
}
$('#infoClose').addEventListener('click', () => { $('#infoScrim').hidden = true; });
$('#infoScrim').addEventListener('click', (e) => { if (e.target === $('#infoScrim')) $('#infoScrim').hidden = true; });

// rescan area picker (replaces the climber-default behaviour)
function showRescanPicker(){
  const scanned = AREAS.filter(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  $('#rescanList').innerHTML = scanned.map(a => `
    <button class="rescan-opt" data-id="${a.id}">
      <span class="rescan-opt-icon ${toneVars(a.tone).cls}"><svg class="ic"><use href="#${toneIconId(a.tone)}"/></svg></span>
      <span class="rescan-opt-body"><b>${a.name}</b><span>${a.label}</span></span>
      <svg class="ic ic-sm chev"><use href="#i-chevron"/></svg>
    </button>`).join('');
  $$('#rescanList .rescan-opt').forEach(b => b.addEventListener('click', () => {
    $('#rescanScrim').hidden = true;
    rescanArea(AREAS.find(a => a.id === b.dataset.id));
  }));
  $('#rescanScrim').hidden = false;
}
$('#rescanCancel').addEventListener('click', () => { $('#rescanScrim').hidden = true; });
$('#rescanScrim').addEventListener('click', (e) => { if (e.target === $('#rescanScrim')) $('#rescanScrim').hidden = true; });
// dark mode applies to the device (the "desk" around it stays neutral)
(function(){
  const btn = $('#toggleDark');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-checked') !== 'true';
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    document.getElementById('device').setAttribute('data-theme', on ? 'dark' : 'light');
  });
})();

// ============================================================
// AR CORE — video + hotspot + state machine
// ============================================================
const clipA = $('#clipA');
const clipB = $('#clipB');
const videos = { A: clipA, B: clipB };
let activeClip = null;

function setActiveClip(letter){
  activeClip = letter;
  clipA.classList.toggle('is-visible', letter === 'A');
  clipB.classList.toggle('is-visible', letter === 'B');
  syncHotspotVisibilityForClip(letter);
  renderEdgeIndicators(letter);
}
// freeze-frame: show the exact still that the hotspot coordinates were measured
// against, so overlays always align regardless of where the video paused.
function showFreeze(src){
  const f = document.getElementById('arFreeze');
  if (!f) return;
  f.src = src; f.hidden = false;
  // crossfade in over the video (no hard cut)
  f.classList.remove('is-shown');
  requestAnimationFrame(() => requestAnimationFrame(() => f.classList.add('is-shown')));
}
function hideFreeze(){ const f = document.getElementById('arFreeze'); if (f){ f.classList.remove('is-shown'); f.hidden = true; } }
function syncHotspotVisibilityForClip(letter){
  // hotspots (and the caregiver marker) are anchored to a specific clip's
  // frame — when the camera "moves" to the other clip, findings from the
  // previous scene shouldn't stay glued to the new footage. They reappear
  // as edge indicators instead (see renderEdgeIndicators).
  AREAS.forEach(area => {
    const el = document.getElementById('hs-' + area.id);
    if (!el) return;
    el.hidden = (area.clip !== letter);
  });
  const cg = document.getElementById('viewpointMarker');
  if (cg) cg.hidden = (letter !== 'A');
  if (letter !== 'A') svgLayer.innerHTML = '';
}
function pauseAll(){ clipA.pause(); clipB.pause(); }

// play a clip forward at `rate` until currentTime >= targetTime, then pause
function playTo(letter, targetTime, rate = 0.42){
  return new Promise(resolve => {
    const v = videos[letter];
    setActiveClip(letter);
    v.playbackRate = rate;
    let done = false;
    const onTime = () => {
      if (!done && v.currentTime >= targetTime){
        done = true;
        v.pause();
        v.removeEventListener('timeupdate', onTime);
        resolve();
      }
    };
    v.addEventListener('timeupdate', onTime);
    v.play().catch(()=>{});
    // safety timeout: snap to the exact target frame so overlays line up
    setTimeout(() => {
      if(!done){
        done = true;
        v.removeEventListener('timeupdate', onTime);
        v.pause();
        const settle = () => { v.removeEventListener('seeked', settle); resolve(); };
        v.addEventListener('seeked', settle);
        try { v.currentTime = targetTime; } catch(e){ resolve(); }
        setTimeout(() => { v.removeEventListener('seeked', settle); resolve(); }, 600);
      }
    }, 4500);
  });
}
function seekTo(letter, t){
  return new Promise(resolve => {
    const v = videos[letter];
    setActiveClip(letter);
    const onSeek = () => { v.removeEventListener('seeked', onSeek); resolve(); };
    v.addEventListener('seeked', onSeek);
    try { v.currentTime = t; } catch(e){ resolve(); }
  });
}

// ---------- overlay element helpers ----------
const hotspotLayer = $('#arHotspotLayer');
const edgeLayer = $('#arEdgeLayer');
const svgLayer = $('#arSvgLayer');
const reticle = $('#arReticle');
const statusEl = $('#arStatus');
const statusText = $('#arStatusText');

function setStatus(text, mode){
  statusText.textContent = text;
  statusEl.classList.remove('is-scanning','is-alert');
  if (mode) statusEl.classList.add(mode);
}

// ---- big guidance cue (tells the caregiver what to do right now) ----
const cueEl = () => document.getElementById('arCue');
function showCue(text, iconId){
  const el = cueEl();
  el.hidden = false;
  document.getElementById('arCueText').textContent = text;
  const ic = document.getElementById('arCueIcon');
  ic.innerHTML = `<use href="#${iconId || 'i-scan'}"/>`;
}
function hideCue(){ cueEl().hidden = true; }

// ---- rotate cue → AR ----
$('#startScanBtn').addEventListener('click', async () => {
  goScreen('rotate');
  await sleep(2400);
  goScreen('ar');
});

function ensureHotspotEl(area){
  let el = document.getElementById('hs-' + area.id);
  if (!el){
    el = document.createElement('div');
    el.className = 'hotspot';
    el.id = 'hs-' + area.id;
    el.dataset.state = 'unscanned';
    el.innerHTML = `<span class="hotspot-dot"></span><span class="hotspot-label">${area.name}</span>`;
    el.addEventListener('click', () => onHotspotTap(area));
    hotspotLayer.appendChild(el);
  }
  el.style.left = area.pos.x + '%';
  el.style.top = area.pos.y + '%';
  el.hidden = false;
  return el;
}
// dim non-target hotspots during focus/scan so the selected object stands alone
function dimOtherHotspots(activeId, dim){
  AREAS.forEach(a => {
    if (a.id === activeId) return;
    const el = document.getElementById('hs-' + a.id);
    if (el) el.classList.toggle('is-dimmed', dim);
  });
}
function setHotspotState(area, state){
  const el = ensureHotspotEl(area);
  el.dataset.state = state;
  areaState[area.id].state = state;
  if (state === 'processed' || state === 'needs-attention'){
    const tone = toneVars(area.tone).cls;
    el.innerHTML = `<span class="hotspot-chip ${tone}">${toneIconInline(area.tone)}${area.label}</span>`;
  } else if (state === 'unscanned'){
    el.innerHTML = `<span class="hotspot-dot"></span><span class="hotspot-label">${area.name}</span>`;
  } else if (state === 'focused' || state === 'scanning'){
    el.innerHTML = `<span class="hotspot-dot"></span><span class="hotspot-label">${area.name}</span>`;
  }
}
function hideHotspot(area){ const el = document.getElementById('hs-' + area.id); if(el) el.hidden = true; }
function showHotspotPersisted(area){
  const el = ensureHotspotEl(area);
  el.hidden = false;
  const tone = toneVars(area.tone).cls;
  el.dataset.state = area.tone === 'good' ? 'processed' : 'needs-attention';
  el.innerHTML = `<span class="hotspot-chip ${tone}">${toneIconInline(area.tone)}${area.label}</span>`;
}

// edge indicators for areas scanned but not currently in view
function renderEdgeIndicators(currentClipLetter){
  edgeLayer.innerHTML = '';
  const doneAreas = AREAS.filter(a => (areaState[a.id].state === 'processed' || areaState[a.id].state === 'needs-attention'));
  const offFrame = doneAreas.filter(a => a.clip !== currentClipLetter);
  offFrame.forEach((a, i) => {
    const chip = document.createElement('div');
    chip.className = 'edge-chip';
    const tone = toneVars(a.tone).cls;
    chip.innerHTML = `${toneIconInline(a.tone)} ${a.name}`;
    chip.classList.add(tone);
    chip.style.left = '14px';
    chip.style.top = (100 + i * 44) + 'px';
    chip.addEventListener('click', () => openDetail(a));
    edgeLayer.appendChild(chip);
  });
}

// ---------- spatial footprint overlay (Apple Measure / blueprint style) ----------
// draws a translucent technical outline that traces the actual structure,
// with corner brackets + optional measurement ticks. Subtle, not glowing.
function drawFootprint(area, opts = {}){
  const layer = document.getElementById('arFootprintLayer');
  if (!area.footprint){ layer.innerHTML = ''; return; }
  const pts = area.footprint;
  const toneStroke = { good:'#3E8E52', warn:'#B98A1E', caution:'#C05B5B' };
  const col = opts.scanning ? '#7257D9' : (toneStroke[area.tone] || '#7257D9');
  const poly = pts.map(p => p.join(',')).join(' ');
  // bounding box for corner brackets
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
  const x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const bl = 4; // bracket length in viewbox %
  const bracket = (x,y,dx,dy)=>`<path d="M${x+dx*bl},${y} L${x},${y} L${x},${y+dy*bl}" fill="none" stroke="${col}" stroke-width="0.7" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`;
  let s = '';
  s += `<polygon points="${poly}" fill="${col}" fill-opacity="${opts.scanning?0.10:0.12}" stroke="${col}" stroke-opacity="${opts.scanning?0.5:0.8}" stroke-width="0.5" vector-effect="non-scaling-stroke" stroke-dasharray="${opts.scanning?'1.5,1.5':'0'}"/>`;
  s += bracket(x0,y0,1,1)+bracket(x1,y0,-1,1)+bracket(x0,y1,1,-1)+bracket(x1,y1,-1,-1);
  layer.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%;">${s}</svg>`;
  layer.dataset.area = area.id;
}
function clearFootprint(){ const l=document.getElementById('arFootprintLayer'); if(l){ l.innerHTML=''; delete l.dataset.area; } }
function resetZoom(){
  const freeze = document.getElementById('arFreeze');
  ['clipA','clipB'].forEach(id => { const v=document.getElementById(id); if(v) v.style.transform='translate(-50%,-50%) scale(1)'; });
  if (freeze) freeze.style.transform='translate(-50%,-50%) scale(1)';
  ['arHotspotLayer','arFootprintLayer'].forEach(id => { const l=document.getElementById(id); if(l) l.style.transform='scale(1)'; });
}

// caregiver-position concept removed — no viewpoint marker / sightline
function drawCaregiverSightline(area, visible){
  svgLayer.innerHTML = '';
  const existing = document.getElementById('viewpointMarker');
  if (existing) existing.remove();
}

// ---------- reticle placement ----------
function placeReticle(area, scale = 1){
  reticle.hidden = false;
  reticle.style.left = area.pos.x + '%';
  reticle.style.top = area.pos.y + '%';
  reticle.style.transform = `translate(-50%,-50%) scale(${scale})`;
}
function hideReticle(){ reticle.hidden = true; }

// ---------- panels ----------
const rejectToast = $('#arRejectToast');
const moveCloserPanel = $('#arMoveCloser');
const focusPanel = $('#arFocusPanel');
const focusLabel = $('#arFocusLabel');
const scanBtn = $('#arScanBtn');
const scanCopyEl = $('#arScanCopy');
const processedPanel = $('#arProcessedPanel');
const processedChip = $('#arProcessedChip');
const bottomNav = $('#arBottomNav');

function hideAllArPanels(){
  rejectToast.hidden = true;
  moveCloserPanel.hidden = true;
  focusPanel.hidden = true;
  scanCopyEl.hidden = true;
  processedPanel.hidden = true;
}

// exclusive-state controller: keeps the AR view uncluttered by only showing
// the overlays relevant to the current phase.
// phases: 'searching' | 'focusing' | 'scanning' | 'result' | 'explore'
function setArPhase(phase){
  const edge = document.getElementById('arEdgeLayer');
  const foot = document.getElementById('arFootprintLayer');
  // edge indicators (off-frame findings) only in searching + explore
  if (edge) edge.style.display = (phase === 'searching' || phase === 'explore') ? '' : 'none';
  // footprint only during scanning + result
  if (foot) foot.style.display = (phase === 'scanning' || phase === 'result' || phase === 'explore') ? '' : 'none';
  // viewpoint sightline only in result + explore
  const vp = document.getElementById('viewpointMarker');
  if (vp) vp.style.display = (phase === 'result' || phase === 'explore') ? '' : 'none';
  if (phase !== 'result' && phase !== 'explore') svgLayer.style.display='none'; else svgLayer.style.display='';
}

async function runScanMicrocopy(area){
  const steps = area.scanSteps || [];
  scanCopyEl.hidden = false;
  const nm = childName();
  // build the checklist skeleton
  scanCopyEl.innerHTML = `
    <div class="scan-title">Analysing ${area.name.toLowerCase()}</div>
    <div class="scan-steps">
      ${steps.map((st,i)=>`<div class="scan-step" data-i="${i}"><span class="scan-tick"></span><span>${st}</span></div>`).join('')}
    </div>
    <div class="scan-interpret" id="scanInterpret" hidden>
      <span class="scan-interpret-dot"></span><span>Interpreting for ${nm}…</span>
    </div>`;
  const stepEls = $$('.scan-step', scanCopyEl);
  for (const el of stepEls){
    el.classList.add('active');
    await sleep(560);
    el.classList.remove('active');
    el.classList.add('done');
    el.querySelector('.scan-tick').innerHTML = `<svg class="ic" style="width:11px;height:11px;stroke-width:3;stroke:currentColor"><use href="#i-check"/></svg>`;
  }
  // the distinct "interpreting for [child]" beat — this is the AI context layer
  $('#scanInterpret').hidden = false;
  await sleep(950);
}

// ---------- the dog / rejection target ----------
function setupRejectionTarget(){
  let el = document.getElementById('hs-reject-dog');
  if (!el){
    el = document.createElement('div');
    el.className = 'hotspot hotspot-reject';
    el.id = 'hs-reject-dog';
    el.dataset.state = 'rejected';
    el.innerHTML = `<span class="reject-ring"></span>`;
    el.style.left = '36%'; el.style.top = '58%';
    hotspotLayer.appendChild(el);
  }
  el.hidden = false;
}
function removeRejectionTarget(){ const el = document.getElementById('hs-reject-dog'); if (el) el.hidden = true; }

// ============================================================
// MAIN AR SEQUENCE — a linear guided pass through the 3 areas,
// mixing scripted timing with real user taps.
// ============================================================
let arStarted = false;
let currentAreaIndex = -1;

async function startArSequence(){
  if (arStarted) return;
  arStarted = true;
  hideAllArPanels();
  bottomNav.hidden = true;
  setStatus('Looking for an area…');
  setActiveClip('A');
  clipA.currentTime = 0;

  // Clip A scene: dog rejection, then BOTH swings + climber visible together
  await runDogRejection();
  await runSceneA();           // swings + climber (multiple hotspots, skippable)
  await transitionToClipB();
  await runSceneB();           // ground + bench (multiple hotspots, skippable)

  enterExploreState();
}

async function runDogRejection(){
  // camera pans; as it passes the dog, the system auto-detects it's not a
  // playground feature and rejects it on its own — no tap needed.
  await playTo('A', 1.2, 0.42);
  setupRejectionTarget();
  await sleep(200);
  setStatus('Checking…', 'is-scanning');
  await sleep(500);
  // auto-reject
  const el = document.getElementById('hs-reject-dog');
  if (el) el.classList.add('show-reject');
  rejectToast.hidden = false;
  setStatus('Not a playground feature', 'is-alert');
  await sleep(1900);
  rejectToast.hidden = true;
  removeRejectionTarget();
  setStatus('Looking for an area…');
  await sleep(300);
}

// Clip A shows two areas at once — the caregiver chooses order and can skip.
async function runSceneA(){
  const swings = AREAS[0], climber = AREAS[1];
  setStatus('Moving toward the play area…');
  await playTo('A', climber.focusAt, 0.42);
  showFreeze('assets/still-sceneA.jpg');
  await sleep(520);

  // show BOTH hotspots at once
  ensureHotspotEl(swings); setHotspotState(swings, 'unscanned');
  ensureHotspotEl(climber); setHotspotState(climber, 'unscanned');
  setStatus('Found 2 areas');
  setArPhase('searching');
  showCue('Tap an area to check it', 'i-scan');

  // let the caregiver tap either, in any order; skip is available per-area
  let remaining = [swings, climber];
  while (remaining.some(a => !areaState[a.id].scannedAt && !areaState[a.id].skipped)){
    const tapped = await waitForAnyHotspotTap(remaining);
    hideCue();
    if (tapped.moveCloser) await doMoveCloser(tapped);
    await doFocusAndScan(tapped);
    // refresh remaining unresolved
    const unresolved = remaining.filter(a => !areaState[a.id].scannedAt && !areaState[a.id].skipped);
    if (unresolved.length){
      setStatus(`${unresolved.length} area${unresolved.length>1?'s':''} left here`);
      setArPhase('searching');
      showCue('Tap another, or press End scan', 'i-scan');
      // allow leaving the scene early via processed "Next area" already returned;
      // if only skipped remain we exit
    }
  }
}

async function runSceneB(){
  const ground = AREAS[2], bench = AREAS[3];
  setStatus('Looking for an area…');
  await playTo('B', ground.focusAt, 0.42);
  showFreeze('assets/still-sceneB.jpg');
  await sleep(520);

  // show BOTH the ground and the bench at once (both visible in this frame)
  ensureHotspotEl(ground); setHotspotState(ground, 'unscanned');
  ensureHotspotEl(bench); setHotspotState(bench, 'unscanned');
  setStatus('Found 2 areas');
  setArPhase('searching');
  showCue('Tap an area to check it', 'i-scan');

  let remaining = [ground, bench];
  while (remaining.some(a => !areaState[a.id].scannedAt && !areaState[a.id].skipped)){
    const tapped = await waitForAnyHotspotTap(remaining);
    hideCue();
    if (tapped.moveCloser) await doMoveCloser(tapped);
    await doFocusAndScan(tapped);
    const unresolved = remaining.filter(a => !areaState[a.id].scannedAt && !areaState[a.id].skipped);
    if (unresolved.length){
      setStatus(`${unresolved.length} area${unresolved.length>1?'s':''} left here`);
      setArPhase('searching');
      showCue('Tap the other area, or press End scan', 'i-scan');
    }
  }
}

function waitForAnyHotspotTap(areas){
  return new Promise(resolve => {
    const handlers = [];
    areas.forEach(area => {
      const el = ensureHotspotEl(area);
      if (areaState[area.id].scannedAt || areaState[area.id].skipped) return;
      const h = () => { cleanup(); resolve(area); };
      el.addEventListener('click', h);
      handlers.push([el, h]);
    });
    function cleanup(){ handlers.forEach(([el,h]) => el.removeEventListener('click', h)); }
  });
}

async function runArea(index){
  const area = AREAS[index];
  currentAreaIndex = index;

  // --- FIND: pan until this area is visible, offering the rejection
  //     target only during the swings approach (dog is only there) ---
  if (index === 0){
    setupRejectionTarget();
    await playTo('A', area.enterAt, 0.42);
    showCue('Try tapping the dog', 'i-explore');
    // small pause window so the dog target is comfortably tappable
    await sleep(2800);
    hideCue();
    removeRejectionTarget();
  }

  setStatus(`Moving toward the ${area.name.toLowerCase()}…`);
  await playTo(area.clip, area.focusAt, 0.42);
  ensureHotspotEl(area);
  setHotspotState(area, 'unscanned');
  setStatus('Found something');
  showCue(`Tap ${area.name} to check it`, 'i-scan');

  // wait for the user to tap the hotspot to begin focusing
  await waitForHotspotTap(area);
  hideCue();

  if (area.moveCloser){
    await doMoveCloser(area);
  }

  await doFocusAndScan(area);
}

function waitForHotspotTap(area){
  return new Promise(resolve => {
    const el = ensureHotspotEl(area);
    const handler = () => { el.removeEventListener('click', handler); resolve(); };
    el.addEventListener('click', handler);
    el._resolveTap = handler;
  });
}

async function doMoveCloser(area){
  setHotspotState(area, 'focused');
  setStatus('Too far to read clearly', 'is-alert');
  // show a framing guide over the view
  const guide = document.createElement('div');
  guide.className = 'frame-guide';
  guide.id = 'frameGuide';
  document.querySelector('.ar-media').appendChild(guide);
  showCue('Get the climber inside the frame', 'i-move');
  moveCloserPanel.hidden = false;
  await waitForEvent($('#arMoveCloserBtn'), 'click');
  hideCue();
  moveCloserPanel.hidden = true;
  // zoom the visible layer (freeze image if shown, else the video) toward the target
  const freeze = document.getElementById('arFreeze');
  const zoomEl = (freeze && !freeze.hidden) ? freeze : videos[area.clip];
  zoomEl.style.transformOrigin = `${area.pos.x}% ${area.pos.y}%`;
  zoomEl.style.transition = 'transform 640ms cubic-bezier(.2,.9,.25,1.2)';
  zoomEl.style.transform = 'translate(-50%,-50%) scale(1.4)';
  // also nudge the hotspot/footprint layer so the marker tracks the zoom
  const hl = document.getElementById('arHotspotLayer');
  const fl = document.getElementById('arFootprintLayer');
  [hl, fl].forEach(l => { if(l){ l.style.transformOrigin = `${area.pos.x}% ${area.pos.y}%`; l.style.transition='transform 640ms cubic-bezier(.2,.9,.25,1.2)'; l.style.transform='scale(1.4)'; } });
  const g = document.getElementById('frameGuide');
  if (g){ g.style.transition='opacity 300ms'; g.style.opacity='0'; setTimeout(()=>g.remove(),320); }
  setStatus('That looks clearer', null);
  await sleep(680);
}

async function doFocusAndScan(area){
  setHotspotState(area, 'focused');
  dimOtherHotspots(area.id, true);
  placeReticle(area);
  focusLabel.textContent = `Hold steady on the ${area.name.toLowerCase()}`;
  focusPanel.hidden = false;
  setStatus('Ready to scan');
  setArPhase('focusing');
  showCue('Tap Scan to check it', 'i-scan');

  // race scan vs skip
  const choice = await Promise.race([
    waitForEvent(scanBtn, 'click').then(() => 'scan'),
    waitForEvent($('#arSkipBtn'), 'click').then(() => 'skip'),
  ]);
  hideCue();
  focusPanel.hidden = true;

  if (choice === 'skip'){
    hideReticle();
    setHotspotState(area, 'unscanned');
    dimOtherHotspots(area.id, false);
    areaState[area.id].skipped = true;
    setStatus(`Skipped the ${area.name.toLowerCase()}`);
    return 'skip';
  }

  setHotspotState(area, 'scanning');
  reticle.classList.add('is-scanning');   // scan-sweep animation on the target
  setArPhase('scanning');
  drawFootprint(area, { scanning:true });
  setStatus('Reading this area…', 'is-scanning');
  await runScanMicrocopy(area);
  scanCopyEl.hidden = true;

  setStatus('Working out what it means…', 'is-scanning');
  await sleep(700);

  // reveal
  setHotspotState(area, area.tone === 'good' ? 'processed' : 'needs-attention');
  setArPhase('result');
  reticle.classList.remove('is-scanning');
  hideReticle();
  drawFootprint(area, { scanning:false });
  areaState[area.id].scannedAt = 'today';
  areaState[area.id].skipped = false;
  processedChip.className = 'processed-chip ' + toneVars(area.tone).cls;
  processedChip.innerHTML = `${toneIconInline(area.tone)} ${area.label.toUpperCase()}`;
  processedPanel.hidden = false;
  setStatus(area.tone === 'good' ? 'Area understood' : 'Area understood', area.tone === 'good' ? null : 'is-alert');

  if (false){
    // caregiver-position concept removed
  }

  dimOtherHotspots(area.id, false);
  await waitForProcessedAction(area);
  processedPanel.hidden = true;
  return 'scanned';
}

function waitForProcessedAction(area){
  return new Promise(resolve => {
    const viewDetail = $('#arViewDetail');
    const scanNext = $('#arScanNext');
    const cleanup = () => {
      viewDetail.removeEventListener('click', onDetail);
      scanNext.removeEventListener('click', onNext);
    };
    const onDetail = () => { openDetail(area); };
    const onNext = () => { cleanup(); clearFootprint(); resetZoom(); resolve(); };
    viewDetail.addEventListener('click', onDetail);
    scanNext.addEventListener('click', onNext);
  });
}

async function transitionToClipB(){
  hideCue();
  clearFootprint();
  svgLayer.innerHTML = '';
  setArPhase('searching');
  // branded transition overlay covers the cut so it reads intentionally
  const t = document.getElementById('arTransition');
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('show'));
  await sleep(520);
  // swap clips while covered
  clipA.pause();
  hideFreeze();
  await seekTo('B', 0);
  setActiveClip('B');
  setStatus('Looking for an area…');
  await sleep(360);
  t.classList.remove('show');
  await sleep(360);
  t.hidden = true;
}

function enterExploreState(){
  setStatus('All done. Tap a finding, or press End scan');
  hideAllArPanels();
  hideCue();
  setArPhase('explore');
  renderEdgeIndicators(activeClip);
  showCue('Tap “End scan” to see your results', 'i-summary');
}

// edge indicators are kept in sync automatically inside setActiveClip(),
// but exposed here in case a screen re-entry needs an explicit refresh
// without changing the active clip.
function refreshExploreView(){
  renderEdgeIndicators(activeClip);
}

// hotspot tap after processed (in explore / persistent state) -> open detail
function onHotspotTap(area){
  const st = areaState[area.id].state;
  if (st === 'processed' || st === 'needs-attention'){
    openDetail(area);
  }
}

// ============================================================
// HOTSPOT DETAIL SHEET
// ============================================================
const detailSheet = $('#detailSheet');
const detailContent = $('#detailContent');

function detailHtml(area, opts = {}){
  const tone = toneVars(area.tone).cls;
  const relate = area.relate(profile);
  return `
    <div class="detail-head">
      <h3>${area.name}</h3>
      <button class="detail-close" id="detailCloseBtn"><svg class="ic ic-sm"><use href="#i-close"/></svg></button>
    </div>
    <span class="chip ${tone}" style="margin-bottom:12px;">${toneIconInline(area.tone)}${area.label}</span>
    <div class="wire-frame">${wireframeSVG(area, 220)}</div>
    <div class="stat-row">
      ${Object.entries(area.stats).map(([k,v]) => `<div class="stat-box"><span class="stat-ic"><svg class="ic ic-sm"><use href="#${statIcon(k)}"/></svg></span><div class="stat-k">${k}</div><div class="stat-v">${v}</div></div>`).join('')}
    </div>
    <div class="detail-section">
      <div class="ds-label"><span class="ds-ic ds-ic-noticed"><svg class="ic ic-sm"><use href="#i-explore"/></svg></span>What PlayLens noticed</div>
      <ul class="notice-list">${area.notice.map(n => `<li>${n}</li>`).join('')}</ul>
    </div>
    <div class="detail-section">
      <div class="ds-label"><span class="ds-ic ds-ic-context"><svg class="ic ic-sm"><use href="#i-child"/></svg></span>For ${childName()}</div>
      <div class="context-box">${relate}</div>
    </div>
    ${area.response ? `<div class="detail-section"><div class="ds-label"><span class="ds-ic ds-ic-do"><svg class="ic ic-sm"><use href="#i-check"/></svg></span>What you could do</div><div class="response-box">${area.response}</div></div>` : ''}
    ${area.alternate ? `<div class="detail-section"><div class="ds-label"><span class="ds-ic ds-ic-alt"><svg class="ic ic-sm"><use href="#i-map"/></svg></span>Better nearby</div><div class="alt-box"><svg class="ic ic-sm"><use href="#i-explore"/></svg><div><b>${area.alternate.title}</b><p>${area.alternate.text}</p></div></div></div>` : ''}
    ${area.confidence ? `<div class="confidence-row"><div class="conf-head"><svg class="ic ic-sm"><use href="#i-help"/></svg><span>Confidence: <b>${area.confidence}</b></span></div><p>${area.confidenceNote}</p></div>` : ''}
    ${opts.rescan ? `<button class="btn btn-accent btn-block" id="detailRescanBtn" style="margin-top:6px;"><svg class="ic ic-sm" style="stroke:#fff"><use href="#i-scan"/></svg> Scan this area again</button>` : ''}
  `;
}

function openDetail(area, opts = {}){
  detailContent.innerHTML = `<div class="detail-grab"></div>` + detailHtml(area, opts);
  detailSheet.hidden = false;
  $('#detailCloseBtn').addEventListener('click', closeDetail);
  if (opts.rescan && $('#detailRescanBtn')){
    $('#detailRescanBtn').addEventListener('click', () => { closeDetail(); rescanArea(area); });
  }
}
function closeDetail(){ detailSheet.hidden = true; }
$('#detailScrim').addEventListener('click', closeDetail);

// ============================================================
// END SCAN
// ============================================================
const endScanScrim = $('#endScanScrim');
$('#arEndScan').addEventListener('click', () => { endScanScrim.hidden = false; });
$('#endScanCancel').addEventListener('click', () => { endScanScrim.hidden = true; });
$('#endScanConfirm').addEventListener('click', () => { endScanScrim.hidden = true; goScreen('assessment'); });

// ============================================================
// BLUEPRINT (spatial map)
// ============================================================
const ZONE_LAYOUT = {
  boundary: { x: 16, y: 20, w: 288, h: 380 },
  swings:  { x: 92,  y: 150 },
  climber: { x: 214, y: 175 },
  surface: { x: 150, y: 265 },
  bench:   { x: 120, y: 350 },   // "YOU" viewpoint near bench
};
const toneHex = { good: '#C7E5CC', warn: '#F4E8C9', caution: '#F2C7C7' };
const toneInk = { good: '#2B5E36', warn: '#7A5B0E', caution: '#8C2E2E' };
const toneSoft = { good: '#EAF5EC', warn: '#FBF3DD', caution: '#FBE4E4' };

function updateMapSummary(){
  const card = document.getElementById('mapCard');
  const sub = document.getElementById('mapSubtitle');
  const scanned = AREAS.filter(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  const good = scanned.filter(a=>a.tone==='good').length;
  const attention = scanned.filter(a => a.tone !== 'good').length;
  if (sub) sub.textContent = `${scanned.length} area${scanned.length!==1?'s':''} checked · updated today`;
  if (!card) return;
  if (!scanned.length){
    card.innerHTML = `<div class="map-stood-body"><b>Nothing scanned yet</b><span>Findings will appear as you scan.</span></div>`;
    return;
  }
  const goodStarts = scanned.filter(a=>a.tone==='good' && a.id!=='bench').length;
  card.innerHTML = `
    <div class="map-stood-grabber"></div>
    <div class="map-stood-body">
      <b>A few things stood out</b>
      <span>${attention} area${attention!==1?'s':''} to keep an eye on · ${goodStarts||1} clear starting point</span>
      <p class="map-stood-hint">Tap an area on the map to explore it.</p>
    </div>
    <span class="map-stood-chev"><svg class="ic"><use href="#i-chevron"/></svg></span>
  `;
}
let mapBuilt = false;
function maybeAnimateMapBuild(){
  const frame = document.querySelector('.blueprint-frame');
  const scanned = AREAS.some(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  if (!frame || !scanned || mapBuilt) return;
  mapBuilt = true;
  frame.classList.add('building');
  const note = document.createElement('div');
  note.className = 'map-building-note';
  note.innerHTML = `<svg class="ic ic-sm"><use href="#i-scan"/></svg> Building spatial record…`;
  frame.appendChild(note);
  setTimeout(() => { note.remove(); }, 1500);
  setTimeout(() => { frame.classList.remove('building'); }, 2200);
}

function renderBlueprint(){
  const svg = $('#blueprintSvg');
  updateMapSummary();
  maybeAnimateMapBuild();
  const dark = document.getElementById('device').getAttribute('data-theme') === 'dark';
  const treeFill = dark ? '#2C3A2E' : '#CBD9BE';
  const treeStroke = dark ? '#3E5140' : '#9DB389';
  const paperGround = dark ? '#20241C' : '#F0EAD8';
  const pathFill = dark ? '#2A2E27' : '#E4DCC8';
  const line = dark ? 'rgba(243,241,236,.5)' : 'rgba(60,54,40,.5)';
  const blob = { good:'#BFE0C4', warn:'#F1E3B6', caution:'#F2C4BE' };
  let s = '';

  // ground base
  s += `<rect x="0" y="0" width="320" height="420" fill="${paperGround}"/>`;

  // winding path (organic)
  s += `<path d="M 60 420 C 60 320 40 250 90 210 C 150 160 120 90 210 70 C 260 60 300 90 300 130"
        fill="none" stroke="${pathFill}" stroke-width="30" stroke-linecap="round" opacity=".9"/>`;
  s += `<path d="M 60 420 C 60 320 40 250 90 210 C 150 160 120 90 210 70 C 260 60 300 90 300 130"
        fill="none" stroke="${line}" stroke-width="1" stroke-dasharray="2 5" opacity=".4"/>`;

  // tone blobs under each zone
  AREAS.forEach(a => {
    const z = ZONE_LAYOUT[a.id]; if(!z || a.id==='bench') return;
    const st = areaState[a.id].state;
    if(!['processed','needs-attention'].includes(st)) return;
    s += `<ellipse cx="${z.x}" cy="${z.y}" rx="58" ry="46" fill="${blob[a.tone]}" opacity=".5"/>`;
  });
  // caregiver viewpoint cone (purple) from YOU toward the play areas
  const you = ZONE_LAYOUT.bench;
  s += `<path d="M ${you.x} ${you.y} L ${you.x-46} ${you.y-70} L ${you.x+34} ${you.y-86} Z" fill="#B9A6E8" opacity=".28"/>`;

  // trees (clusters)
  const trees = [[40,70],[70,55],[250,60],[285,110],[300,200],[60,300],[40,360],[280,320],[250,380],[160,45],[120,300]];
  trees.forEach(([tx,ty],i)=>{
    const r = 16 + (i%3)*4;
    s += `<circle cx="${tx}" cy="${ty}" r="${r}" fill="${treeFill}" stroke="${treeStroke}" stroke-width="1.2"/>`;
    s += `<circle cx="${tx-4}" cy="${ty-3}" r="${r*0.5}" fill="none" stroke="${treeStroke}" stroke-width=".8" opacity=".6"/>`;
  });

  // schematic equipment drawings at each zone
  const eq = {
    swings: (z,c)=>`<path d="M${z.x-20} ${z.y+14} L${z.x-10} ${z.y-16} L${z.x+10} ${z.y-16} L${z.x+20} ${z.y+14} M${z.x-10} ${z.y-16} L${z.x+10} ${z.y-16} M${z.x-4} ${z.y-15} l-2 22 M${z.x+4} ${z.y-15} l2 22 M${z.x-9} ${z.y+6} h6 M${z.x+3} ${z.y+6} h6" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    climber: (z,c)=>`<circle cx="${z.x}" cy="${z.y}" r="26" fill="none" stroke="${c}" stroke-width="2"/><path d="M${z.x-26} ${z.y} h52 M${z.x} ${z.y-26} v52 M${z.x-18} ${z.y-18} L${z.x+18} ${z.y+18} M${z.x+18} ${z.y-18} L${z.x-18} ${z.y+18}" stroke="${c}" stroke-width="1.3"/>`,
    surface: (z,c)=>Array.from({length:9}).map((_,i)=>`<circle cx="${z.x-22+(i%3)*22}" cy="${z.y-12+Math.floor(i/3)*14}" r="2.6" fill="${c}" opacity=".8"/>`).join(''),
  };

  // dashed connector arrows between the scanned areas (swings -> climber -> ground -> you)
  const order = ['swings','climber','surface'].filter(id=>['processed','needs-attention'].includes(areaState[id].state));
  for (let i=0;i<order.length-1;i++){
    const a=ZONE_LAYOUT[order[i]], b=ZONE_LAYOUT[order[i+1]];
    s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${dark?'#F3F1EC':'#2B2B2B'}" stroke-width="1.4" stroke-dasharray="4 4" opacity=".55" marker-end="url(#arrow)"/>`;
  }
  // you -> ground connector
  if (areaState.surface.scannedAt){
    s += `<line x1="${you.x}" y1="${you.y}" x2="${ZONE_LAYOUT.surface.x}" y2="${ZONE_LAYOUT.surface.y}" stroke="${dark?'#F3F1EC':'#2B2B2B'}" stroke-width="1.4" stroke-dasharray="4 4" opacity=".55" marker-end="url(#arrow)"/>`;
  }
  s = `<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0 0 L5 3 L0 6" fill="none" stroke="${dark?'#F3F1EC':'#2B2B2B'}" stroke-width="1"/></marker></defs>` + s;

  // equipment glyphs
  AREAS.forEach(a=>{
    const z=ZONE_LAYOUT[a.id]; if(!z) return;
    const scanned=['processed','needs-attention'].includes(areaState[a.id].state);
    const c = scanned ? toneInk[a.tone] : line;
    if (eq[a.id]) s += `<g class="bp-zone" data-id="${a.id}" style="cursor:pointer">${eq[a.id](z,c)}</g>`;
  });

  svg.innerHTML = s;
  // numbered pills + YOU marker as HTML overlays for crisp text
  renderMapPills(dark);

  // legend
  const legend = $('#blueprintLegend');
  if (legend) legend.innerHTML = [
    ['Checked','Looks good','good','i-check'],
    ['Needs support','Something to consider','warn','i-alert'],
    ['Take care','Environmental concern','caution','i-flag'],
    ['Viewpoint','Caregiver support','view',null],
  ].map(([t,sub,tone,ic])=>{
    const dot = tone==='view' ? '#8B72E0' : toneInk[tone];
    return `<div class="map-legend-item"><span class="map-legend-dot" style="background:${dot}"></span><div><b>${t}</b><span>${sub}</span></div></div>`;
  }).join('');

  $$('.bp-zone', svg).forEach(g=>g.addEventListener('click',()=>showZoneDesc(g.dataset.id)));
  const mc = document.getElementById('mapCard');
  if (mc) mc.onclick = () => goScreen('assessment');
}

function renderMapPills(dark){
  const layer = document.getElementById('mapPills') || (()=>{ const d=document.createElement('div'); d.id='mapPills'; d.className='map-pills'; document.querySelector('.blueprint-frame').appendChild(d); return d; })();
  const num = {swings:'01',climber:'02',surface:'03'};
  const W=320,H=420;
  let html='';
  AREAS.forEach(a=>{
    const z=ZONE_LAYOUT[a.id]; if(!z||!num[a.id]) return;
    if(!['processed','needs-attention'].includes(areaState[a.id].state)) return;
    const cls=toneVars(a.tone).cls;
    const icon = a.tone==='good'?'i-check':a.tone==='warn'?'i-alert':'i-flag';
    html += `<button class="map-pill ${cls}" data-id="${a.id}" style="left:${z.x/W*100}%; top:${(z.y-46)/H*100}%;">
      <span class="map-pill-num">${num[a.id]}</span><span class="map-pill-label">${a.name.toUpperCase()}</span>
      <svg class="ic map-pill-ic"><use href="#${icon}"/></svg></button>`;
  });
  // YOU
  const you=ZONE_LAYOUT.bench;
  html += `<div class="map-pill map-pill-you" style="left:${you.x/W*100}%; top:${(you.y+8)/H*100}%;">
    <span class="map-pill-num">04</span><svg class="ic map-pill-ic" style="stroke:#7257D9"><use href="#i-child"/></svg><span class="map-pill-label">YOU</span></div>`;
  layer.innerHTML = html;
  $$('.map-pill[data-id]', layer).forEach(p=>p.addEventListener('click',()=>showZoneDesc(p.dataset.id)));
}

// zonal description card shown when a map component is tapped
function showZoneDesc(id){
  const wrap = $('#zoneDesc');
  const area = AREAS.find(a => a.id === id);
  const scanned = ['processed','needs-attention'].includes(areaState[id].state);
  if (!scanned){
    wrap.innerHTML = `<div class="zone-desc zone-desc-empty">
      <div class="zone-desc-head"><span class="zone-desc-icon" style="background:var(--bg);color:var(--ink-55);box-shadow:inset 0 0 0 1px var(--ink-12)"><svg class="ic"><use href="#i-${area.id==='swings'?'swing':area.id==='climber'?'climber':area.id==='bench'?'bench':'ground'}"/></svg></span><b>${area.name}</b><button class="zd-close" onclick="this.closest('.zone-desc').remove()"><svg class="ic ic-sm"><use href="#i-close"/></svg></button></div>
      <p>${area.zoneDesc}</p>
      <p style="color:var(--ink-55)">Not scanned yet.</p>
    </div>`;
    return;
  }
  const t = toneVars(area.tone).cls;
  wrap.innerHTML = `<div class="zone-desc">
    <div class="zone-desc-head">
      <span class="zone-desc-icon ${t}"><svg class="ic"><use href="#${toneIconId(area.tone)}"/></svg></span>
      <b>${area.name}</b>
      <span class="chip ${t}" style="margin-left:8px;">${area.label}</span>
      <button class="zd-close" onclick="this.closest('.zone-desc').remove()"><svg class="ic ic-sm"><use href="#i-close"/></svg></button>
    </div>
    <p>${area.zoneDesc}</p>
    <button class="btn btn-primary btn-sm zd-open" data-open="${id}">See full detail</button>
  </div>`;
  $('.zd-open', wrap).addEventListener('click', () => { wrap.innerHTML=''; openDetail(area, { rescan:true }); });
}

// ============================================================
// ASSESSMENT
// ============================================================
function computeScore(){
  // no longer a numeric score — kept for compatibility, returns null
  return null;
}
// classify scanned areas into good vs needs-attention (bench counts as a normal good finding)
function classifyAreas(){
  const scanned = AREAS.filter(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  const findings = scanned;
  const good = findings.filter(a => a.tone === 'good');
  const attention = findings.filter(a => a.tone !== 'good');
  return { scanned, findings, viewpoints: [], good, attention };
}

function renderAssessment(){
  const body = $('#assessmentBody');
  const { scanned, findings, viewpoints, good, attention } = classifyAreas();

  if (!scanned.length){
    body.innerHTML = `<div class="home-empty" style="padding-top:60px;"><svg class="ic"><use href="#i-summary"/></svg><p class="body-text">Scan a few areas first.<br>Your summary builds as you go.</p></div>`;
    return;
  }

  // qualitative verdict — no misleading numeric score
  let vTone, vIcon, vTitle, vText;
  if (attention.length === 0){
    vTone='tone-good'; vIcon='i-check';
    vTitle = `Good fit for ${childName()}`;
    vText = 'Everything you checked looks like a good fit.';
  } else {
    const worst = findings.some(a=>a.tone==='caution') ? 'caution' : 'warn';
    vTone = worst==='caution'?'tone-caution':'tone-warn';
    vIcon = worst==='caution'?'i-flag':'i-alert';
    vTitle = `${attention.length} area${attention.length>1?'s':''} to keep an eye on`;
    vText = good.length
      ? `${good.length} look${good.length>1?'':'s'} like a good starting point.`
      : `The rest is a good fit for ${childName()}.`;
  }

  const nm = childName();
  // the recommended starting point = first good, non-viewpoint area (swings)
  const starter = good.find(a => a.id !== 'bench') || good[0];
  const watchAreas = attention;  // climber, ground
  const viewpoint = scanned.find(a => a.id === 'bench');
  const heroTone = starter ? 'tone-good' : (watchAreas.some(a=>a.tone==='caution')?'tone-caution':'tone-warn');

  // numbered action steps
  const steps = [];
  if (starter) steps.push({ n:1, title:`Start with the ${starter.name.toLowerCase()}`, text:`A clear, lower-demand option for ${nm}.` });
  const climber = scanned.find(a=>a.id==='climber' && a.tone!=='good');
  if (climber) steps.push({ n:steps.length+1, title:`Stay near the climber's entry`, text:'Be ready to offer support if needed.' });
  const ground = scanned.find(a=>a.id==='surface' && a.tone!=='good');
  if (ground) steps.push({ n:steps.length+1, title:'Take the smoother path', text:`Help ${nm} avoid the uneven areas.` });

  body.innerHTML = `
    ${starter ? `
    <button class="rec-hero" data-area="${starter.id}">
      <div class="rec-hero-text">
        <span class="rec-hero-eyebrow"><span class="rec-hero-dot"></span>GOOD START</span>
        <h2 class="rec-hero-title">Start with the ${starter.name.toLowerCase()}.</h2>
        <p class="rec-hero-sub">${starter.relate ? shortRelate(starter) : 'A clear, lower-demand option.'}</p>
      </div>
      <img class="rec-hero-img" src="${starter.wireImg || starter.still}" alt="">
    </button>` : ''}

    ${watchAreas.length ? `
    <div class="rec-sec-title">Worth a closer look</div>
    <div class="rec-list">
      ${watchAreas.map(a => `
        <button class="rec-row" data-area="${a.id}">
          <img class="rec-row-img" src="${a.wireImg || a.still}" alt="">
          <div class="rec-row-body">
            <div class="rec-row-cat">${a.name.toUpperCase()}</div>
            <div class="rec-row-title">${a.label} <svg class="ic ic-sm rec-row-toneic ${toneVars(a.tone).cls}"><use href="#${toneIconId(a.tone)}"/></svg></div>
            <div class="rec-row-sub">${a.notice.slice(0,2).join(' · ')}</div>
          </div>
          <svg class="ic ic-sm chev"><use href="#i-chevron"/></svg>
        </button>
      `).join('')}
    </div>` : ''}

    ${viewpoint ? `
    <div class="rec-sec-title">A useful place to watch from</div>
    <div class="rec-list">
      <button class="rec-row" data-area="${viewpoint.id}">
        <img class="rec-row-img" src="${viewpoint.wireImg || viewpoint.still}" alt="">
        <div class="rec-row-body">
          <div class="rec-row-cat"><svg class="ic" style="width:12px;height:12px;vertical-align:-1px">${''}</svg>BENCH</div>
          <div class="rec-row-title">Good view <svg class="ic ic-sm" style="color:var(--purple)"><use href="#i-watch"/></svg></div>
          <div class="rec-row-sub">Clear view of the play areas</div>
        </div>
        <svg class="ic ic-sm chev"><use href="#i-chevron"/></svg>
      </button>
    </div>` : ''}

    <div class="rec-sec-title">What you could do</div>
    <div class="rec-steps">
      ${steps.map(s => `
        <div class="rec-step">
          <span class="rec-step-num">${s.n}</span>
          <div><b>${s.title}</b><p>${s.text}</p></div>
        </div>
      `).join('')}
    </div>

    <div class="rec-guide" id="scoreInfo">
      <svg class="ic ic-sm"><use href="#i-help"/></svg>
      <div><b>PlayLens is a guide, not a safety rating.</b><span>It can miss things, so always use your own judgement.</span></div>
    </div>
  `;

  const si = $('#scoreInfo');
  if (si) si.addEventListener('click', () => showInfo('How this works', "PlayLens looks at what it noticed in each area and compares it with what you shared about your child. It's a guide to help you decide where to look first. It is not a safety rating, and it can miss things."));
  $$('[data-area]', body).forEach(t => t.addEventListener('click', () => {
    const a = AREAS.find(x => x.id === t.dataset.area);
    openDetail(a);
  }));
  $$('[data-go]', body).forEach(b => b.addEventListener('click', () => goScreen(b.getAttribute('data-go'))));
}
function shortRelate(area){
  const map = {
    swings: `They have a clear approach and lower reach demand for ${childName()}.`,
    bench: `A good place to sit and keep ${childName()} in view.`,
  };
  return map[area.id] || area.notice.join(' · ');
}

// compact spatial diagram for the assessment (connects findings to the space)
function drawAssessMiniMap(){
  const svg = document.getElementById('assessMiniSvg');
  if (!svg) return;
  const pos = { swings:{x:70,y:100}, climber:{x:170,y:55}, surface:{x:255,y:105} };
  const toneSoft = { good:'#EAF5EC', warn:'#FBF3DD', caution:'#FBE4E4' };
  const toneInk = { good:'#3E8E52', warn:'#B98A1E', caution:'#C05B5B' };
  let s = `<path d="M40 130 Q40 60 90 45 L280 45" fill="none" stroke="rgba(23,26,33,.1)" stroke-width="9" stroke-linecap="round"/>`;
  AREAS.forEach(a => {
    const st = areaState[a.id].state;
    if (!['processed','needs-attention'].includes(st)) return;
    const p = pos[a.id]; if (!p) return;
    s += `<circle cx="${p.x}" cy="${p.y}" r="17" fill="${toneSoft[a.tone]}" stroke="${toneInk[a.tone]}" stroke-width="1.5"/>`;
    s += `<text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="14" font-weight="800" fill="${toneInk[a.tone]}">${a.tone==='good'?'✓':a.tone==='warn'?'△':'!'}</text>`;
    s += `<text x="${p.x}" y="${p.y+32}" text-anchor="middle" font-size="10" font-family="Inter" font-weight="700" fill="#171A21">${a.name}</text>`;
  });
  // viewpoint dot for climber
  if (areaState.climber.state==='needs-attention'){
    const c=pos.climber; s+=`<circle cx="${c.x-30}" cy="${c.y+34}" r="5" fill="#7257D9" stroke="#fff" stroke-width="1.5"/><line x1="${c.x-30}" y1="${c.y+34}" x2="${c.x}" y2="${c.y}" stroke="#7257D9" stroke-width="1" stroke-dasharray="3,3" opacity=".5"/>`;
  }
  svg.innerHTML = s;
}
function toneIconId(tone){ return tone==='good'?'i-check':tone==='warn'?'i-alert':'i-flag'; }
// wireframe "after" image (pre-made, cropped to the structure)
function wireframeSVG(area, h){
  return `
    <div class="wire-media" style="${h?`height:${h}px;`:''}">
      <img class="wire-img" src="${area.wireImg || area.still}" alt="${area.name}">
    </div>`;
}
function statIcon(k){
  const m = { Reach:'i-climber', Entry:'i-move', Visibility:'i-watch', Surface:'i-ground', Slope:'i-move', View:'i-watch', Shade:'i-help', Distance:'i-map' };
  return m[k] || 'i-explore';
}

function recommendationCards(){
  const recs = [];
  const nm = childName();
  const done = (id) => ['processed','needs-attention'].includes(areaState[id].state);
  if (done('swings')) recs.push({icon:'i-check', tone:'tone-good', title:'Start at the swings', text:`An easy first win for ${nm}.`});
  if (done('bench')) recs.push({icon:'i-watch', tone:'tone-good', title:'Watch from the bench', text:'Clear view of the play areas, in the shade.'});
  if (areaState.climber.state === 'needs-attention') recs.push({icon:'i-alert', tone:'tone-warn', title:'Stay close at the climber', text:'Higher reach. Or try the swings instead.'});
  if (areaState.surface.state === 'needs-attention') recs.push({icon:'i-flag', tone:'tone-caution', title:'Mind the uneven ground', text:'Use the paved path alongside it.'});
  if (!recs.length) return `<div class="rec-simple"><span class="rec-icon tone-good"><svg class="ic"><use href="#i-check"/></svg></span><div><b>All good</b><p>Nothing needs special care today.</p></div></div>`;
  return recs.map(r => `<div class="rec-simple"><span class="rec-icon ${r.tone}"><svg class="ic"><use href="#${r.icon}"/></svg></span><div><b>${r.title}</b><p>${r.text}</p></div></div>`).join('');
}

// ============================================================
// SAVED PLAYGROUND
// ============================================================
function renderSaved(){
  const body = $('#savedBody');
  const scanned = AREAS.filter(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  if (!scanned.length){
    body.innerHTML = `<div style="padding-top:40px; text-align:center;"><p class="body-text">Finish a scan to save this playground.</p></div>`;
    return;
  }
  body.innerHTML = `
    <div class="card saved-card">
      <div class="saved-mini-map"><svg viewBox="0 0 320 400" width="100%" height="100%" id="savedMiniSvg"></svg>
        <span class="saved-areas-badge">${scanned.length} areas</span>
      </div>
      <div class="saved-meta">
        <div><b>Playground map</b><span>Last checked today</span></div>
      </div>
      <div class="saved-actions">
        <button class="saved-action" data-go="ar"><svg class="ic"><use href="#i-explore"/></svg><span>Live view</span></button>
        <button class="saved-action" data-go="blueprint"><svg class="ic"><use href="#i-map"/></svg><span>Open map</span></button>
        <button class="saved-action" id="savedReplayBtn"><svg class="ic"><use href="#i-play"/></svg><span>Replay</span></button>
        <button class="saved-action" id="savedRescanBtn"><svg class="ic"><use href="#i-scan"/></svg><span>Rescan</span></button>
      </div>
    </div>
    <div class="home-section-label" style="margin-top:26px;">Areas</div>
    ${scanned.map(a => `
      <div class="saved-area-row">
        <span style="font-weight:700; font-size:14.5px;">${a.name}</span>
        <span class="chip ${toneVars(a.tone).cls}">${toneIconInline(a.tone)}${a.label}</span>
      </div>
    `).join('')}
  `;
  $$('[data-go]', body).forEach(btn => btn.addEventListener('click', () => goScreen(btn.getAttribute('data-go'))));
  $('#savedReplayBtn').addEventListener('click', () => goScreen('replay'));
  $('#savedRescanBtn').addEventListener('click', () => {
    showRescanPicker();
  });

  // draw a small static copy of the blueprint into the mini map
  renderBlueprint();
  const full = $('#blueprintSvg').innerHTML;
  const mini = $('#savedMiniSvg');
  if (mini) mini.innerHTML = full;
}

// ============================================================
// RESCAN
// ============================================================
async function rescanArea(area){
  goScreen('ar');
  await sleep(200);
  hideAllArPanels();
  bottomNav.hidden = true;
  setStatus(`Rescanning ${area.name.toLowerCase()}…`);
  await seekTo(area.clip, area.focusAt);
  setActiveClip(area.clip);
  setHotspotState(area, 'focused');
  placeReticle(area);
  focusLabel.textContent = `Rescan ${area.name.toLowerCase()}. Centre it again to confirm`;
  focusPanel.hidden = false;
  await waitForEvent(scanBtn, 'click');
  focusPanel.hidden = true;
  hideReticle();
  setHotspotState(area, 'scanning');
  setStatus('Scanning…', 'is-scanning');
  await runScanMicrocopy(area);
  scanCopyEl.hidden = true;
  setStatus('Interpreting this area…', 'is-scanning');
  await sleep(900);
  areaState[area.id].rescans++;
  setHotspotState(area, area.tone === 'good' ? 'processed' : 'needs-attention');
  processedChip.className = 'processed-chip ' + toneVars(area.tone).cls;
  processedChip.innerHTML = `<span class="sym">${area.symbol}</span> ${area.label.toUpperCase()} <span style="opacity:.6; font-weight:600;">· updated</span>`;
  processedPanel.hidden = false;
  setStatus('Finding reconfirmed');
  // navbar intentionally hidden during scanning
  await waitForProcessedAction(area);
  processedPanel.hidden = true;
  enterExploreState();
}

// ============================================================
// REPLAY — a recorded scan session with timeline + scrubber
// ============================================================
let replayIndex = 0;
let replayPlaying = false;
let replayTimer = null;

function replayEvents(){
  const scanned = AREAS.filter(a => ['processed','needs-attention'].includes(areaState[a.id].state));
  // deterministic timecodes across a ~40s recorded session
  const times = [4, 16, 27, 38];
  return scanned.map((a,i) => ({ area:a, t: times[i] ?? (4 + i*11) }));
}
function fmtTime(s){ const m = Math.floor(s/60); const ss = String(s%60).padStart(2,'0'); return `${m}:${ss}`; }

function renderReplay(){
  stopReplay();
  replayIndex = 0;
  const evs = replayEvents();
  const timeline = $('#replayTimeline');
  timeline.innerHTML = evs.map((e,i) => `
    <button class="replay-event" data-i="${i}">
      <span class="re-time">${fmtTime(e.t)}</span>
      <span class="re-num">${i+1}</span>
      <span class="re-name">${e.area.name}</span>
      <span class="re-chip chip ${toneVars(e.area.tone).cls}">${toneIconInline(e.area.tone)}${e.area.label}</span>
    </button>
  `).join('');
  $$('.replay-event', timeline).forEach(b => b.addEventListener('click', () => { stopReplay(); showReplayStep(+b.dataset.i); }));
  showReplayStep(0);
}

function showReplayStep(i){
  const evs = replayEvents();
  if (!evs.length) return;
  i = Math.max(0, Math.min(i, evs.length-1));
  replayIndex = i;
  const e = evs[i], area = e.area;
  // active event highlight
  $$('.replay-event').forEach(el => el.classList.toggle('is-active', +el.dataset.i === i));
  // scrub position + time
  const total = evs[evs.length-1].t + 4;
  const pct = (e.t / total) * 100;
  $('#replayTrackFill').style.width = pct + '%';
  $('#replayPlayhead').style.left = pct + '%';
  $('#replayTime').textContent = fmtTime(e.t);
  // badge
  $('#replayBadge').textContent = `Event ${i+1} of ${evs.length}`;
  // stage: glowing wireframe of this structure + its finding chip
  $('#replayWire').innerHTML = wireframeSVG(area, 0) +
    `<div class="replay-wire-chip"><span class="chip ${toneVars(area.tone).cls}">${toneIconInline(area.tone)}${area.label}</span></div>`;
}

function setReplayPlayIcon(playing){
  $('#replayPlayBtn').innerHTML = `<svg class="ic ic-sm"><use href="#${playing?'i-pause':'i-play'}"/></svg>`;
  $('#replayPlayBtn').setAttribute('aria-label', playing ? 'Pause' : 'Play');
}
function stopReplay(){
  replayPlaying = false;
  if (replayTimer){ clearTimeout(replayTimer); replayTimer = null; }
  setReplayPlayIcon(false);
}
async function playReplay(){
  const evs = replayEvents();
  if (!evs.length) return;
  replayPlaying = true;
  setReplayPlayIcon(true);
  // if at the end, restart
  if (replayIndex >= evs.length-1) { showReplayStep(0); await sleep(200); }
  const advance = () => {
    if (!replayPlaying) return;
    if (replayIndex >= evs.length-1){ stopReplay(); return; }
    showReplayStep(replayIndex + 1);
    replayTimer = setTimeout(advance, 1600);
  };
  replayTimer = setTimeout(advance, 1600);
}
$('#replayPlayBtn').addEventListener('click', () => {
  if (replayPlaying) stopReplay();
  else playReplay();
});
$('#replayTrack').addEventListener('click', (ev) => {
  stopReplay();
  const evs = replayEvents();
  const rect = $('#replayTrack').getBoundingClientRect();
  const pct = (ev.clientX - rect.left) / rect.width;
  const total = evs.length ? evs[evs.length-1].t + 4 : 1;
  const target = pct * total;
  // snap to nearest event
  let nearest = 0, best = Infinity;
  evs.forEach((e,i) => { const d = Math.abs(e.t - target); if (d < best){ best = d; nearest = i; } });
  showReplayStep(nearest);
});

// ============================================================
// BOOT
// ============================================================
goScreen('welcome');
fitDevice();
setTimeout(fitDevice, 100);

// kick off the AR sequence automatically the moment the AR screen is entered
const arScreenEl = $('.screen[data-name="ar"]');
const observer = new MutationObserver(() => {
  if (arScreenEl.classList.contains('is-active') && !arStarted){
    startArSequence();
  }
});
observer.observe(arScreenEl, { attributes: true, attributeFilter: ['class'] });
