// EduPortal - Shri Saraswati Vidhya Mandir Mandli - Application Logic

// Global database variables
let activeStudents = [];
let tcStudents = [];
let classesMain = [];
let classesTc = [];
let mediums = [];
let classByMedium = {};

// Application states
let currentTab = 'directory'; // 'directory' or 'tc'
let currentMediumFilter = 'all';
let selectedClass = '';
let currentSearchQuery = '';

// Mapping class name (from MAIN) to grade name in TC Report
const CLASS_TO_GRADE_MAP = {
    // Tenth
    "10TH A EM": "Tenth\u00a0(2026-27)",
    "10TH A": "Tenth\u00a0(2026-27)",
    "10TH B": "Tenth\u00a0(2026-27)",
    "10TH C": "Tenth\u00a0(2026-27)",
    
    // Eleventh
    "11TH SCI EM": "Eleventh\u00a0(2026-27)",
    "11TH AGR": "Eleventh\u00a0(2026-27)",
    "11TH ARTS": "Eleventh\u00a0(2026-27)",
    "11TH SCI": "Eleventh\u00a0(2026-27)",
    
    // Twelfth
    "12TH ARTS EM": "Twelth\u00a0(2026-27)",
    "12TH SCI EM": "Twelth\u00a0(2026-27)",
    "12TH AGR": "Twelth\u00a0(2026-27)",
    "12TH ARTS": "Twelth\u00a0(2026-27)",
    "12TH SCI": "Twelth\u00a0(2026-27)",
    
    // First
    "1ST EM": "First\u00a0(2026-27)",
    "1ST": "First\u00a0(2026-27)",
    
    // Second
    "2ND EM": "Second\u00a0(2026-27)",
    "2ND": "Second\u00a0(2026-27)",
    
    // Third
    "3RD EM": "Third\u00a0(2026-27)",
    "3RD": "Third\u00a0(2026-27)",
    
    // Fourth
    "4TH EM": "Fourth\u00a0(2026-27)",
    "4TH": "Fourth\u00a0(2026-27)",
    
    // Fifth
    "5TH EM": "Fifth\u00a0(2026-27)",
    "5TH": "Fifth\u00a0(2026-27)",
    
    // Sixth
    "6TH A EM": "Sixth\u00a0(2026-27)",
    "6TH A": "Sixth\u00a0(2026-27)",
    "6TH B": "Sixth\u00a0(2026-27)",
    
    // Seventh
    "7TH A EM": "Seventh\u00a0(2026-27)",
    "7TH A": "Seventh\u00a0(2026-27)",
    "7TH B": "Seventh\u00a0(2026-27)",
    
    // Eighth
    "8TH A EM": "Eight\u00a0(2026-27)",
    "8TH A": "Eight\u00a0(2026-27)",
    "8TH B": "Eight\u00a0(2026-27)",
    
    // Ninth
    "9TH A EM": "Ninth\u00a0(2026-27)",
    "9TH A": "Ninth\u00a0(2026-27)",
    "9TH B": "Ninth\u00a0(2026-27)",
    
    // Pre-primary
    "KG EM": "PP.5+\u00a0(2026-27)",
    "UKG EM": "PP.5+\u00a0(2026-27)",
    "LKG EM": "PP.4+\u00a0(2026-27)"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    populateClassDropdown();
    updateUIState();
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
    } else {
        console.error("Database variables (data.js) not loaded.");
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
    
    // Reset search
    const searchInput = document.getElementById('directory-search');
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
        pageSubtitle.innerText = tabId === 'directory' ? 'Student Directory' : 'TC Report';
    }
    
    updateUIState();
}

// Handle Search Query input
function handleSearch() {
    const searchInput = document.getElementById('directory-search');
    currentSearchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (currentTab === 'directory') {
        renderDirectoryTable();
    } else {
        renderTCTable();
    }
}

// Update the visible elements based on selection state
function updateUIState() {
    const placeholder = document.getElementById('no-class-placeholder');
    const tabDir = document.getElementById('tab-directory');
    const tabTc = document.getElementById('tab-tc');
    const searchRow = document.getElementById('search-row');
    
    if (!selectedClass) {
        if (placeholder) placeholder.style.display = 'block';
        if (tabDir) tabDir.style.display = 'none';
        if (tabTc) tabTc.style.display = 'none';
        if (searchRow) searchRow.style.display = 'none';
    } else {
        if (placeholder) placeholder.style.display = 'none';
        if (searchRow) searchRow.style.display = 'flex';
        
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

// Render Directory Table (Active Students) with mobile data-labels
function renderDirectoryTable() {
    const tbody = document.getElementById('directory-tbody');
    const showingCount = document.getElementById('directory-showing-count');
    const selectedClassName = document.getElementById('selected-class-name');
    const highlightBadge = document.getElementById('directory-highlight-count');
    
    if (!tbody) return;
    
    if (selectedClassName) selectedClassName.innerText = selectedClass;
    
    let list = activeStudents.filter(s => s.class === selectedClass);
    
    if (currentSearchQuery) {
        list = list.filter(student => {
            const nameMatch = student.student_name.toLowerCase().includes(currentSearchQuery);
            const fatherMatch = student.father_name.toLowerCase().includes(currentSearchQuery);
            const srMatch = student.sr_no.toLowerCase().includes(currentSearchQuery);
            return nameMatch || fatherMatch || srMatch;
        });
    }
    
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
        
        tr.innerHTML = `
            <td data-label="S.No"><strong>${sNo}</strong></td>
            <td data-label="SR No">${student.sr_no}</td>
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
                <button class="btn-view" onclick="viewStudentDetails('${student.sr_no}')" title="View Profile">
                    <i class="fa-regular fa-id-card"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render TC Report Table with mobile data-labels
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
    
    if (currentSearchQuery) {
        list = list.filter(student => {
            const nameMatch = student.student_name.toLowerCase().includes(currentSearchQuery);
            const fatherMatch = student.father_name.toLowerCase().includes(currentSearchQuery);
            const srMatch = student.sr_no.toLowerCase().includes(currentSearchQuery);
            return nameMatch || fatherMatch || srMatch;
        });
    }
    
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
        
        tr.innerHTML = `
            <td data-label="S.No"><strong>${sNo}</strong></td>
            <td data-label="SR No">${student.sr_no}</td>
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

// Open Student Details Profile Modal
function viewStudentDetails(srNo) {
    const student = activeStudents.find(s => s.sr_no === srNo);
    if (!student) return;
    
    const body = document.getElementById('student-modal-body');
    if (!body) return;
    
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
                <p>SR No. ${student.sr_no} | Class ${student.class} (${student.medium} Medium)</p>
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
