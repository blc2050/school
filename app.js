// EduPortal - Shri Saraswati Vidhya Mandir Mandli - Application Logic

// Global database variables
let activeStudents = [];
let tcStudents = [];
let classesMain = [];
let classesTc = [];
let mediums = [];
let classByMedium = {};
let dueFees = {};

// Application states
let currentTab = 'directory'; // 'directory', 'tc', 'counts', 'fees', or 'pending'
let currentMediumFilter = 'all';
let selectedClass = '';
let currentSearchQuery = '';
let currentCountsFormat = 'hindi-pri'; // 'hindi-pri', 'hindi-sec', 'english', 'consolidated'

// Pending Admission states
let pendingStudents = [];
let pendingMediumFilter = 'all';
let pendingLevelFilter = 'all';

// Global Search States
let searchFocusedIndex = -1;
let globalSearchResultsList = [];

// Fee Search States
let feeSearchFocusedIndex = -1;
let feeSearchResultsList = [];

// Logical sort order for classes
const CLASS_SORT_ORDER = [
    "LKG EM", "UKG EM", "KG EM",
    "1ST EM", "2ND EM", "3RD EM", "4TH EM", "5TH EM", "6TH A EM", "7TH A EM", "8TH A EM", "9TH A EM", "10TH A EM",
    "11TH SCI EM", "12TH ARTS EM", "12TH SCI EM",
    "1ST", "2ND", "3RD", "4TH", "5TH", "6TH A", "6TH B", "7TH A", "7TH B", "8TH A", "8TH B", "9TH A", "9TH B", "10TH A", "10TH B", "10TH C",
    "11TH AGR", "11TH ARTS", "11TH SCI",
    "12TH AGR", "12TH ARTS", "12TH SCI"
];

// Mapping class name (from MAIN) to grade name in TC Report
const CLASS_TO_GRADE_MAP = {
    "10TH A EM": "Tenth\u00a0(2026-27)",
    "10TH A": "Tenth\u00a0(2026-27)",
    "10TH B": "Tenth\u00a0(2026-27)",
    "10TH C": "Tenth\u00a0(2026-27)",
    
    "11TH SCI EM": "Eleventh\u00a0(2026-27)",
    "11TH AGR": "Eleventh\u00a0(2026-27)",
    "11TH ARTS": "Eleventh\u00a0(2026-27)",
    "11TH SCI": "Eleventh\u00a0(2026-27)",
    
    "12TH ARTS EM": "Twelth\u00a0(2026-27)",
    "12TH SCI EM": "Twelth\u00a0(2026-27)",
    "12TH AGR": "Twelth\u00a0(2026-27)",
    "12TH ARTS": "Twelth\u00a0(2026-27)",
    "12TH SCI": "Twelth\u00a0(2026-27)",
    
    "1ST EM": "First\u00a0(2026-27)",
    "1ST": "First\u00a0(2026-27)",
    
    "2ND EM": "Second\u00a0(2026-27)",
    "2ND": "Second\u00a0(2026-27)",
    
    "3RD EM": "Third\u00a0(2026-27)",
    "3RD": "Third\u00a0(2026-27)",
    
    "4TH EM": "Fourth\u00a0(2026-27)",
    "4TH": "Fourth\u00a0(2026-27)",
    
    "5TH EM": "Fifth\u00a0(2026-27)",
    "5TH": "Fifth\u00a0(2026-27)",
    
    "6TH A EM": "Sixth\u00a0(2026-27)",
    "6TH A": "Sixth\u00a0(2026-27)",
    "6TH B": "Sixth\u00a0(2026-27)",
    
    "7TH A EM": "Seventh\u00a0(2026-27)",
    "7TH A": "Seventh\u00a0(2026-27)",
    "7TH B": "Seventh\u00a0(2026-27)",
    
    "8TH A EM": "Eight\u00a0(2026-27)",
    "8TH A": "Eight\u00a0(2026-27)",
    "8TH B": "Eight\u00a0(2026-27)",
    
    "9TH A EM": "Ninth\u00a0(2026-27)",
    "9TH A": "Ninth\u00a0(2026-27)",
    "9TH B": "Ninth\u00a0(2026-27)",
    
    "KG EM": "PP.5+\u00a0(2026-27)",
    "UKG EM": "PP.5+\u00a0(2026-27)",
    "LKG EM": "PP.4+\u00a0(2026-27)"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    initStats();
    populateClassDropdown();
    updateUIState();
    
    // Close global and fee search results on clicking outside
    document.addEventListener("click", (e) => {
        const globalContainer = document.querySelector(".global-search-container");
        const globalResults = document.getElementById("global-search-results");
        if (globalResults && globalContainer && !globalContainer.contains(e.target)) {
            globalResults.style.display = "none";
        }
        
        const feeContainer = document.querySelector("#tab-fees .global-search-container");
        const feeResults = document.getElementById("fee-search-results");
        if (feeResults && feeContainer && !feeContainer.contains(e.target)) {
            feeResults.style.display = "none";
        }
    });
});

// Load variables from window.STUDENTS_DATA
function loadData() {
    if (window.STUDENTS_DATA) {
        activeStudents = window.STUDENTS_DATA.active_students || [];
        tcStudents = window.STUDENTS_DATA.tc_students || [];
        classesMain = window.STUDENTS_DATA.classes_main || [];
        classesTc = window.STUDENTS_DATA.classes_tc || [];
        mediums = window.STUDENTS_DATA.mediums || [];
        classByMedium = window.STUDENTS_DATA.class_by_medium || {};
        dueFees = window.STUDENTS_DATA.due_fees || {};
        pendingStudents = window.STUDENTS_DATA.pending_students || [];
    } else {
        console.error("Database variables (data.js) not loaded.");
    }
}

// Compute and render stats dashboard
function initStats() {
    const totalActive = activeStudents.length;
    const totalTc = tcStudents.length;
    const englishCount = activeStudents.filter(s => s.medium === 'English').length;
    const hindiCount = activeStudents.filter(s => s.medium === 'Hindi').length;
    
    const activeBoys = activeStudents.filter(s => s.gender === 'Male').length;
    const activeGirls = activeStudents.filter(s => s.gender === 'Female').length;
    
    const englishBoys = activeStudents.filter(s => s.medium === 'English' && s.gender === 'Male').length;
    const englishGirls = activeStudents.filter(s => s.medium === 'English' && s.gender === 'Female').length;
    
    const hindiBoys = activeStudents.filter(s => s.medium === 'Hindi' && s.gender === 'Male').length;
    const hindiGirls = activeStudents.filter(s => s.medium === 'Hindi' && s.gender === 'Female').length;
    
    const newAdmissions = activeStudents.filter(s => s.date_of_admission && s.date_of_admission >= '2026-04-01');
    const newBoys = newAdmissions.filter(s => s.gender === 'Male').length;
    const newGirls = newAdmissions.filter(s => s.gender === 'Female').length;
    
    document.getElementById('stat-active-count').innerText = totalActive.toLocaleString();
    document.getElementById('stat-active-boys').innerText = activeBoys.toLocaleString();
    document.getElementById('stat-active-girls').innerText = activeGirls.toLocaleString();
    
    document.getElementById('stat-english-count').innerText = englishCount.toLocaleString();
    document.getElementById('stat-english-boys').innerText = englishBoys.toLocaleString();
    document.getElementById('stat-english-girls').innerText = englishGirls.toLocaleString();
    
    document.getElementById('stat-hindi-count').innerText = hindiCount.toLocaleString();
    document.getElementById('stat-hindi-boys').innerText = hindiBoys.toLocaleString();
    document.getElementById('stat-hindi-girls').innerText = hindiGirls.toLocaleString();
    
    document.getElementById('stat-new-count').innerText = newAdmissions.length.toLocaleString();
    document.getElementById('stat-new-boys').innerText = newBoys.toLocaleString();
    document.getElementById('stat-new-girls').innerText = newGirls.toLocaleString();
    
    document.getElementById('stat-tc-count').innerText = totalTc.toLocaleString();
    document.getElementById('stat-pending-count').innerText = pendingStudents.length.toLocaleString();
    
    const highlightedActive = activeStudents.filter(s => s.is_highlighted).length;
    const highlightedTc = tcStudents.filter(s => s.is_highlighted).length;
    const totalHighlighted = highlightedActive + highlightedTc;
    
    const highlightBadge = document.getElementById('directory-highlight-count');
    if (highlightBadge) {
        highlightBadge.innerText = `${totalHighlighted} Updated Rows`;
        if (totalHighlighted > 0) {
            highlightBadge.style.display = 'inline-flex';
        } else {
            highlightBadge.style.display = 'none';
        }
    }
}

