# Shri Saraswati Vidhya Mandir Mandli - Student Portal

A modern, fast, and responsive web portal to search and view student directories and TC reports for **Shri Saraswati Vidhya Mandir Mandli**. Optimized for hosting on **GitHub Pages**.

---

## Features

1. **Mandatory Class Selection**: Student lists and TC reports are hidden by default to prevent loading unnecessary data. The teacher must choose a class first to load and view the directory.
2. **Two Core Views (Side Tabs)**:
   - **Student Directory**: Shows active students in the selected class. Includes columns: `S.No`, `SR No`, `Student Name`, `Father Name`, `Mother Name`, `DOB`, `Gender`, `Category`, `Date of Admission`, `RTE`, and `Roll No` (placed near the end).
   - **TC Report**: Shows students who took a Transfer Certificate (TC). The application maps classes (like `10TH A EM`) to school grades (like `Tenth`) to fetch corresponding TC exit records.
3. **Roll Numbers & SR Numbers Cleaned**: Any decimal fractions (like `.0`) introduced from Excel are completely removed.
4. **Subject Fields Removed**: `Math/Bio` and `Additional Subject` fields are removed as requested.
5. **Update Highlights**: Entries updated on **30-06-2026** (e.g., VINITHA, ASHOK) are automatically highlighted in a soft amber color with custom badges.
6. **Data Privacy**: Mobile numbers (`ERP Mobile No`) are completely excluded from both the code and the exported database.
7. **Premium Design**: Built using Google Fonts (Outfit & Inter), professional print layouts, and smooth hover effects. Opening `index.html` runs locally without CORS restrictions.

---

## Files Generated

- [index.html](file:///d:/Rolllist/index.html): Main layout, side navigation, class dropdowns, search bar, tables, and modal overlay.
- [style.css](file:///d:/Rolllist/style.css): Custom CSS variables, responsive design, highlight animation, and print styles.
- [app.js](file:///d:/Rolllist/app.js): Controller script managing class state, filter logic, table renders, dynamic serial numbers (`S.No`), and modal popups.
- [data.js](file:///d:/Rolllist/data.js): Securely extracted data containing 1,579 active students and 124 TC records (all sorted).

---

## How to Host on GitHub Pages

Follow these simple steps to publish this portal online:

### Step 1: Initialize Git and Commit Files
Open a command line/terminal in the `d:\Rolllist` folder and run:
```bash
# Initialize local Git repository
git init -b main

# Add website files
git add index.html style.css app.js data.js README.md

# Commit the files
git commit -m "Configure Shri Saraswati Vidhya Mandir Mandli portal"
```

### Step 2: Push to GitHub
Create a new **Public** repository on [GitHub](https://github.com/new) (e.g. `ssvm-mandli-portal`), then push the code:
```bash
# Link local repo to GitHub (replace with your repository's URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push code
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on the GitHub website.
2. Click on the **Settings** tab.
3. Click on **Pages** in the left sidebar.
4. Under **Build and deployment**, set the branch to `main` and the folder to `/ (root)`.
5. Click **Save**.

Your portal will be live at `https://your-username.github.io/your-repository-name/` within a minute!
