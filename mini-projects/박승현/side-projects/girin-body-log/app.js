// === GIRIN BODY LOG — App v2 ===

const START_DATE = new Date('2026-02-24');

// === 운동별 맞춤 수치 정의 ===
const EXERCISE_TEMPLATES = {
  // 유산소
  '러닝': { type: '유산소', fields: [
    { key: 'distance', label: '거리 (km)', unit: 'km' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'pace', label: '페이스 (분/km)', unit: '분/km' },
    { key: 'heartRate', label: '평균 심박수', unit: 'bpm' }
  ]},
  '달리기': { type: '유산소', alias: '러닝' },
  '조깅': { type: '유산소', fields: [
    { key: 'distance', label: '거리 (km)', unit: 'km' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'pace', label: '페이스 (분/km)', unit: '분/km' },
    { key: 'heartRate', label: '평균 심박수', unit: 'bpm' }
  ]},
  '걷기': { type: '유산소', fields: [
    { key: 'distance', label: '거리 (km)', unit: 'km' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'steps', label: '걸음 수', unit: '걸음' }
  ]},
  '산책': { type: '유산소', alias: '걷기' },
  '자전거': { type: '유산소', fields: [
    { key: 'distance', label: '거리 (km)', unit: 'km' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'avgSpeed', label: '평균 속도', unit: 'km/h' },
    { key: 'heartRate', label: '평균 심박수', unit: 'bpm' }
  ]},
  '사이클': { type: '유산소', alias: '자전거' },
  '수영': { type: '유산소', fields: [
    { key: 'distance', label: '거리 (m)', unit: 'm' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'laps', label: '랩 수', unit: '랩' },
    { key: 'stroke', label: '영법', unit: '' }
  ]},
  '등산': { type: '유산소', fields: [
    { key: 'mountain', label: '산 이름', unit: '' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'elevation', label: '고도 (m)', unit: 'm' }
  ]},
  '줄넘기': { type: '유산소', fields: [
    { key: 'count', label: '횟수', unit: '회' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '로잉': { type: '유산소', fields: [
    { key: 'distance', label: '거리 (m)', unit: 'm' },
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'pace', label: '페이스 (/500m)', unit: '/500m' }
  ]},

  // 웨이트 — 상체
  '벤치프레스': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '풀업': { type: '웨이트', fields: [
    { key: 'weight', label: '추가 무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '턱걸이': { type: '웨이트', alias: '풀업' },
  '친업': { type: '웨이트', alias: '풀업' },
  '팔굽혀펴기': { type: '맨몸', fields: [
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '푸쉬업': { type: '맨몸', alias: '팔굽혀펴기' },
  '딥스': { type: '웨이트', fields: [
    { key: 'weight', label: '추가 무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '덤벨 숄더프레스': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '바벨 로우': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '랫풀다운': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},

  // 웨이트 — 하체
  '스쿼트': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '데드리프트': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '런지': { type: '맨몸', fields: [
    { key: 'weight', label: '무게 (kg, 없으면 0)', unit: 'kg' },
    { key: 'reps', label: '횟수 (한쪽)', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '레그프레스': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '힙쓰러스트': { type: '웨이트', fields: [
    { key: 'weight', label: '무게 (kg)', unit: 'kg' },
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '카프레이즈': { type: '맨몸', fields: [
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},

  // 맨몸 / 코어
  '플랭크': { type: '맨몸', fields: [
    { key: 'duration', label: '유지 시간 (초)', unit: '초' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '버피': { type: '맨몸', fields: [
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '마운틴클라이머': { type: '맨몸', fields: [
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '브릿지': { type: '맨몸', fields: [
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '크런치': { type: '맨몸', fields: [
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},
  '레그레이즈': { type: '맨몸', fields: [
    { key: 'reps', label: '횟수', unit: '회' },
    { key: 'sets', label: '세트', unit: '세트' }
  ]},

  // 유연성
  '스트레칭': { type: '유연성', fields: [
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'focus', label: '부위', unit: '' }
  ]},
  '요가': { type: '유연성', fields: [
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'type', label: '종류', unit: '' }
  ]},
  '폼롤러': { type: '유연성', fields: [
    { key: 'time', label: '시간 (분)', unit: '분' },
    { key: 'focus', label: '부위', unit: '' }
  ]},
};

// 기본 필드 (매칭 안 될 때)
const DEFAULT_FIELDS = [
  { key: 'reps', label: '횟수', unit: '회' },
  { key: 'sets', label: '세트', unit: '세트' },
  { key: 'time', label: '시간 (분)', unit: '분' }
];

let currentMember = null;
let charts = {};
let exerciseCounter = 0;

// === PWA Service Worker ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// === 사용자 관리 ===
function getAllUsers() {
  return JSON.parse(localStorage.getItem('bodylog_users') || '[]');
}

function saveUser(userId, pin) {
  const users = getAllUsers();
  if (!users.find(u => u.id === userId)) {
    users.push({ id: userId, pin });
    localStorage.setItem('bodylog_users', JSON.stringify(users));
  }
}

function findUserByPin(pin) {
  return getAllUsers().find(u => u.pin === pin) || null;
}

// === 초기화 ===
document.addEventListener('DOMContentLoaded', () => {
  initPinScreen();
  initProfileModal();

  const savedSession = localStorage.getItem('bodylog_session');
  if (savedSession) {
    currentMember = savedSession;
    enterApp();
  } else {
    showPinScreen();
  }
});

function showPinScreen() {
  document.getElementById('pin-screen').style.display = 'flex';
  document.getElementById('profile-modal').style.display = 'none';
  document.getElementById('app-container').style.display = 'none';
  const pinInput = document.getElementById('pin-input');
  if (pinInput) { pinInput.value = ''; pinInput.focus(); }
}

function initPinScreen() {
  document.getElementById('pin-login-btn').addEventListener('click', handlePinLogin);
  document.getElementById('pin-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handlePinLogin();
  });
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('bodylog_session');
    currentMember = null;
    showPinScreen();
  });
}

function handlePinLogin() {
  const pin = document.getElementById('pin-input').value.trim();
  const errorEl = document.getElementById('pin-error');

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    errorEl.textContent = '4자리 숫자를 입력해주세요';
    return;
  }

  const user = findUserByPin(pin);
  if (user) {
    currentMember = user.id;
    localStorage.setItem('bodylog_session', currentMember);
    errorEl.textContent = '';
    enterApp();
  } else {
    // 새 사용자 → 프로필 등록
    document.getElementById('pin-screen').style.display = 'none';
    document.getElementById('profile-modal').style.display = 'block';
    document.getElementById('profile-pin').value = pin;
    document.getElementById('profile-pin-confirm').value = pin;
  }
}

function enterApp() {
  document.getElementById('pin-screen').style.display = 'none';
  document.getElementById('profile-modal').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';

  const profile = JSON.parse(localStorage.getItem(`profile_${currentMember}`) || 'null');
  const nameEl = document.getElementById('user-display-name');
  if (nameEl) nameEl.textContent = profile ? profile.name : currentMember;

  setTodayDate();
  initTabs();
  initConditionSlider();
  initBreakToggle();
  initSaveButton();
  initSmartExercise();
  initProfileModal();
  loadTodayRecord();
  updateWeekInfo();
}

// ==========================================
// 프로필 시스템
// ==========================================
// checkProfile 제거됨 — PIN 인증으로 대체

function initProfileModal() {
  const addMedBtn = document.getElementById('add-medical-btn');
  if (addMedBtn) {
    addMedBtn.addEventListener('click', () => {
      const container = document.getElementById('medical-fields');
      const row = document.createElement('div');
      row.className = 'medical-row';
      row.innerHTML = `
        <input type="text" placeholder="항목" class="med-name">
        <input type="text" placeholder="수치" class="med-value">
        <input type="text" placeholder="단위" class="med-unit">
      `;
      container.appendChild(row);
    });
  }

  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
  document.getElementById('edit-profile-btn').addEventListener('click', () => {
    document.getElementById('profile-modal').style.display = 'block';
    fillProfileModal();
  });

  // "더 입력하기" 토글
  const toggleBtn = document.getElementById('toggle-extra-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const extra = document.getElementById('extra-profile');
      if (extra.style.display === 'none') {
        extra.style.display = 'block';
        toggleBtn.textContent = '접기';
      } else {
        extra.style.display = 'none';
        toggleBtn.textContent = '더 입력하기 (선택사항)';
      }
    });
  }
}

function saveProfile() {
  const name = document.getElementById('profile-name').value.trim();
  const weight = document.getElementById('profile-weight').value.trim();
  const pin = document.getElementById('profile-pin').value.trim();
  const pinConfirm = document.getElementById('profile-pin-confirm').value.trim();

  if (!name) { alert('이름을 입력해주세요'); return; }
  if (!weight) { alert('체중을 입력해주세요'); return; }
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { alert('PIN은 4자리 숫자여야 해요'); return; }
  if (pin !== pinConfirm) { alert('PIN이 일치하지 않아요'); return; }

  // PIN 중복 체크
  const existingUser = findUserByPin(pin);
  if (existingUser && existingUser.id !== currentMember) {
    alert('이미 사용 중인 PIN이에요. 다른 숫자를 선택해주세요');
    return;
  }

  const medicalChecks = [];
  document.querySelectorAll('#medical-fields .medical-row').forEach(row => {
    const mName = row.querySelector('.med-name').value.trim();
    const value = row.querySelector('.med-value').value.trim();
    const unit = row.querySelector('.med-unit').value.trim();
    if (mName) medicalChecks.push({ name: mName, value, unit });
  });

  // userId 생성 (이름 기반)
  const userId = name.replace(/\s/g, '_').toLowerCase();
  currentMember = userId;

  const profile = {
    name: name,
    age: Number(document.getElementById('profile-age').value) || null,
    height: Number(document.getElementById('profile-height').value) || null,
    weight: Number(weight) || null,
    conditions: (document.getElementById('profile-conditions') || {}).value || '',
    familyHistory: (document.getElementById('profile-family-history') || {}).value || '',
    allergies: (document.getElementById('profile-allergies') || {}).value || '',
    medicalChecks: medicalChecks,
    exerciseHistory: (document.getElementById('profile-exercise-history') || {}).value || '',
    injuries: (document.getElementById('profile-injuries') || {}).value || '',
    updatedAt: new Date().toISOString()
  };

  // 저장
  saveUser(userId, pin);
  localStorage.setItem(`profile_${currentMember}`, JSON.stringify(profile));
  localStorage.setItem('bodylog_session', currentMember);

  enterApp();
  renderProfileView();
}

function fillProfileModal() {
  const profile = JSON.parse(localStorage.getItem(`profile_${currentMember}`) || 'null');
  if (!profile) return;

  document.getElementById('profile-name').value = profile.name || '';
  document.getElementById('profile-age').value = profile.age || '';
  document.getElementById('profile-height').value = profile.height || '';
  document.getElementById('profile-weight').value = profile.weight || '';

  // PIN 채우기
  const user = getAllUsers().find(u => u.id === currentMember);
  if (user) {
    document.getElementById('profile-pin').value = user.pin;
    document.getElementById('profile-pin-confirm').value = user.pin;
  }

  // 선택 정보 펼치기
  const extra = document.getElementById('extra-profile');
  if (extra) extra.style.display = 'block';
  const toggleBtn = document.getElementById('toggle-extra-btn');
  if (toggleBtn) toggleBtn.textContent = '접기';

  const condEl = document.getElementById('profile-conditions');
  if (condEl) condEl.value = profile.conditions || '';
  const famEl = document.getElementById('profile-family-history');
  if (famEl) famEl.value = profile.familyHistory || '';
  const allerEl = document.getElementById('profile-allergies');
  if (allerEl) allerEl.value = profile.allergies || '';
  const exerEl = document.getElementById('profile-exercise-history');
  if (exerEl) exerEl.value = profile.exerciseHistory || '';
  const injEl = document.getElementById('profile-injuries');
  if (injEl) injEl.value = profile.injuries || '';

  const container = document.getElementById('medical-fields');
  container.innerHTML = '';
  const checks = profile.medicalChecks || [];
  if (checks.length === 0) checks.push({}, {}, {});
  checks.forEach(c => {
    const row = document.createElement('div');
    row.className = 'medical-row';
    row.innerHTML = `
      <input type="text" placeholder="항목" class="med-name" value="${c.name || ''}">
      <input type="text" placeholder="수치" class="med-value" value="${c.value || ''}">
      <input type="text" placeholder="단위" class="med-unit" value="${c.unit || ''}">
    `;
    container.appendChild(row);
  });
}

function renderProfileView() {
  const profile = JSON.parse(localStorage.getItem(`profile_${currentMember}`) || 'null');
  const container = document.getElementById('profile-view');
  if (!container) return;

  if (!profile) {
    container.innerHTML = '<p class="text-dim">프로필이 없습니다.</p>';
    return;
  }

  let medHtml = '';
  if (profile.medicalChecks && profile.medicalChecks.length) {
    medHtml = profile.medicalChecks.map(m =>
      `<div class="profile-row"><span class="label">${m.name}</span><span class="value">${m.value} ${m.unit}</span></div>`
    ).join('');
  } else {
    medHtml = '<p class="text-dim">기록 없음</p>';
  }

  container.innerHTML = `
    <div class="card">
      <h3>기본 정보</h3>
      <div class="profile-section">
        <div class="profile-row"><span class="label">이름</span><span class="value">${profile.name || '-'}</span></div>
        <div class="profile-row"><span class="label">나이</span><span class="value">${profile.age || '-'}세</span></div>
        <div class="profile-row"><span class="label">키</span><span class="value">${profile.height || '-'} cm</span></div>
        <div class="profile-row"><span class="label">체중</span><span class="value">${profile.weight || '-'} kg</span></div>
      </div>
    </div>
    <div class="card">
      <h3>건강 상태</h3>
      <div class="profile-section">
        <h4>질환 / 지병</h4>
        <p class="profile-text">${profile.conditions || '없음'}</p>
      </div>
      <div class="profile-section">
        <h4>가족력</h4>
        <p class="profile-text">${profile.familyHistory || '없음'}</p>
      </div>
      <div class="profile-section">
        <h4>알레르기 / 주의사항</h4>
        <p class="profile-text">${profile.allergies || '없음'}</p>
      </div>
    </div>
    <div class="card">
      <h3>메디컬 체크 결과</h3>
      ${medHtml}
    </div>
    <div class="card">
      <h3>운동 이력</h3>
      <div class="profile-section">
        <h4>현재 운동 습관</h4>
        <p class="profile-text">${profile.exerciseHistory || '없음'}</p>
      </div>
      <div class="profile-section">
        <h4>부상 이력</h4>
        <p class="profile-text">${profile.injuries || '없음'}</p>
      </div>
    </div>
  `;
}

// ==========================================
// 스마트 운동 입력
// ==========================================
function initSmartExercise() {
  document.getElementById('add-smart-exercise-btn').addEventListener('click', () => {
    addSmartExerciseBlock();
  });
  // 첫 블록 하나 추가
  addSmartExerciseBlock();
}

function addSmartExerciseBlock() {
  const id = 'ex-' + (exerciseCounter++);
  const container = document.getElementById('smart-exercises');
  const block = document.createElement('div');
  block.className = 'smart-exercise-block';
  block.id = id;
  block.innerHTML = `
    <div class="smart-exercise-header">
      <input type="text" placeholder="운동 이름 입력 (예: 러닝, 풀업, 스쿼트...)" class="exercise-name-input" autocomplete="off">
      <span class="exercise-type-badge" style="display:none;"></span>
      <button class="btn-remove" title="삭제">&times;</button>
    </div>
    <div class="smart-fields"></div>
    <textarea class="exercise-memo" placeholder="메모 (폼 교정, 느낀 점 등...)"></textarea>
  `;
  container.appendChild(block);

  const nameInput = block.querySelector('.exercise-name-input');
  const fieldsContainer = block.querySelector('.smart-fields');
  const badge = block.querySelector('.exercise-type-badge');
  const removeBtn = block.querySelector('.btn-remove');

  let debounceTimer;
  nameInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const name = nameInput.value.trim();
      matchExercise(name, fieldsContainer, badge, block);
    }, 300);
  });

  removeBtn.addEventListener('click', () => {
    block.remove();
  });
}

function matchExercise(name, fieldsContainer, badge, block) {
  if (!name) {
    fieldsContainer.innerHTML = '';
    badge.style.display = 'none';
    block.classList.remove('matched');
    return;
  }

  let template = EXERCISE_TEMPLATES[name];

  // alias 처리
  if (template && template.alias) {
    template = EXERCISE_TEMPLATES[template.alias];
  }

  // 부분 매칭 시도
  if (!template) {
    for (const key of Object.keys(EXERCISE_TEMPLATES)) {
      if (key.includes(name) || name.includes(key)) {
        template = EXERCISE_TEMPLATES[key];
        if (template.alias) template = EXERCISE_TEMPLATES[template.alias];
        break;
      }
    }
  }

  const fields = template ? template.fields : DEFAULT_FIELDS;
  const type = template ? template.type : '기타';

  badge.textContent = type;
  badge.style.display = 'inline-block';
  block.classList.add('matched');

  // 기존 값 보존
  const oldValues = {};
  fieldsContainer.querySelectorAll('.smart-field input').forEach(inp => {
    if (inp.value) oldValues[inp.dataset.key] = inp.value;
  });

  fieldsContainer.innerHTML = fields.map(f => `
    <div class="smart-field">
      <label>${f.label}</label>
      <input type="text" data-key="${f.key}" data-unit="${f.unit}" placeholder="${f.unit}" value="${oldValues[f.key] || ''}">
    </div>
  `).join('');
}

function collectSmartExercises() {
  const exercises = [];
  document.querySelectorAll('.smart-exercise-block').forEach(block => {
    const name = block.querySelector('.exercise-name-input').value.trim();
    if (!name) return;

    const metrics = {};
    block.querySelectorAll('.smart-field input').forEach(inp => {
      if (inp.value.trim()) metrics[inp.dataset.key] = inp.value.trim();
    });

    const memo = block.querySelector('.exercise-memo').value.trim();
    const badge = block.querySelector('.exercise-type-badge');
    const type = badge.textContent || '기타';

    exercises.push({ name, type, metrics, memo });
  });
  return exercises;
}

// ==========================================
// PT 트레이너 탭
// ==========================================
function initTrainerTab() {
  // PT 트레이너 탭은 현재 숨김 상태. 활성화 시 동적 멤버 목록으로 교체 필요.
  const saveBtn = document.getElementById('save-trainer-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveTrainerNote);
}

function renderTrainerProfileSummary() {
  const profile = JSON.parse(localStorage.getItem(`profile_${trainerSelectedMember}`) || 'null');
  const container = document.getElementById('trainer-profile-summary');
  if (!container) return;

  if (!profile) {
    container.innerHTML = '<p class="text-dim">이 멤버는 아직 프로필을 작성하지 않았습니다.</p>';
    return;
  }

  container.innerHTML = `
    <div class="profile-row"><span class="label">이름</span><span class="value">${profile.name || MEMBERS[trainerSelectedMember].short}</span></div>
    <div class="profile-row"><span class="label">나이/키/체중</span><span class="value">${profile.age || '-'}세 / ${profile.height || '-'}cm / ${profile.weight || '-'}kg</span></div>
    <div class="profile-row"><span class="label">질환</span><span class="value">${profile.conditions || '없음'}</span></div>
    <div class="profile-row"><span class="label">부상이력</span><span class="value">${profile.injuries || '없음'}</span></div>
    <div class="profile-row"><span class="label">가족력</span><span class="value">${profile.familyHistory || '없음'}</span></div>
  `;
}

function saveTrainerNote() {
  const today = getTodayStr();
  const note = {
    date: today,
    member: trainerSelectedMember,
    workout: document.getElementById('trainer-workout-note').value.trim(),
    condition: document.getElementById('trainer-condition-note').value.trim(),
    nextPlan: document.getElementById('trainer-next-plan').value.trim(),
    savedAt: new Date().toISOString()
  };

  const key = `trainer_${trainerSelectedMember}`;
  const all = JSON.parse(localStorage.getItem(key) || '{}');
  all[today] = note;
  localStorage.setItem(key, JSON.stringify(all));

  const msg = document.getElementById('trainer-save-message');
  msg.textContent = '트레이너 노트 저장 완료!';
  setTimeout(() => { msg.textContent = ''; }, 2000);

  renderTrainerHistory();
}

function renderTrainerHistory() {
  const key = `trainer_${trainerSelectedMember}`;
  const all = JSON.parse(localStorage.getItem(key) || '{}');
  const dates = Object.keys(all).sort().reverse();
  const container = document.getElementById('trainer-history');
  if (!container) return;

  if (!dates.length) {
    container.innerHTML = '<p class="text-dim">아직 트레이너 노트가 없습니다.</p>';
    return;
  }

  container.innerHTML = dates.map(d => {
    const n = all[d];
    return `
      <div class="trainer-note-card">
        <div class="trainer-note-date">${d}</div>
        ${n.workout ? `<div class="trainer-note-section"><div class="tn-label">수행 운동</div><div class="tn-text">${n.workout}</div></div>` : ''}
        ${n.condition ? `<div class="trainer-note-section"><div class="tn-label">컨디션 관찰</div><div class="tn-text">${n.condition}</div></div>` : ''}
        ${n.nextPlan ? `<div class="trainer-note-section"><div class="tn-label">다음 계획</div><div class="tn-text">${n.nextPlan}</div></div>` : ''}
      </div>
    `;
  }).join('');
}

// ==========================================
// 기존 기능 (탭, 멤버, 저장, 대시보드 등)
// ==========================================
function getTodayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function setTodayDate() {
  const today = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const el = document.getElementById('today-date');
  if (el) el.textContent = `(${getTodayStr()} ${days[today.getDay()]}요일)`;
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) tab.classList.add('active');

      if (btn.dataset.tab === 'dashboard') renderDashboard();
      if (btn.dataset.tab === 'guild') renderGuild();
      if (btn.dataset.tab === 'profile') renderProfileView();
      if (btn.dataset.tab === 'trainer') {
        renderTrainerProfileSummary();
        renderTrainerHistory();
      }
    });
  });
}

// initMemberSelector 제거됨 — PIN 인증으로 대체

function initConditionSlider() {
  const slider = document.getElementById('condition');
  const display = document.getElementById('condition-value');
  if (slider && display) slider.addEventListener('input', () => { display.textContent = slider.value; });
}

function initBreakToggle() {
  const breakCheck = document.getElementById('break-done');
  const breakRow = document.getElementById('break-count-row');
  if (breakCheck && breakRow) {
    breakCheck.addEventListener('change', () => { breakRow.style.display = breakCheck.checked ? 'flex' : 'none'; });
  }
}

function initSaveButton() {
  document.getElementById('save-btn').addEventListener('click', saveRecord);
}

function saveRecord() {
  const today = getTodayStr();

  const record = {
    date: today,
    member: currentMember,
    body: {
      weight: Number(document.getElementById('weight').value) || null,
      bodyFat: Number(document.getElementById('body-fat').value) || null,
      sleepHours: Number(document.getElementById('sleep-hours').value) || null,
      condition: Number(document.getElementById('condition').value) || 5
    },
    workout: {
      morning: document.getElementById('morning-done').checked,
      breakDone: document.getElementById('break-done').checked,
      breakCount: Number(document.getElementById('break-count').value) || 0,
      evening: document.getElementById('evening-done').checked,
      exercises: collectSmartExercises()
    },
    note: document.getElementById('daily-note').value.trim(),
    savedAt: new Date().toISOString()
  };

  const key = `bodylog_${currentMember}`;
  const allRecords = JSON.parse(localStorage.getItem(key) || '{}');
  allRecords[today] = record;
  localStorage.setItem(key, JSON.stringify(allRecords));

  const msg = document.getElementById('save-message');
  if (msg) { msg.textContent = '저장 완료!'; setTimeout(() => { msg.textContent = ''; }, 2000); }
}

function loadTodayRecord() {
  const today = getTodayStr();
  const key = `bodylog_${currentMember}`;
  const allRecords = JSON.parse(localStorage.getItem(key) || '{}');
  const record = allRecords[today];

  document.getElementById('weight').value = '';
  document.getElementById('body-fat').value = '';
  document.getElementById('sleep-hours').value = '';
  document.getElementById('condition').value = 5;
  document.getElementById('condition-value').textContent = '5';
  document.getElementById('morning-done').checked = false;
  document.getElementById('break-done').checked = false;
  document.getElementById('break-count').value = 1;
  document.getElementById('break-count-row').style.display = 'none';
  document.getElementById('evening-done').checked = false;
  document.getElementById('daily-note').value = '';

  // 스마트 운동 초기화
  const exContainer = document.getElementById('smart-exercises');
  exContainer.innerHTML = '';
  exerciseCounter = 0;

  if (record) {
    if (record.body.weight) document.getElementById('weight').value = record.body.weight;
    if (record.body.bodyFat) document.getElementById('body-fat').value = record.body.bodyFat;
    if (record.body.sleepHours) document.getElementById('sleep-hours').value = record.body.sleepHours;
    if (record.body.condition) {
      document.getElementById('condition').value = record.body.condition;
      document.getElementById('condition-value').textContent = record.body.condition;
    }
    document.getElementById('morning-done').checked = record.workout.morning;
    document.getElementById('break-done').checked = record.workout.breakDone;
    if (record.workout.breakDone) {
      document.getElementById('break-count-row').style.display = 'flex';
      document.getElementById('break-count').value = record.workout.breakCount;
    }
    document.getElementById('evening-done').checked = record.workout.evening;
    if (record.note) document.getElementById('daily-note').value = record.note;

    // 저장된 운동 복원
    if (record.workout.exercises && record.workout.exercises.length) {
      record.workout.exercises.forEach(ex => {
        addSmartExerciseBlock();
        const blocks = exContainer.querySelectorAll('.smart-exercise-block');
        const block = blocks[blocks.length - 1];
        const nameInput = block.querySelector('.exercise-name-input');
        nameInput.value = ex.name;

        const fieldsContainer = block.querySelector('.smart-fields');
        const badge = block.querySelector('.exercise-type-badge');
        matchExercise(ex.name, fieldsContainer, badge, block);

        // 수치 복원
        Object.entries(ex.metrics || {}).forEach(([k, v]) => {
          const inp = fieldsContainer.querySelector(`input[data-key="${k}"]`);
          if (inp) inp.value = v;
        });

        if (ex.memo) block.querySelector('.exercise-memo').value = ex.memo;
      });
    } else {
      addSmartExerciseBlock();
    }
  } else {
    addSmartExerciseBlock();
  }
}

// ==========================================
// 대시보드
// ==========================================
function renderDashboard() {
  const key = `bodylog_${currentMember}`;
  const allRecords = JSON.parse(localStorage.getItem(key) || '{}');
  const dates = Object.keys(allRecords).sort();

  const totalDays = dates.length;
  const streak = calcStreak(dates);
  const conditions = dates.map(d => allRecords[d].body.condition).filter(v => v);
  const sleeps = dates.map(d => allRecords[d].body.sleepHours).filter(v => v);
  const avgCond = conditions.length ? (conditions.reduce((a, b) => a + b, 0) / conditions.length).toFixed(1) : '-';
  const avgSleep = sleeps.length ? (sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : '-';

  document.getElementById('streak-count').textContent = streak;
  document.getElementById('total-days').textContent = totalDays;
  document.getElementById('avg-condition').textContent = avgCond;
  document.getElementById('avg-sleep').textContent = avgSleep;

  renderInsights(dates, allRecords);
  renderWeightChart(dates, allRecords);
  renderConditionChart(dates, allRecords);
  renderRoutineChart(dates, allRecords);
  renderRecentRecords(dates, allRecords);
}

function renderInsights(dates, records) {
  const box = document.getElementById('insights');
  if (!box) return;
  if (dates.length < 3) {
    box.innerHTML = '<div class="insight-item"><span class="insight-neutral">3일 이상 기록하면 인사이트가 나타나요!</span></div>';
    return;
  }

  const insights = [];
  const recent7 = dates.slice(-7);
  const prev7 = dates.slice(-14, -7);

  // 수면 평균 비교
  const recentSleep = recent7.map(d => records[d].body.sleepHours).filter(v => v);
  const prevSleep = prev7.map(d => records[d].body.sleepHours).filter(v => v);
  if (recentSleep.length >= 3) {
    const avg = (recentSleep.reduce((a,b) => a+b, 0) / recentSleep.length).toFixed(1);
    if (prevSleep.length >= 3) {
      const prevAvg = (prevSleep.reduce((a,b) => a+b, 0) / prevSleep.length).toFixed(1);
      const diff = (avg - prevAvg).toFixed(1);
      if (diff > 0) insights.push({ icon: 'up', text: `수면 평균 ${avg}h (+${diff}h) — 좋은 흐름이에요` });
      else if (diff < 0) insights.push({ icon: 'down', text: `수면 평균 ${avg}h (${diff}h) — 수면이 줄었어요` });
    } else {
      insights.push({ icon: 'neutral', text: `최근 수면 평균 ${avg}h` });
    }
  }

  // 컨디션 추이
  const recentCond = recent7.map(d => records[d].body.condition).filter(v => v);
  if (recentCond.length >= 3) {
    const avg = (recentCond.reduce((a,b) => a+b, 0) / recentCond.length).toFixed(1);
    if (avg >= 7) insights.push({ icon: 'up', text: `컨디션 평균 ${avg} — 컨디션 좋네요!` });
    else if (avg <= 4) insights.push({ icon: 'down', text: `컨디션 평균 ${avg} — 좀 쉬어가는 것도 방법이에요` });
  }

  // 루틴 달성률
  if (recent7.length >= 3) {
    let total = 0, done = 0;
    recent7.forEach(d => {
      const w = records[d].workout;
      total += 3;
      if (w.morning) done++;
      if (w.breakDone) done++;
      if (w.evening) done++;
    });
    const rate = Math.round(done / total * 100);
    if (rate >= 80) insights.push({ icon: 'up', text: `루틴 달성률 ${rate}% — 꾸준하네요!` });
    else if (rate <= 30) insights.push({ icon: 'down', text: `루틴 달성률 ${rate}% — 아침 루틴부터 하나씩!` });
    else insights.push({ icon: 'neutral', text: `루틴 달성률 ${rate}%` });
  }

  // 스트릭
  const streak = calcStreak(dates);
  if (streak >= 7) insights.push({ icon: 'up', text: `${streak}일 연속 기록 중 — 대단해요!` });
  else if (streak === 0) insights.push({ icon: 'down', text: `오늘 아직 기록 안 했어요` });

  if (!insights.length) {
    box.innerHTML = '';
    return;
  }

  const iconMap = { up: '↑', down: '↓', neutral: '→' };
  const classMap = { up: 'insight-up', down: 'insight-down', neutral: 'insight-neutral' };
  box.innerHTML = insights.map(i =>
    `<div class="insight-item"><span class="insight-icon ${classMap[i.icon]}">${iconMap[i.icon]}</span><span>${i.text}</span></div>`
  ).join('');
}

function calcStreak(dates) {
  if (!dates.length) return 0;
  let streak = 0;
  const today = new Date(getTodayStr());
  let check = new Date(today);
  while (true) {
    const ds = check.getFullYear() + '-' + String(check.getMonth() + 1).padStart(2, '0') + '-' + String(check.getDate()).padStart(2, '0');
    if (dates.includes(ds)) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }
  return streak;
}

function renderWeightChart(dates, records) {
  const ctx = document.getElementById('weight-chart');
  if (!ctx) return;
  if (charts.weight) charts.weight.destroy();
  const data = dates.map(d => ({ x: d, y: records[d].body.weight })).filter(p => p.y);
  charts.weight = new Chart(ctx, {
    type: 'line',
    data: { datasets: [{ label: '체중 (kg)', data, borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.1)', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#6c5ce7' }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'category', ticks: { color: '#888' }, grid: { color: '#2a2a3e' } }, y: { ticks: { color: '#888' }, grid: { color: '#2a2a3e' } } }, plugins: { legend: { labels: { color: '#e0e0e0' } } } }
  });
}

function renderConditionChart(dates, records) {
  const ctx = document.getElementById('condition-chart');
  if (!ctx) return;
  if (charts.condition) charts.condition.destroy();
  const condData = dates.map(d => ({ x: d, y: records[d].body.condition })).filter(p => p.y);
  const sleepData = dates.map(d => ({ x: d, y: records[d].body.sleepHours })).filter(p => p.y);
  charts.condition = new Chart(ctx, {
    type: 'line',
    data: { datasets: [
      { label: '컨디션', data: condData, borderColor: '#00cec9', fill: false, tension: 0.3, yAxisID: 'y', pointRadius: 4, pointBackgroundColor: '#00cec9' },
      { label: '수면 (h)', data: sleepData, borderColor: '#fdcb6e', fill: false, tension: 0.3, yAxisID: 'y1', pointRadius: 4, pointBackgroundColor: '#fdcb6e' }
    ] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'category', ticks: { color: '#888' }, grid: { color: '#2a2a3e' } }, y: { position: 'left', min: 1, max: 10, ticks: { color: '#00cec9' }, grid: { color: '#2a2a3e' } }, y1: { position: 'right', min: 0, max: 12, ticks: { color: '#fdcb6e' }, grid: { display: false } } }, plugins: { legend: { labels: { color: '#e0e0e0' } } } }
  });
}

function renderRoutineChart(dates, records) {
  const ctx = document.getElementById('routine-chart');
  if (!ctx) return;
  if (charts.routine) charts.routine.destroy();
  const recent = dates.slice(-7);
  charts.routine = new Chart(ctx, {
    type: 'bar',
    data: { labels: recent.map(d => d.slice(5)), datasets: [
      { label: '아침', data: recent.map(d => records[d].workout.morning ? 1 : 0), backgroundColor: 'rgba(108,92,231,0.7)' },
      { label: '브레이크', data: recent.map(d => records[d].workout.breakDone ? 1 : 0), backgroundColor: 'rgba(0,206,201,0.7)' },
      { label: '저녁', data: recent.map(d => records[d].workout.evening ? 1 : 0), backgroundColor: 'rgba(0,184,148,0.7)' }
    ] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#888' }, grid: { color: '#2a2a3e' } }, y: { min: 0, max: 1, ticks: { display: false }, grid: { color: '#2a2a3e' } } }, plugins: { legend: { labels: { color: '#e0e0e0' } } } }
  });
}

function renderRecentRecords(dates, records) {
  const container = document.getElementById('recent-records');
  if (!container) return;
  const recent = dates.slice(-7).reverse();
  if (!recent.length) { container.innerHTML = '<p class="text-dim" style="text-align:center;padding:1rem;">아직 기록이 없습니다.</p>'; return; }
  container.innerHTML = recent.map(d => {
    const r = records[d];
    const badges = [];
    if (r.workout.morning) badges.push('<span class="badge badge-morning">아침</span>');
    if (r.workout.breakDone) badges.push('<span class="badge badge-break">브레이크</span>');
    if (r.workout.evening) badges.push('<span class="badge badge-evening">저녁</span>');
    const exCount = (r.workout.exercises || []).length;
    if (exCount) badges.push(`<span class="badge" style="background:rgba(108,92,231,0.15);color:#6c5ce7;">+${exCount}운동</span>`);
    return `<div class="record-item"><span class="record-date">${d.slice(5)}</span><span>컨디션 ${r.body.condition || '-'} | 수면 ${r.body.sleepHours || '-'}h</span><div class="record-badges">${badges.join('')}</div></div>`;
  }).join('');
}

// ==========================================
// 길드 현황
// ==========================================
function renderGuild() {
  const grid = document.getElementById('guild-grid');
  const ranking = document.getElementById('guild-ranking');
  if (!grid || !ranking) return;

  const memberData = [];
  getAllUsers().forEach(user => {
    const id = user.id;
    const profile = JSON.parse(localStorage.getItem(`profile_${id}`) || 'null');
    const name = profile ? profile.name : id;
    const short = name.length > 4 ? name.slice(0, 4) : name;
    const records = JSON.parse(localStorage.getItem(`bodylog_${id}`) || '{}');
    const dates = Object.keys(records).sort();
    const streak = calcStreak(dates);
    const total = dates.length;
    const latest = dates.length ? records[dates[dates.length - 1]] : null;
    const cond = latest ? latest.body.condition : null;
    memberData.push({ id, name, short, streak, total, cond, lastDate: dates.length ? dates[dates.length - 1] : '기록 없음', weekScore: calcWeekScore(dates, records) });
  });

  grid.innerHTML = memberData.map(m => {
    let condClass = '', condText = '-';
    if (m.cond) { condText = `컨디션 ${m.cond}`; condClass = m.cond >= 7 ? 'condition-high' : m.cond >= 4 ? 'condition-mid' : 'condition-low'; }
    return `<div class="guild-card"><div class="name">${m.short}</div><div class="streak">${m.streak}</div><div class="streak-label">연속 기록</div><span class="condition-badge ${condClass}">${condText}</span><div class="last-record">총 ${m.total}일 | ${m.lastDate}</div></div>`;
  }).join('');

  const sorted = [...memberData].sort((a, b) => b.weekScore - a.weekScore);
  const rankColors = ['gold', 'silver', 'bronze'];
  ranking.innerHTML = sorted.map((m, i) => `<div class="rank-row"><span class="rank-number ${rankColors[i] || ''}">${i + 1}</span><span class="rank-name">${m.name}</span><span class="rank-score">${m.weekScore}점</span></div>`).join('');
}

function calcWeekScore(dates, records) {
  const today = new Date(getTodayStr());
  let score = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (records[ds]) {
      const r = records[ds];
      if (r.workout.morning) score += 2;
      if (r.workout.breakDone) score += 1;
      if (r.workout.evening) score += 2;
      if (r.body.sleepHours >= 7) score += 1;
      if (r.body.condition >= 7) score += 1;
    }
  }
  return score;
}

function updateWeekInfo() {
  const today = new Date();
  const diffDays = Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7) + 1;
  const progress = Math.min((diffDays / 56) * 100, 100);
  const weekEl = document.getElementById('current-week');
  const barEl = document.getElementById('week-bar');
  const infoEl = document.getElementById('week-info');
  if (!weekEl) return;
  let phase, info;
  if (weekNum <= 2) { phase = `${weekNum}주차 — 적응기`; info = '기본 횟수 유지. 습관 만들기에 집중하세요.'; }
  else if (weekNum <= 4) { phase = `${weekNum}주차 — 성장기`; info = '횟수 +5, 플랭크 +15초. 한 단계 올려봅시다.'; }
  else if (weekNum <= 6) { phase = `${weekNum}주차 — 강화기`; info = '세트 +1, 유산소 10분. 체력이 올라갑니다.'; }
  else { phase = `${weekNum}주차 — 완성기`; info = '아침 15분 / 저녁 30분. 최고의 컨디션으로!'; }
  weekEl.textContent = phase;
  barEl.style.width = progress + '%';
  infoEl.textContent = info;
}