// Populate class dropdown based on active medium
function populateClassDropdown() {
    const classSelect = document.getElementById('class-select');
    if (!classSelect) return;
    
    classSelect.innerHTML = '<option value="">-- Select Class --</option>';
    
    let list = classesMain;
    if (currentMediumFilter !== 'all') {
        list = classByMedium[currentMediumFilter] || [];
    }
    
    list.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.innerText = cls;
        classSelect.appendChild(opt);
    });
    
    if (selectedClass && !list.includes(selectedClass)) {
        selectedClass = '';
    }
    classSelect.value = selectedClass;
}

// Set Medium filter
function setMediumFilter(medium) {
    currentMediumFilter = medium;
    
    document.querySelectorAll('#medium-filters .segment-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-medium') === medium) {
            btn.classList.add('active');
        }
    });
    
    selectedClass = '';
    populateClassDropdown();
    updateUIState();
}

// Handle Class selection change
function handleClassChange() {
    const classSelect = document.getElementById('class-select');
    if (!classSelect) return;
    
    selectedClass = classSelect.value;
    
    const searchInput = document.getElementById('global-student-search');
    if (searchInput) searchInput.value = '';
    currentSearchQuery = '';
    
    updateUIState();
}

// Switch Side Tabs
function switchTab(tabId) {
    currentTab = tabId;
    
    document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${tabId}`).classList.add('active');
    
    const pageSubtitle = document.getElementById('page-subtitle');
    if (pageSubtitle) {
        if (tabId === 'directory') {
            pageSubtitle.innerText = 'Student Directory';
        } else if (tabId === 'tc') {
            pageSubtitle.innerText = 'TC Report';
        } else if (tabId === 'counts') {
            pageSubtitle.innerText = 'Student Counts Summary';
        } else if (tabId === 'pending') {
            pageSubtitle.innerText = 'Pending Admissions';
        } else {
            pageSubtitle.innerText = 'Student Fee Due Report';
        }
    }
    
    // Explicitly close and clear all search result overlay dropdowns when switching tabs
    const globalResults = document.getElementById('global-search-results');
    const globalInput = document.getElementById('global-student-search');
    if (globalResults) {
        globalResults.style.display = 'none';
        globalResults.innerHTML = '';
    }
    if (globalInput) globalInput.value = '';
    globalSearchResultsList = [];
    searchFocusedIndex = -1;
    
    const feeResults = document.getElementById('fee-search-results');
    const feeInput = document.getElementById('fee-student-search');
    if (feeResults) {
        feeResults.style.display = 'none';
        feeResults.innerHTML = '';
    }
    if (feeInput) feeInput.value = '';
    feeSearchResultsList = [];
    feeSearchFocusedIndex = -1;
    
    // Reset fee search state only when switching tabs
    if (tabId === 'fees') {
        const feeReportCard = document.getElementById('fee-report-card');
        const feePlaceholder = document.getElementById('fee-placeholder-card');
        if (feeReportCard) feeReportCard.style.display = 'none';
        if (feePlaceholder) feePlaceholder.style.display = 'block';
    }
    
    // Reset pending filters state only when switching tabs
    if (tabId === 'pending') {
        pendingMediumFilter = 'all';
        pendingLevelFilter = 'all';
        
        document.querySelectorAll('#pending-medium-filters .segment-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-medium') === 'all') btn.classList.add('active');
        });
        document.querySelectorAll('#pending-level-filters .segment-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-level') === 'all') btn.classList.add('active');
        });
    }
    
    updateUIState();
}

// Switch BGT Counts Formats
function switchCountsFormat(formatId) {
    currentCountsFormat = formatId;
    
    document.querySelectorAll('.report-tab-pill-group .pill-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const btnMap = {
        'hindi-pri': 'btn-format-hindi-pri',
        'hindi-sec': 'btn-format-hindi-sec',
        'english': 'btn-format-english',
        'consolidated': 'btn-format-consolidated'
    };
    
    const activeBtn = document.getElementById(btnMap[formatId]);
    if (activeBtn) activeBtn.classList.add('active');
    
    const formatTitle = document.getElementById('counts-format-title');
    const metaTitle = document.getElementById('counts-results-meta');
    
    if (formatTitle) {
        if (formatId === 'hindi-pri') {
            formatTitle.innerText = "नामांकन सूचना वर्गवार : हिंदी माध्यम (प्राथमिक)";
            if (metaTitle) metaTitle.innerText = "Hindi Medium (Primary 1st to 5th) Category Wise Student Count";
        } else if (formatId === 'hindi-sec') {
            formatTitle.innerText = "नामांकन सूचना वर्गवार : हिंदी माध्यम (माध्यमिक/उच्च माध्यमिक)";
            if (metaTitle) metaTitle.innerText = "Hindi Medium (Secondary 6th to 12th) Category Wise Student Count";
        } else if (formatId === 'english') {
            formatTitle.innerText = "नामांकन सूचना वर्गवार : अंग्रेजी माध्यम";
            if (metaTitle) metaTitle.innerText = "English Medium (Pre-Primary to 12th) Category Wise Student Count";
        } else {
            formatTitle.innerText = "नामांकन सूचना वर्गवार : समेकित विवरण (हिन्दी + अंग्रेजी)";
            if (metaTitle) metaTitle.innerText = "Consolidated Summary (English + Hindi) Category Wise Student Count";
        }
    }
    
    renderCountsTable();
}

// Search ranking algorithm to sort matches by priority
function rankSearchResults(list, query) {
    const isDigit = /^\d+$/.test(query);
    
    const scoredList = list.map(item => {
        let score = 9999;
        
        if (item.type === 'Class') {
            const nameLower = item.name.toLowerCase();
            if (nameLower === query) score = 0;
            else if (nameLower.startsWith(query)) score = 1;
            else if (nameLower.includes(query)) score = 2;
        } else {
            const nameLower = (item.student_name || '').toLowerCase();
            const fatherLower = (item.father_name || '').toLowerCase();
            const srVal = (item.sr_no || item.scholar_no || '').toLowerCase();
            const mobVal = (item.mobile_no || '').toLowerCase();
            
            if (isDigit) {
                // Numeric query priority order: SR No first, then Mobile No, then others
                if (srVal === query) score = 5;
                else if (srVal.startsWith(query)) score = 10;
                else if (srVal.includes(query)) score = 20;
                else if (mobVal === query) score = 30;
                else if (mobVal.startsWith(query)) score = 40;
                else if (mobVal.includes(query)) score = 50;
            } else {
                // Alphabetical query priority order: Student Name first, then Father Name, then others
                if (nameLower === query) score = 5;
                else if (nameLower.startsWith(query)) score = 10;
                else if (nameLower.includes(query)) score = 20;
                else if (fatherLower === query) score = 30;
                else if (fatherLower.startsWith(query)) score = 40;
                else if (fatherLower.includes(query)) score = 50;
            }
        }
        
        return { item, score };
    });
    
    // Sort items by priority score ascending
    const matches = scoredList.filter(x => x.score < 9999);
    matches.sort((a, b) => a.score - b.score);
    return matches.map(x => x.item);
}

// Global Spotlight Search Handler (searches school-wide for both students and classes)
function handleGlobalSearch() {
    const input = document.getElementById('global-student-search');
    const resultsDiv = document.getElementById('global-search-results');
    if (!input || !resultsDiv) return;
    
    let query = input.value.toLowerCase().trim();
    if (!query) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
        globalSearchResultsList = [];
        searchFocusedIndex = -1;
        return;
    }
    
    // Strip prefixes like "class" or "grade" to make class queries robust (e.g. "Class 10th" -> "10th")
    query = query.replace(/^class\s+/g, '').replace(/^grade\s+/g, '');
    
    // 1. Search for matching classes (limit to 3 matches)
    const matchedClasses = classesMain.filter(cls => 
        cls.toLowerCase().includes(query)
    ).map(cls => ({ name: cls, type: 'Class' }));
    
    // 2. Filter Active Students (searches Name, Father, SR, NIC and Mobile number)
    const matchedActive = activeStudents.filter(s => 
        s.student_name.toLowerCase().includes(query) ||
        s.father_name.toLowerCase().includes(query) ||
        s.sr_no.toLowerCase().includes(query) ||
        (s.mobile_no && s.mobile_no.toLowerCase().includes(query)) ||
        (s.student_nic_id && s.student_nic_id.toLowerCase().includes(query))
    ).map(s => ({ ...s, type: 'Active' }));
    
    // 3. Filter TC Students
    const matchedTc = tcStudents.filter(s => 
        s.student_name.toLowerCase().includes(query) ||
        s.father_name.toLowerCase().includes(query) ||
        s.sr_no.toLowerCase().includes(query) ||
        (s.student_nic_id && s.student_nic_id.toLowerCase().includes(query))
    ).map(s => ({ ...s, type: 'TC' }));
    
    // Combine and rank all matches
    const allMatches = [...matchedClasses, ...matchedActive, ...matchedTc];
    globalSearchResultsList = rankSearchResults(allMatches, query).slice(0, 10);
    searchFocusedIndex = -1;
    
    if (globalSearchResultsList.length === 0) {
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
            <div style="padding: 14px; text-align: center; color: var(--slate-700); font-size: 0.85rem;">
                <i class="fa-regular fa-face-frown" style="font-size: 1.2rem; display: block; margin-bottom: 6px; color: var(--slate-300);"></i>
                No matching students or classes found.
            </div>
        `;
        return;
    }
    
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    
    globalSearchResultsList.forEach((itemData, index) => {
        const item = document.createElement('div');
        item.classList.add('search-result-item');
        item.setAttribute('data-index', index);
        
        if (itemData.type === 'Class') {
            item.innerHTML = `
                <div class="result-details">
                    <span class="result-name"><i class="fa-solid fa-graduation-cap" style="margin-right: 6px; color: var(--primary);"></i>Go to Class: ${itemData.name}</span>
                    <span class="result-meta">View active student roster for ${itemData.name}</span>
                </div>
                <div class="result-status">
                    <span class="status-indicator-badge" style="background-color: var(--primary-light); color: var(--primary-dark);">OPEN CLASS</span>
                </div>
            `;
            item.onclick = () => {
                selectClassSearchResult(itemData.name);
            };
        } else {
            const badgeClass = itemData.type === 'Active' ? 'badge-active' : 'badge-tc';
            const classLabel = itemData.type === 'Active' ? itemData.class : itemData.class || 'N/A';
            const mediumLabel = itemData.type === 'Active' ? `(${itemData.medium} Medium)` : '';
            
            item.innerHTML = `
                <div class="result-details">
                    <span class="result-name">${itemData.student_name}</span>
                    <span class="result-meta">SR: ${itemData.sr_no} | Father: ${itemData.father_name}</span>
                </div>
                <div class="result-status">
                    <!-- Class Tag styled as hyperlink that switches to class list roster when clicked -->
                    <span class="result-class-tag-link" onclick="event.stopPropagation(); selectClassSearchResult('${classLabel}');">${classLabel} ${mediumLabel}</span>
                    <span class="status-indicator-badge ${badgeClass}">${itemData.type}</span>
                </div>
            `;
            item.onclick = () => {
                selectSearchResult(itemData);
            };
        }
        
        resultsDiv.appendChild(item);
    });
}

// Select class from search results
function selectClassSearchResult(className) {
    const input = document.getElementById('global-student-search');
    const resultsDiv = document.getElementById('global-search-results');
    if (input) input.value = '';
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
    }
    
    // Set parameters
    selectedClass = className;
    currentTab = 'directory';
    switchTab('directory');
    
    // Set value in dropdown
    const classSelect = document.getElementById('class-select');
    if (classSelect) classSelect.value = className;
    
    updateUIState();
}

// Select student item from global search list
function selectSearchResult(student) {
    const input = document.getElementById('global-student-search');
    const resultsDiv = document.getElementById('global-search-results');
    if (input) input.value = '';
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
    }
    
    viewStudentDetails(student.sr_no, student.type === 'Active');
}

// Keyboard navigation in Spotlight Search Dropdown
function handleGlobalSearchKey(event) {
    const resultsDiv = document.getElementById('global-search-results');
    if (!resultsDiv || resultsDiv.style.display === 'none') return;
    
    const items = resultsDiv.getElementsByClassName('search-result-item');
    if (items.length === 0) return;
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        searchFocusedIndex++;
        if (searchFocusedIndex >= items.length) searchFocusedIndex = 0;
        updateSearchFocus(items);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        searchFocusedIndex--;
        if (searchFocusedIndex < 0) searchFocusedIndex = items.length - 1;
        updateSearchFocus(items);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (searchFocusedIndex >= 0 && searchFocusedIndex < items.length) {
            items[searchFocusedIndex].click();
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        const input = document.getElementById('global-student-search');
        if (input) input.value = '';
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
    }
}

// Apply visual highlight class for focused search result item
function updateSearchFocus(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('focused');
    }
    if (searchFocusedIndex >= 0 && searchFocusedIndex < items.length) {
        items[searchFocusedIndex].classList.add('focused');
        items[searchFocusedIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Global Student Fee Search Handler (searches exclusively in dueFees)
function handleFeeSearch() {
    const input = document.getElementById('fee-student-search');
    const resultsDiv = document.getElementById('fee-search-results');
    if (!input || !resultsDiv) return;
    
    const query = input.value.toLowerCase().trim();
    if (!query) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
        feeSearchResultsList = [];
        feeSearchFocusedIndex = -1;
        return;
    }
    
    const feeRecords = Object.values(dueFees);
    
    // Filter matching fee records (searches Name, Father, SR, and Mobile number)
    const matchedFees = feeRecords.filter(f => 
        f.student_name.toLowerCase().includes(query) ||
        f.father_name.toLowerCase().includes(query) ||
        f.scholar_no.toLowerCase().includes(query) ||
        (f.mobile_no && f.mobile_no.toLowerCase().includes(query))
    );
    
    feeSearchResultsList = rankSearchResults(matchedFees, query).slice(0, 8);
    feeSearchFocusedIndex = -1;
    
    if (feeSearchResultsList.length === 0) {
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
            <div style="padding: 14px; text-align: center; color: var(--slate-700); font-size: 0.85rem;">
                <i class="fa-regular fa-face-frown" style="font-size: 1.2rem; display: block; margin-bottom: 6px; color: var(--slate-300);"></i>
                No matching student fee records found.
            </div>
        `;
        return;
    }
    
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    
    feeSearchResultsList.forEach((feeData, index) => {
        const item = document.createElement('div');
        item.classList.add('search-result-item');
        item.setAttribute('data-index', index);
        
        item.innerHTML = `
            <div class="result-details">
                <span class="result-name">${feeData.student_name}</span>
                <span class="result-meta">SR: ${feeData.scholar_no} | Father: ${feeData.father_name}</span>
            </div>
            <div class="result-status">
                <span class="result-class-tag">${feeData.class_name}</span>
                <span class="status-indicator-badge" style="background-color: var(--primary-light); color: var(--primary-dark);">SELECT</span>
            </div>
        `;
        
        item.onclick = () => {
            selectFeeSearchResult(feeData);
        };
        
        resultsDiv.appendChild(item);
    });
}

// Select student item from fee search results
function selectFeeSearchResult(feeData) {
    const input = document.getElementById('fee-student-search');
    const resultsDiv = document.getElementById('fee-search-results');
    if (input) input.value = '';
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
    }
    
    renderStudentFeeDue(feeData);
}

// Keyboard navigation in Fee Search Dropdown
function handleFeeSearchKey(event) {
    const resultsDiv = document.getElementById('fee-search-results');
    if (!resultsDiv || resultsDiv.style.display === 'none') return;
    
    const items = resultsDiv.getElementsByClassName('search-result-item');
    if (items.length === 0) return;
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        feeSearchFocusedIndex++;
        if (feeSearchFocusedIndex >= items.length) feeSearchFocusedIndex = 0;
        updateFeeSearchFocus(items);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        feeSearchFocusedIndex--;
        if (feeSearchFocusedIndex < 0) feeSearchFocusedIndex = items.length - 1;
        updateFeeSearchFocus(items);
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (feeSearchFocusedIndex >= 0 && feeSearchFocusedIndex < items.length) {
            items[feeSearchFocusedIndex].click();
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        const input = document.getElementById('fee-student-search');
        if (input) input.value = '';
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = '';
    }
}

// Apply visual highlight class for focused fee search item
function updateFeeSearchFocus(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('focused');
    }
    if (feeSearchFocusedIndex >= 0 && feeSearchFocusedIndex < items.length) {
        items[feeSearchFocusedIndex].classList.add('focused');
        items[feeSearchFocusedIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Render dynamic student fee dues statement
function renderStudentFeeDue(feeRecord) {
    const tbody = document.getElementById('fee-report-tbody');
    if (!tbody) return;
    
    // Bind meta student details
    document.getElementById('fee-stud-name').innerText = feeRecord.student_name;
    document.getElementById('fee-stud-sr').innerText = feeRecord.scholar_no;
    document.getElementById('fee-stud-father').innerText = feeRecord.father_name;
    document.getElementById('fee-stud-class').innerText = feeRecord.class_name;
    document.getElementById('fee-stud-mobile').innerText = feeRecord.mobile_no || 'N/A';
    
    tbody.innerHTML = '';
    
    // Map Excel values into Installment rows
    const rows = [
        {
            label: "School Fee",
            ins1: feeRecord.school_fee_1,
            ins2: feeRecord.school_fee_2,
            ins3: feeRecord.school_fee_3,
            prev: 0,
            total: feeRecord.school_fee_1 + feeRecord.school_fee_2 + feeRecord.school_fee_3
        },
        {
            label: "Bus & Transport Fee",
            ins1: feeRecord.bus_fee_1,
            ins2: feeRecord.bus_fee_2,
            ins3: feeRecord.bus_fee_3,
            prev: 0,
            total: feeRecord.bus_fee_1 + feeRecord.bus_fee_2 + feeRecord.bus_fee_3
        },
        {
            label: "Admission Fee",
            ins1: feeRecord.admission_fee_1,
            ins2: 0,
            ins3: 0,
            prev: 0,
            total: feeRecord.admission_fee_1
        },
        {
            label: "Hostel Fee",
            ins1: feeRecord.hostel_fee_1,
            ins2: feeRecord.hostel_fee_2,
            ins3: 0,
            prev: 0,
            total: feeRecord.hostel_fee_1 + feeRecord.hostel_fee_2
        },
        {
            label: "Previous Year Balance",
            ins1: 0,
            ins2: 0,
            ins3: 0,
            prev: feeRecord.prev_due,
            total: feeRecord.prev_due
        },
        {
            label: "Late Fee",
            ins1: 0,
            ins2: 0,
            ins3: 0,
            prev: 0,
            total: feeRecord.late_fee
        },
        {
            label: "Advance Adjustable (Prepaid)",
            ins1: 0,
            ins2: 0,
            ins3: 0,
            prev: 0,
            total: -feeRecord.advance_adjustable // Render as negative balance deduction
        }
    ];
    
    rows.forEach(r => {
        // Hide row if all values are zero
        if (r.total === 0 && r.ins1 === 0 && r.ins2 === 0 && r.ins3 === 0 && r.prev === 0) return;
        
        const tr = document.createElement('tr');
        
        const val1 = r.ins1 ? `₹${r.ins1.toLocaleString()}` : '-';
        const val2 = r.ins2 ? `₹${r.ins2.toLocaleString()}` : '-';
        const val3 = r.ins3 ? `₹${r.ins3.toLocaleString()}` : '-';
        const valP = r.prev ? `₹${r.prev.toLocaleString()}` : '-';
        
        let totalStr = `₹${r.total.toLocaleString()}`;
        if (r.total < 0) {
            totalStr = `-₹${Math.abs(r.total).toLocaleString()}`;
        }
        
        tr.innerHTML = `
            <td style="font-weight: 600; text-align: left;">${r.label}</td>
            <td style="text-align: center;">${val1}</td>
            <td style="text-align: center;">${val2}</td>
            <td style="text-align: center;">${val3}</td>
            <td style="text-align: center;">${valP}</td>
            <td style="text-align: center; font-weight: 700; background-color: var(--slate-50);">${totalStr}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Render highlighted Grand Total Row
    const totalTr = document.createElement('tr');
    totalTr.style.borderTop = '2px solid var(--slate-900)';
    totalTr.style.borderBottom = '2px solid var(--slate-900)';
    totalTr.style.backgroundColor = 'var(--slate-100)';
    totalTr.style.fontWeight = '800';
    
    const tot1 = feeRecord.school_fee_1 + feeRecord.bus_fee_1 + feeRecord.admission_fee_1 + feeRecord.hostel_fee_1;
    const tot2 = feeRecord.school_fee_2 + feeRecord.bus_fee_2 + feeRecord.hostel_fee_2;
    const tot3 = feeRecord.school_fee_3 + feeRecord.bus_fee_3;
    const totP = feeRecord.prev_due;
    
    const valTot1 = tot1 ? `₹${tot1.toLocaleString()}` : '-';
    const valTot2 = tot2 ? `₹${tot2.toLocaleString()}` : '-';
    const valTot3 = tot3 ? `₹${tot3.toLocaleString()}` : '-';
    const valTotP = totP ? `₹${totP.toLocaleString()}` : '-';
    
    totalTr.innerHTML = `
        <td style="font-weight: 800; text-align: left;">TOTAL YEARLY DUE</td>
        <td style="text-align: center;">${valTot1}</td>
        <td style="text-align: center;">${valTot2}</td>
        <td style="text-align: center;">${valTot3}</td>
        <td style="text-align: center;">${valTotP}</td>
        <td style="text-align: center; font-weight: 900; background-color: var(--slate-200); color: var(--primary-dark); font-size: 0.95rem;">₹${feeRecord.total.toLocaleString()}</td>
    `;
    
    tbody.appendChild(totalTr);
    
    // Toggle containers
    document.getElementById('fee-report-card').style.display = 'block';
    document.getElementById('fee-placeholder-card').style.display = 'none';
}

// Update UI State Contexts
function updateUIState() {
    const placeholder = document.getElementById('no-class-placeholder');
    const tabDir = document.getElementById('tab-directory');
    const tabTc = document.getElementById('tab-tc');
    const tabCounts = document.getElementById('tab-counts');
    const tabFees = document.getElementById('tab-fees');
    const tabPending = document.getElementById('tab-pending');
    
    const filterPanel = document.getElementById('filter-panel-section');
    const classFilterRow = document.getElementById('class-filter-row');
    const btnPrintList = document.getElementById('btn-print-list');
    
    // Manage tabs visibility
    if (currentTab === 'counts') {
        if (filterPanel) filterPanel.style.display = 'block';
        if (classFilterRow) classFilterRow.style.display = 'none';
        if (btnPrintList) btnPrintList.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        
        if (tabDir) tabDir.style.display = 'none';
        if (tabTc) tabTc.style.display = 'none';
        if (tabFees) tabFees.style.display = 'none';
        if (tabPending) tabPending.style.display = 'none';
        if (tabCounts) tabCounts.style.display = 'block';
        switchCountsFormat(currentCountsFormat);
    } else if (currentTab === 'fees') {
        if (filterPanel) filterPanel.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        
        if (tabDir) tabDir.style.display = 'none';
        if (tabTc) tabTc.style.display = 'none';
        if (tabCounts) tabCounts.style.display = 'none';
        if (tabPending) tabPending.style.display = 'none';
        if (tabFees) tabFees.style.display = 'block';
    } else if (currentTab === 'pending') {
        if (filterPanel) filterPanel.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        
        if (tabDir) tabDir.style.display = 'none';
        if (tabTc) tabTc.style.display = 'none';
        if (tabCounts) tabCounts.style.display = 'none';
        if (tabFees) tabFees.style.display = 'none';
        if (tabPending) tabPending.style.display = 'block';
        renderPendingTables();
    } else {
        if (filterPanel) filterPanel.style.display = 'block';
        if (classFilterRow) classFilterRow.style.display = 'flex';
        
        if (tabCounts) tabCounts.style.display = 'none';
        if (tabFees) tabFees.style.display = 'none';
        if (tabPending) tabPending.style.display = 'none';
        
        if (!selectedClass) {
            if (placeholder) placeholder.style.display = 'block';
            if (tabDir) tabDir.style.display = 'none';
            if (tabTc) tabTc.style.display = 'none';
            if (btnPrintList) btnPrintList.style.display = 'none';
        } else {
            if (placeholder) placeholder.style.display = 'none';
            if (btnPrintList) btnPrintList.style.display = 'inline-flex';
            
            if (currentTab === 'directory') {
                if (tabDir) tabDir.style.display = 'block';
                if (tabTc) tabTc.style.display = 'none';
                renderDirectoryTable();
            } else {
                if (tabDir) tabDir.style.display = 'none';
                if (tabTc) tabTc.style.display = 'block';
                renderTCTable();
            }
        }
    }
}

// Render Directory Table (Active Students)
function renderDirectoryTable() {
    const tbody = document.getElementById('directory-tbody');
    const showingCount = document.getElementById('directory-showing-count');
    const selectedClassName = document.getElementById('selected-class-name');
    const highlightBadge = document.getElementById('directory-highlight-count');
    
    if (!tbody) return;
    
    if (selectedClassName) selectedClassName.innerText = selectedClass;
    
    let list = activeStudents.filter(s => s.class === selectedClass);
    
    showingCount.innerText = list.length;
    tbody.innerHTML = '';
    
    const highlightedCount = list.filter(s => s.is_highlighted).length;
    if (highlightBadge) {
        if (highlightedCount > 0) {
            highlightBadge.innerText = `${highlightedCount} Updated`;
            highlightBadge.style.display = 'inline-flex';
        } else {
            highlightBadge.style.display = 'none';
        }
    }
    
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="table-empty-cell" style="text-align: center; padding: 40px; color: var(--slate-700);">
                    <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--slate-300); display: block;"></i>
                    No students found.
                </td>
            </tr>
        `;
        return;
    }
    
    list.forEach((student, index) => {
        const tr = document.createElement('tr');
        if (student.is_highlighted) {
            tr.classList.add('row-highlighted');
            tr.title = "Record updated on 30-06-2026";
        }
        
        const sNo = index + 1;
        const rollNo = student.roll_no || '-';
        const dob = student.dob || '-';
        const category = student.social_category || '-';
        const admDate = student.date_of_admission || '-';
        const rte = student.rte || 'No';
        
        // Wrap SR No in a link that triggers viewStudentDetails modal
        tr.innerHTML = `
            <td data-label="S.No"><strong>${sNo}</strong></td>
            <td data-label="SR No">
                <a href="#" onclick="viewStudentDetails('${student.sr_no}', true); return false;" class="sr-link">${student.sr_no}</a>
            </td>
            <td data-label="Student Name">${student.student_name}</td>
            <td data-label="Father Name">${student.father_name}</td>
            <td data-label="Mother Name">${student.mother_name}</td>
            <td data-label="DOB">${dob}</td>
            <td data-label="Gender">${student.gender}</td>
            <td data-label="Category">${category}</td>
            <td data-label="Adm. Date">${admDate}</td>
            <td data-label="RTE">${rte}</td>
            <td data-label="Roll No"><strong>${rollNo}</strong></td>
            <td class="no-print" data-label="Profile">
                <button class="btn-view" onclick="viewStudentDetails('${student.sr_no}', true)" title="View Profile">
                    <i class="fa-regular fa-id-card"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render TC Report Table
function renderTCTable() {
    const tbody = document.getElementById('tc-tbody');
    const selectedGrade = document.getElementById('selected-tc-grade-name');
    const highlightBadge = document.getElementById('tc-highlight-count');
    
    if (!tbody) return;
    
    const tcGrade = CLASS_TO_GRADE_MAP[selectedClass];
    if (selectedGrade) {
        const cleanGrade = tcGrade ? tcGrade.replace('\u00a0(2026-27)', '') : 'N/A';
        selectedGrade.innerText = cleanGrade;
    }
    
    if (!tcGrade) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="table-empty-cell" style="text-align: center; padding: 40px; color: var(--slate-700);">
                    No TC mappings found for class ${selectedClass}.
                </td>
            </tr>
        `;
        return;
    }
    
    const normalizedTcGrade = tcGrade.replace(/\s+/g, ' ').trim();
    let list = tcStudents.filter(s => {
        if (!s.class) return false;
        const studentGrade = s.class.replace(/\s+/g, ' ').trim();
        return studentGrade === normalizedTcGrade;
    });
    
    tbody.innerHTML = '';
    
    const highlightedCount = list.filter(s => s.is_highlighted).length;
    if (highlightBadge) {
        if (highlightedCount > 0) {
            highlightBadge.innerText = `${highlightedCount} Updated`;
            highlightBadge.style.display = 'inline-flex';
        } else {
            highlightBadge.style.display = 'none';
        }
    }
    
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="table-empty-cell" style="text-align: center; padding: 40px; color: var(--slate-700);">
                    No TC records found.
                </td>
            </tr>
        `;
        return;
    }
    
    list.forEach((student, index) => {
        const tr = document.createElement('tr');
        if (student.is_highlighted) {
            tr.classList.add('row-highlighted');
            tr.title = "Record updated on 30-06-2026";
        }
        
        const sNo = index + 1;
        const dob = student.dob || '-';
        const exitType = student.exit_type || 'T.C. Issued';
        const reason = student.exit_type_reason || 'Left School';
        const exitDate = student.exit_date || '-';
        
        // Wrap SR No in clickable details link
        tr.innerHTML = `
            <td data-label="S.No"><strong>${sNo}</strong></td>
            <td data-label="SR No">
                <a href="#" onclick="viewStudentDetails('${student.sr_no}', false); return false;" class="sr-link">${student.sr_no}</a>
            </td>
            <td data-label="Student NIC ID">${student.student_nic_id || '-'}</td>
            <td data-label="Student Name">${student.student_name}</td>
            <td data-label="Father Name">${student.father_name}</td>
            <td data-label="DOB">${dob}</td>
            <td data-label="Exit Type">${exitType}</td>
            <td data-label="Exit Reason">${reason}</td>
            <td data-label="Exit Date">${exitDate}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Helper to filter active students by a list of database classes
function getStudentCountsForClasses(classNames) {
    return activeStudents.filter(s => classNames.includes(s.class));
}

// Render Student Counts Table based on Selected Format
function renderCountsTable() {
    const tbody = document.getElementById('counts-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const categories = ['GENERAL', 'OBC', 'SC', 'ST', 'SBC'];
    let rowSpecifications = [];
    
    if (currentCountsFormat === 'hindi-pri') {
        rowSpecifications = [
            { label: "1ST", medium: "Hindi", queryClasses: ["1ST"] },
            { label: "2ND", medium: "Hindi", queryClasses: ["2ND"] },
            { label: "3RD", medium: "Hindi", queryClasses: ["3RD"] },
            { label: "4TH", medium: "Hindi", queryClasses: ["4TH"] },
            { label: "5TH", medium: "Hindi", queryClasses: ["5TH"] }
        ];
    } else if (currentCountsFormat === 'hindi-sec') {
        rowSpecifications = [
            { label: "6TH A", medium: "Hindi", queryClasses: ["6TH A"] },
            { label: "6TH B", medium: "Hindi", queryClasses: ["6TH B"] },
            { label: "7TH A", medium: "Hindi", queryClasses: ["7TH A"] },
            { label: "7TH B", medium: "Hindi", queryClasses: ["7TH B"] },
            { label: "8TH A", medium: "Hindi", queryClasses: ["8TH A"] },
            { label: "8TH B", medium: "Hindi", queryClasses: ["8TH B"] },
            { label: "9TH A", medium: "Hindi", queryClasses: ["9TH A"] },
            { label: "9TH B", medium: "Hindi", queryClasses: ["9TH B"] },
            { label: "10TH A", medium: "Hindi", queryClasses: ["10TH A"] },
            { label: "10TH B", medium: "Hindi", queryClasses: ["10TH B"] },
            { label: "10TH C", medium: "Hindi", queryClasses: ["10TH C"] },
            { label: "11TH ARTS", medium: "Hindi", queryClasses: ["11TH ARTS"] },
            { label: "11TH AGR", medium: "Hindi", queryClasses: ["11TH AGR"] },
            { label: "11TH SCI", medium: "Hindi", queryClasses: ["11TH SCI"] },
            { label: "12TH ARTS", medium: "Hindi", queryClasses: ["12TH ARTS"] },
            { label: "12TH AGR", medium: "Hindi", queryClasses: ["12TH AGR"] },
            { label: "12TH SCI", medium: "Hindi", queryClasses: ["12TH SCI"] }
        ];
    } else if (currentCountsFormat === 'english') {
        rowSpecifications = [
            { label: "KG (PP.3+)", medium: "English", queryClasses: ["KG EM"] },
            { label: "LKG(PP.4+)", medium: "English", queryClasses: ["LKG EM"] },
            { label: "UKG(PP.5+)", medium: "English", queryClasses: ["UKG EM"] },
            { label: "1ST", medium: "English", queryClasses: ["1ST EM"] },
            { label: "2ND", medium: "English", queryClasses: ["2ND EM"] },
            { label: "3RD", medium: "English", queryClasses: ["3RD EM"] },
            { label: "4TH", medium: "English", queryClasses: ["4TH EM"] },
            { label: "5TH", medium: "English", queryClasses: ["5TH EM"] },
            { label: "6TH", medium: "English", queryClasses: ["6TH A EM"] },
            { label: "7TH", medium: "English", queryClasses: ["7TH A EM"] },
            { label: "8TH", medium: "English", queryClasses: ["8TH A EM"] },
            { label: "9TH", medium: "English", queryClasses: ["9TH A EM"] },
            { label: "10TH", medium: "English", queryClasses: ["10TH A EM"] },
            { label: "11TH SCI", medium: "English", queryClasses: ["11TH SCI EM"] },
            { label: "12TH ARTS", medium: "English", queryClasses: ["12TH ARTS EM"] },
            { label: "12TH SCI", medium: "English", queryClasses: ["12TH SCI EM"] }
        ];
    } else if (currentCountsFormat === 'consolidated') {
        rowSpecifications = [
            { label: "PRE-PRIMARY", medium: "Combined", queryClasses: ["KG EM", "LKG EM", "UKG EM"] },
            { label: "1ST", medium: "Combined", queryClasses: ["1ST", "1ST EM"] },
            { label: "2ND", medium: "Combined", queryClasses: ["2ND", "2ND EM"] },
            { label: "3RD", medium: "Combined", queryClasses: ["3RD", "3RD EM"] },
            { label: "4TH", medium: "Combined", queryClasses: ["4TH", "4TH EM"] },
            { label: "5TH", medium: "Combined", queryClasses: ["5TH", "5TH EM"] },
            { label: "6TH", medium: "Combined", queryClasses: ["6TH A", "6TH B", "6TH A EM"] },
            { label: "7TH", medium: "Combined", queryClasses: ["7TH A", "7TH B", "7TH A EM"] },
            { label: "8TH", medium: "Combined", queryClasses: ["8TH A", "8TH B", "8TH A EM"] },
            { label: "9TH", medium: "Combined", queryClasses: ["9TH A", "9TH B", "9TH A EM"] },
            { label: "10TH", medium: "Combined", queryClasses: ["10TH A", "10TH B", "10TH C", "10TH A EM"] },
            { label: "11TH", medium: "Combined", queryClasses: ["11TH ARTS", "11TH AGR", "11TH SCI", "11TH SCI EM"] },
            { label: "12TH", medium: "Combined", queryClasses: ["12TH ARTS", "12TH AGR", "12TH SCI", "12TH SCI EM"] }
        ];
    }
    
    const globalTotals = {
        GENERAL: { boys: 0, girls: 0 },
        OBC: { boys: 0, girls: 0 },
        SC: { boys: 0, girls: 0 },
        ST: { boys: 0, girls: 0 },
        SBC: { boys: 0, girls: 0 },
        GRAND: { boys: 0, girls: 0 }
    };
    
    rowSpecifications.forEach(rowSpec => {
        const rowStudents = getStudentCountsForClasses(rowSpec.queryClasses);
        const tr = document.createElement('tr');
        
        // Wrap class name in first column inside a clickable link that opens that class student list directory
        // For consolidated format, we map to the base grade representation
        let selectParam = rowSpec.label;
        if (currentCountsFormat === 'consolidated') {
            // Map PRE-PRIMARY -> KG EM, 11TH -> 11TH ARTS, 12TH -> 12TH ARTS, otherwise maps directly
            if (rowSpec.label === 'PRE-PRIMARY') selectParam = 'KG EM';
            else if (rowSpec.label === '11TH') selectParam = '11TH ARTS';
            else if (rowSpec.label === '12TH') selectParam = '12TH ARTS';
        } else if (currentCountsFormat === 'english') {
            // Map displaying label back to query class
            selectParam = rowSpec.queryClasses[0];
        }
        
        let rowHtml = `
            <td style="font-weight: 600;">
                <a href="#" onclick="selectClassSearchResult('${selectParam}'); return false;" class="class-link">${rowSpec.label}</a>
            </td>
            <td style="text-align: center;">${rowSpec.medium}</td>
        `;
        
        let rowGrandBoys = 0;
        let rowGrandGirls = 0;
        
        categories.forEach(cat => {
            const catStudents = rowStudents.filter(s => s.social_category.toUpperCase() === cat);
            const boys = catStudents.filter(s => s.gender === 'Male').length;
            const girls = catStudents.filter(s => s.gender === 'Female').length;
            const total = boys + girls;
            
            rowGrandBoys += boys;
            rowGrandGirls += girls;
            
            globalTotals[cat].boys += boys;
            globalTotals[cat].girls += girls;
            
            rowHtml += `
                <td style="text-align: center;">${boys || '-'}</td>
                <td style="text-align: center;">${girls || '-'}</td>
                <td style="text-align: center; font-weight: 600; background-color: var(--slate-50);">${total || '-'}</td>
            `;
        });
        
        globalTotals.GRAND.boys += rowGrandBoys;
        globalTotals.GRAND.girls += rowGrandGirls;
        
        const rowGrandTotal = rowGrandBoys + rowGrandGirls;
        
        rowHtml += `
            <td style="text-align: center; font-weight: 600; background-color: var(--slate-100);">${rowGrandBoys || '-'}</td>
            <td style="text-align: center; font-weight: 600; background-color: var(--slate-100);">${rowGrandGirls || '-'}</td>
            <td style="text-align: center; font-weight: 800; background-color: var(--slate-200); color: var(--primary-dark);">${rowGrandTotal || '-'}</td>
        `;
        
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
    
    const totalTr = document.createElement('tr');
    totalTr.style.borderTop = '2px solid var(--slate-900)';
    totalTr.style.borderBottom = '2px solid var(--slate-900)';
    totalTr.style.backgroundColor = '#f1f5f9';
    totalTr.style.fontWeight = '800';
    
    let totalRowHtml = `
        <td colspan="2" style="text-align: center; font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px;">TOTAL</td>
    `;
    
    categories.forEach(cat => {
        const boys = globalTotals[cat].boys;
        const girls = globalTotals[cat].girls;
        const total = boys + girls;
        
        totalRowHtml += `
            <td style="text-align: center; color: var(--slate-900);">${boys}</td>
            <td style="text-align: center; color: var(--slate-900);">${girls}</td>
            <td style="text-align: center; font-weight: 900; background-color: #cbd5e1; color: black;">${total}</td>
        `;
    });
    
    const grandBoys = globalTotals.GRAND.boys;
    const grandGirls = globalTotals.GRAND.girls;
    const grandTotalVal = grandBoys + grandGirls;
    
    totalRowHtml += `
        <td style="text-align: center; background-color: #cbd5e1; color: black;">${grandBoys}</td>
        <td style="text-align: center; background-color: #cbd5e1; color: black;">${grandGirls}</td>
        <td style="text-align: center; font-size: 0.95rem; background-color: #94a3b8; color: white;">${grandTotalVal}</td>
    `;
    
    totalTr.innerHTML = totalRowHtml;
    tbody.appendChild(totalTr);
}

// Open Student Details Profile Modal (handles Active & TC students)
function viewStudentDetails(srNo, isActive = true) {
    let student = null;
    let isStudentActive = isActive;
    
    if (isStudentActive) {
        student = activeStudents.find(s => s.sr_no === srNo);
        if (!student) {
            student = tcStudents.find(s => s.sr_no === srNo);
            if (student) isStudentActive = false;
        }
    } else {
        student = tcStudents.find(s => s.sr_no === srNo);
        if (!student) {
            student = activeStudents.find(s => s.sr_no === srNo);
            if (student) isStudentActive = true;
        }
    }
    
    if (!student) return;
    
    const body = document.getElementById('student-modal-body');
    if (!body) return;
    
    if (isStudentActive) {
        const rollNo = student.roll_no || 'Not Assigned';
        const rbseRoll = student.rbse_roll_no || 'Not Assigned';
        const rte = student.rte || 'No';
        const category = student.social_category || '-';
        const religion = student.religion || '-';
        const admDate = student.date_of_admission || '-';
        
        body.innerHTML = `
            <div class="profile-summary-header">
                <div class="profile-avatar">
                    <i class="fa-solid fa-user-graduate"></i>
                </div>
                <div class="profile-header-meta">
                    <h4>${student.student_name}</h4>
                    <p>SR No. ${student.sr_no} | Class <a href="#" onclick="closeModal(); selectClassSearchResult('${student.class}'); return false;" class="class-link">${student.class}</a> (${student.medium} Medium)</p>
                    <span class="status-indicator-badge badge-active" style="margin-top: 4px; display: inline-block;">ACTIVE</span>
                </div>
            </div>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <span class="detail-label">Roll Number</span>
                    <span class="detail-val">${rollNo}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">RBSE Roll Number</span>
                    <span class="detail-val">${rbseRoll}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Father's Name</span>
                    <span class="detail-val">${student.father_name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Mother's Name</span>
                    <span class="detail-val">${student.mother_name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date of Birth</span>
                    <span class="detail-val">${student.dob}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Gender</span>
                    <span class="detail-val">${student.gender}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Social Category</span>
                    <span class="detail-val">${category}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Religion</span>
                    <span class="detail-val">${religion}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Admission Date</span>
                    <span class="detail-val">${admDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">RTE Category</span>
                    <span class="detail-val">${rte}</span>
                </div>
                <div class="detail-item detail-span-full">
                    <span class="detail-label">Student ID (NIC)</span>
                    <span class="detail-val">${student.student_nic_id}</span>
                </div>
                ${student.is_highlighted ? `
                <div class="detail-item detail-span-full" style="background-color: var(--amber-50); border: 1px solid var(--amber-100); border-radius: var(--radius-sm); padding: 8px 12px; margin-top: 8px;">
                    <span class="detail-label" style="color: #b45309; font-weight: 700;">Update Log</span>
                    <span class="detail-val" style="color: #92400e; font-size: 0.85rem;"><i class="fa-solid fa-clock-rotate-left"></i> Record was updated in the database on 30-06-2026.</span>
                </div>` : ''}
            </div>
        `;
    } else {
        const exitType = student.exit_type || 'T.C. Issued';
        const reason = student.exit_type_reason || 'Left School';
        const exitDate = student.exit_date || '-';
        const dob = student.dob || '-';
        const nic = student.student_nic_id || '-';
        
        body.innerHTML = `
            <div class="profile-summary-header" style="border-bottom-color: var(--amber-100);">
                <div class="profile-avatar" style="background-color: var(--amber-50); color: var(--amber-500);">
                    <i class="fa-solid fa-user-xmark"></i>
                </div>
                <div class="profile-header-meta">
                    <h4>${student.student_name}</h4>
                    <p>SR No. ${student.sr_no} | Class ${student.class || 'N/A'}</p>
                    <span class="status-indicator-badge badge-tc" style="margin-top: 4px; display: inline-block;">TC ISSUED</span>
                </div>
            </div>
            <div class="profile-details-grid">
                <div class="detail-item">
                    <span class="detail-label">Father's Name</span>
                    <span class="detail-val">${student.father_name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Mother's Name</span>
                    <span class="detail-val">${student.mother_name || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date of Birth</span>
                    <span class="detail-val">${dob}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Gender</span>
                    <span class="detail-val">${student.gender || '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Student ID (NIC)</span>
                    <span class="detail-val">${nic}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Exit Date</span>
                    <span class="detail-val" style="color: var(--rose-500); font-weight: 700;">${exitDate}</span>
                </div>
                <div class="detail-item detail-span-full" style="background-color: var(--amber-50); border: 1px solid var(--amber-100); border-radius: var(--radius-sm); padding: 12px; margin-top: 8px;">
                    <div style="display: flex; gap: 10px;">
                        <i class="fa-solid fa-circle-exclamation" style="color: var(--amber-500); font-size: 1.1rem; margin-top: 2px;"></i>
                        <div>
                            <span class="detail-label" style="color: #b45309; font-weight: 700; margin-bottom: 2px;">Exit Details</span>
                            <span class="detail-val" style="color: #92400e; font-size: 0.88rem; display: block;">
                                <strong>Type:</strong> ${exitType}<br>
                                <strong>Reason:</strong> ${reason}
                            </span>
                        </div>
                    </div>
                </div>
                ${student.is_highlighted ? `
                <div class="detail-item detail-span-full" style="background-color: var(--amber-50); border: 1px solid var(--amber-100); border-radius: var(--radius-sm); padding: 8px 12px;">
                    <span class="detail-label" style="color: #b45309; font-weight: 700;">Update Log</span>
                    <span class="detail-val" style="color: #92400e; font-size: 0.85rem;"><i class="fa-solid fa-clock-rotate-left"></i> Record was updated in the database on 30-06-2026.</span>
                </div>` : ''}
            </div>
        `;
    }
    
    document.getElementById('student-modal').classList.add('active');
}

// Close Modal
function closeModal() {
    document.getElementById('student-modal').classList.remove('active');
}

// Print Handler
function printReport() {
    window.print();
}

// Check if a class is primary (KG/Nursery EM or 1st-5th grade)
function isPrimaryClass(className) {
    const name = className.toUpperCase();
    if (name.includes("KG") || name.includes("NURSERY")) return true;
    if (name.startsWith("1ST") || name.startsWith("2ND") || name.startsWith("3RD") || name.startsWith("4TH") || name.startsWith("5TH")) return true;
    return false;
}

// Check if a class is senior (6th to 12th grade)
function isSeniorClass(className) {
    const name = className.toUpperCase();
    if (name.startsWith("6TH") || name.startsWith("7TH") || name.startsWith("8TH") || name.startsWith("9TH") || name.startsWith("10TH") || name.startsWith("11TH") || name.startsWith("12TH")) return true;
    return false;
}

// Filter pending students by medium
function setPendingMediumFilter(medium) {
    pendingMediumFilter = medium;
    
    document.querySelectorAll('#pending-medium-filters .segment-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-medium') === medium) {
            btn.classList.add('active');
        }
    });
    
    renderPendingTables();
}

// Filter pending students by grade level
function setPendingLevelFilter(level) {
    pendingLevelFilter = level;
    
    document.querySelectorAll('#pending-level-filters .segment-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-level') === level) {
            btn.classList.add('active');
        }
    });
    
    renderPendingTables();
}

function renderPendingTables() {
    const container = document.getElementById('pending-tables-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Apply local filters
    let list = pendingStudents;
    
    if (pendingMediumFilter !== 'all') {
        list = list.filter(s => s.medium === pendingMediumFilter);
    }
    
    if (pendingLevelFilter === 'primary') {
        list = list.filter(s => isPrimaryClass(s.class));
    } else if (pendingLevelFilter === 'senior') {
        list = list.filter(s => isSeniorClass(s.class));
    }
    
    // Set dynamic total count badge inside the filter summary row
    const totalBadge = document.getElementById('pending-total-badge');
    if (totalBadge) totalBadge.innerText = list.length.toLocaleString();
    
    if (list.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px; color: var(--slate-700);">
                <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--slate-300); display: block;"></i>
                No pending admission records found matching the selected filters.
            </div>
        `;
        return;
    }
    
    // Group filtered students by class name
    const groups = {};
    list.forEach(s => {
        if (!groups[s.class]) groups[s.class] = [];
        groups[s.class].push(s);
    });
    
    // Sort class list using standard sorting order
    const sortedClasses = Object.keys(groups).sort((a, b) => {
        const idxA = CLASS_SORT_ORDER.indexOf(a);
        const idxB = CLASS_SORT_ORDER.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
    
    // Create class-wise cards
    sortedClasses.forEach(className => {
        const classStudents = groups[className];
        classStudents.sort((a, b) => a.student_name.localeCompare(b.student_name));
        
        const card = document.createElement('div');
        card.classList.add('card');
        card.style.marginBottom = '28px';
        
        // Print letterhead logo and title
        const headerHtml = `
            <div class="school-official-header print-only">
                <div class="letterhead-brand-row">
                    <img src="SSVM%20Hindi%20Logo%20500x..jpg" alt="SSVM Logo" class="letterhead-logo-img">
                    <div class="letterhead-text-block">
                        <h2 class="school-title-hindi">श्री सरस्वती उच्च माध्यमिक विद्या मंदिर मंडली, कल्याणपुर</h2>
                        <p class="school-details">VP : Mandli, Block : Kalyanpur, Dist : Balotra (RAJ) - 344026</p>
                        <p class="school-contact">Mob : 9413030806, E-mail : ssvmorg@gmail.com</p>
                    </div>
                </div>
                <div class="header-divider-row">
                    <span>Session : 2026-27</span>
                    <span class="report-tag">Pending Admission List</span>
                </div>
            </div>
        `;
        
        // Coordinator Note printed on top of the list
        const noteHtml = `
            <div class="coordinator-print-note" style="margin-bottom: 14px; font-size: 0.85rem; font-weight: 700; color: #92400e; padding: 6px 12px; border-left: 3px solid var(--amber-500); background-color: var(--amber-50);">
                Note to Coordinator: Please complete documentations and admission process for the students listed below.
            </div>
        `;
        
        const tableHeader = `
            <div class="directory-header" style="margin-bottom: 12px;">
                <div class="results-meta" style="font-size: 1.1rem; font-weight: 700; color: var(--slate-900);">
                    <i class="fa-solid fa-graduation-cap" style="color: var(--primary); margin-right: 6px;"></i>Class: ${className} (${classStudents[0].medium} Medium)
                </div>
                <div class="results-meta no-print">
                    Total Pending: <strong>${classStudents.length}</strong>
                </div>
            </div>
        `;
        
        let rowsHtml = '';
        classStudents.forEach((student, index) => {
            const sNo = index + 1;
            const mobile = student.mobile_no || 'N/A';
            const mother = student.mother_name || '-';
            
            // Render SR/Scholar No as clickable detail if available
            const srDisplay = student.sr_no ? `
                <a href="#" onclick="viewStudentDetails('${student.sr_no}', true); return false;" class="sr-link">${student.sr_no}</a>
            ` : '-';
            
            rowsHtml += `
                <tr>
                    <td style="text-align: center;"><strong>${sNo}</strong></td>
                    <td style="text-align: center;">${srDisplay}</td>
                    <td>${student.student_name}</td>
                    <td>${student.father_name}</td>
                    <td>${mother}</td>
                    <td style="text-align: center;">${mobile}</td>
                    <td style="text-align: center; color: var(--amber-500); font-weight: 700;">Pending Verification</td>
                </tr>
            `;
        });
        
        const tableHtml = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px; text-align: center;">S.No</th>
                            <th style="width: 120px; text-align: center;">Scholar No / SR</th>
                            <th>Student Name</th>
                            <th>Father Name</th>
                            <th>Mother Name</th>
                            <th style="width: 140px; text-align: center;">Mobile No</th>
                            <th style="width: 160px; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
        
        const footerHtml = `
            <div class="report-footer print-only" style="margin-top: 28px; margin-bottom: 8px;">
                <div class="report-signature">
                    <div class="signature-line"></div>
                    <span>Coordinator Signature</span>
                </div>
                <div class="report-signature">
                    <div class="signature-line"></div>
                    <span>Principal Signature</span>
                </div>
            </div>
        `;
        
        card.innerHTML = headerHtml + noteHtml + tableHeader + tableHtml + footerHtml;
        container.appendChild(card);
    });
}
