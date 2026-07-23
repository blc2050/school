import pandas as pd
import json
import os

excel_path = r"RollList.xlsx" if os.path.exists("RollList.xlsx") else r"Roll No List.xlsx"
fee_excel_path = r"duefeereport.xlsx"
js_output_path = r"data.js"

def clean_int_str(val):
    if pd.isna(val) or val == "":
        return ""
    try:
        f_val = float(val)
        if f_val.is_integer():
            return str(int(f_val))
        return str(f_val)
    except ValueError:
        return str(val).strip()

def parse_fee_val(val):
    if pd.isna(val) or val == "":
        return 0
    try:
        return int(float(val))
    except ValueError:
        return 0

def get_case_insensitive(row, key, default=""):
    for k in row.index:
        if str(k).strip().lower() == key.lower():
            return row[k]
    return default

try:
    if not os.path.exists(excel_path):
        print(f"Error: Excel file '{excel_path}' not found in the current directory.")
        exit(1)
        
    xl = pd.ExcelFile(excel_path)
    
    # Dynamically find sheet names
    main_sheet = 'Active Students 2026-27' if 'Active Students 2026-27' in xl.sheet_names else 'MAIN'
    tc_sheet = 'TC Issued' if 'TC Issued' in xl.sheet_names else ('tcreport01072026' if 'tcreport01072026' in xl.sheet_names else xl.sheet_names[1])
    pending_sheet = 'Temp Admission In ERP' if 'Temp Admission In ERP' in xl.sheet_names else ('pendigadmission' if 'pendigadmission' in xl.sheet_names else xl.sheet_names[2])
    
    print(f"Loading sheets: Active='{main_sheet}', TC='{tc_sheet}', Pending='{pending_sheet}'")
    
    main_df = xl.parse(main_sheet)
    tc_df = xl.parse(tc_sheet)
    
    # Check for title row in pending sheet
    pending_test_df = xl.parse(pending_sheet)
    if pending_test_df.columns.shape[0] > 0 and any('TEMPORARY' in str(col).upper() or 'LIST' in str(col).upper() for col in pending_test_df.columns):
        pending_df = xl.parse(pending_sheet, header=1)
    else:
        pending_df = pending_test_df
        
    # Clean columns and handle NaN
    main_df.columns = main_df.columns.str.strip()
    tc_df.columns = tc_df.columns.str.strip()
    pending_df.columns = pending_df.columns.str.strip()
    
    main_df = main_df.fillna("")
    tc_df = tc_df.fillna("")
    pending_df = pending_df.fillna("")
    
    # Extract and format active students (MAIN / Active Students)
    active_students = []
    active_by_sr = {}
    
    for _, row in main_df.iterrows():
        student_name = str(get_case_insensitive(row, 'STUDENT NAME')).strip()
        if not student_name or student_name == "nan":
            continue
            
        father_name = str(get_case_insensitive(row, 'FATHER NAME')).strip()
        mother_name = str(get_case_insensitive(row, 'MOTHER NAME')).strip()
        
        # Handle dates
        dob = get_case_insensitive(row, 'DOB')
        if isinstance(dob, pd.Timestamp):
            dob_str = dob.strftime('%d-%m-%Y')
        else:
            dob_str = str(dob).split(" ")[0] if dob else ""
            
        adm_date = get_case_insensitive(row, 'Date of Admission')
        is_highlighted = False
        if isinstance(adm_date, pd.Timestamp):
            adm_date_str = adm_date.strftime('%d-%m-%Y')
            if adm_date.strftime('%Y-%m-%d') == '2026-07-23' or adm_date.strftime('%d-%m-%Y') == '23-07-2026':
                is_highlighted = True
        else:
            adm_date_str = str(adm_date).split(" ")[0] if adm_date else ""
            if "2026-07-23" in adm_date_str or "23-07-2026" in adm_date_str:
                is_highlighted = True
        
        # Clean numeric fields to prevent decimals
        sr_no = clean_int_str(get_case_insensitive(row, 'SR No.'))
        roll_no = clean_int_str(get_case_insensitive(row, 'ROLL NO'))
        rbse_roll = clean_int_str(get_case_insensitive(row, 'RBSE Roll No'))
        student_nic = clean_int_str(get_case_insensitive(row, 'Student NIC ID'))
        mobile_no = clean_int_str(get_case_insensitive(row, 'ERP Mobile No'))
        
        student_rec = {
            "sr_no": sr_no,
            "student_nic_id": student_nic,
            "medium": str(get_case_insensitive(row, 'Medium')).strip(),
            "class": str(get_case_insensitive(row, 'Class')).strip(),
            "roll_no": roll_no,
            "rbse_roll_no": rbse_roll,
            "student_name": student_name,
            "father_name": father_name,
            "mother_name": mother_name,
            "dob": dob_str,
            "gender": str(get_case_insensitive(row, 'Gender')).strip(),
            "social_category": str(get_case_insensitive(row, 'Social Category')).strip(),
            "religion": str(get_case_insensitive(row, 'Religion')).strip(),
            "date_of_admission": adm_date_str,
            "rte": str(get_case_insensitive(row, 'RTE')).strip(),
            "mobile_no": mobile_no,
            "is_highlighted": is_highlighted
        }
        
        # Clean 'nan' strings
        for k, v in list(student_rec.items()):
            if v == "nan" or v == "NaN" or v == "NaT":
                student_rec[k] = ""
        
        active_students.append(student_rec)
        if sr_no:
            active_by_sr[sr_no] = student_rec
        
    # Sort active students by Student Name, Father Name
    active_students.sort(key=lambda x: (x['student_name'].upper(), x['father_name'].upper()))
    
    # Extract and format TC students (TC Issued / tcreport01072026)
    tc_students = []
    for _, row in tc_df.iterrows():
        student_name = str(get_case_insensitive(row, 'Student Name')).strip()
        if not student_name or student_name == "nan":
            continue
            
        father_name = str(get_case_insensitive(row, 'Father Name')).strip()
        
        dob = get_case_insensitive(row, 'DOB')
        if isinstance(dob, pd.Timestamp):
            dob_str = dob.strftime('%d-%m-%Y')
        else:
            dob_str = str(dob).split(" ")[0] if dob else ""
            
        exit_date = get_case_insensitive(row, 'Exit Date')
        is_highlighted = False
        if isinstance(exit_date, pd.Timestamp):
            exit_date_str = exit_date.strftime('%d-%m-%Y')
            if exit_date.strftime('%Y-%m-%d') == '2026-07-23' or exit_date.strftime('%d-%m-%Y') == '23-07-2026':
                is_highlighted = True
        else:
            exit_date_str = str(exit_date).split(" ")[0] if exit_date else ""
            if "2026-07-23" in exit_date_str or "23-07-2026" in exit_date_str:
                is_highlighted = True
                
        tc_sr = clean_int_str(get_case_insensitive(row, 'SR NO'))
        tc_nic = clean_int_str(get_case_insensitive(row, 'Nic Student ID'))
        
        tc_rec = {
            "sr_no": tc_sr,
            "student_nic_id": tc_nic,
            "class": str(get_case_insensitive(row, 'Class')).strip(),
            "student_name": student_name,
            "father_name": father_name,
            "dob": dob_str,
            "exit_type": str(get_case_insensitive(row, 'Exit Type')).strip(),
            "exit_type_reason": str(get_case_insensitive(row, 'Exit Type Reason')).strip(),
            "exit_date": exit_date_str,
            "is_highlighted": is_highlighted
        }
        
        for k, v in list(tc_rec.items()):
            if v == "nan" or v == "NaN" or v == "NaT":
                tc_rec[k] = ""
                
        tc_students.append(tc_rec)
        
    # Sort TC students by Student Name, Father Name
    tc_students.sort(key=lambda x: (x['student_name'].upper(), x['father_name'].upper()))
    
    # Process Pending Admission Students (Temp Admission In ERP / pendigadmission)
    pending_students = []
    for _, row in pending_df.iterrows():
        student_name = str(get_case_insensitive(row, 'Student Name')).strip()
        if not student_name or student_name == "nan":
            continue
            
        father_name = str(get_case_insensitive(row, 'Father Name')).strip()
        mother_name = str(get_case_insensitive(row, 'Mother Name')).strip()
        sr_no = clean_int_str(get_case_insensitive(row, 'Temp SR No')) or clean_int_str(get_case_insensitive(row, 'Scholar No.'))
        class_name = str(get_case_insensitive(row, 'Current Class')) or str(get_case_insensitive(row, 'Class'))
        medium = str(get_case_insensitive(row, 'Medium')) or str(get_case_insensitive(row, 'Med'))
        mobile_no = clean_int_str(get_case_insensitive(row, 'Mobile No'))
        
        pending_rec = {
            "sr_no": sr_no,
            "student_name": student_name,
            "father_name": father_name,
            "mother_name": mother_name,
            "class": class_name,
            "medium": medium,
            "mobile_no": mobile_no,
            "status_remark": str(get_case_insensitive(row, 'Remark')) or str(get_case_insensitive(row, 'Remarks')) or str(get_case_insensitive(row, 'Status')) or str(get_case_insensitive(row, 'Status Remark'))
        }
        
        for k, v in list(pending_rec.items()):
            if v == "nan" or v == "NaN" or v == "NaT":
                pending_rec[k] = ""
                
        pending_students.append(pending_rec)
        
    # Sort pending students by Class, Student Name
    pending_students.sort(key=lambda x: (x['class'].upper(), x['student_name'].upper()))
    
    # Process Fee Data from duefeereport.xlsx
    due_fees = {}
    ignored_fee_count = 0
    
    if os.path.exists(fee_excel_path):
        fee_xl = pd.ExcelFile(fee_excel_path)
        print(f"Reading fee sheets: {fee_xl.sheet_names}")
        
        for sheet_name in fee_xl.sheet_names:
            fee_df = fee_xl.parse(sheet_name)
            fee_df.columns = fee_df.columns.str.strip()
            
            for _, row in fee_df.iterrows():
                scholar_no = clean_int_str(row.get('Scholar No', ''))
                if not scholar_no:
                    continue
                
                # IGNORE fee records where SR number is not in active students (MAIN sheet)
                if scholar_no not in active_by_sr:
                    ignored_fee_count += 1
                    continue
                
                # Retrieve mobile number from corresponding active student record
                mobile_no = active_by_sr[scholar_no].get("mobile_no", "")
                
                # Fetch hostel fee based on column names (English vs Hindi sheet variations)
                hostel_1 = row.get('1ST INS HOSTEL FEE', row.get('1ST INS HOSTEL FEE EM', 0))
                hostel_2 = row.get('2ND INS HOSTEL FEE', row.get('2ND INS HOSTEL FEE EM', 0))
                
                fee_record = {
                    "scholar_no": scholar_no,
                    "student_name": str(row.get('Student Name', '')).strip(),
                    "father_name": str(row.get('Father Name', '')).strip(),
                    "class_name": str(row.get('Class Name', '')).strip(),
                    "admission_fee_1": parse_fee_val(row.get('1ST INS ADMISSION FEE', 0)),
                    "bus_fee_1": parse_fee_val(row.get('1ST INS BUS & TRANSPORT FEE', 0)),
                    "hostel_fee_1": parse_fee_val(hostel_1),
                    "school_fee_1": parse_fee_val(row.get('1ST INS SCHOOL FEE', 0)),
                    "prev_due": parse_fee_val(row.get('PREV YEAR DUE PREV YEAR DUE', 0)),
                    "bus_fee_2": parse_fee_val(row.get('2ND INS BUS & TRANSPORT FEE', 0)),
                    "hostel_fee_2": parse_fee_val(hostel_2),
                    "school_fee_2": parse_fee_val(row.get('2ND INS SCHOOL FEE', 0)),
                    "bus_fee_3": parse_fee_val(row.get('3RD INS BUS & TRANSPORT FEE', 0)),
                    "school_fee_3": parse_fee_val(row.get('3RD INS SCHOOL FEE', 0)),
                    "late_fee": parse_fee_val(row.get('Late Fee', 0)),
                    "advance_adjustable": parse_fee_val(row.get('Advance Adjustable', 0)),
                    "total": parse_fee_val(row.get('Total', 0)),
                    "mobile_no": mobile_no
                }
                
                # Clean up student name comparison or empty strings
                for k, v in list(fee_record.items()):
                    if v == "nan" or v == "NaN":
                        fee_record[k] = ""
                        
                due_fees[scholar_no] = fee_record
        print(f"Loaded {len(due_fees)} fee due records. Ignored {ignored_fee_count} records not present in active roster.")
    else:
        print(f"Warning: Fee report Excel file '{fee_excel_path}' not found. Skipping fee data loading.")

    # Generate meta mapping for classes
    classes_main = sorted(list(set([s['class'] for s in active_students if s['class']])))
    mediums = sorted(list(set([s['medium'] for s in active_students if s['medium']])))
    classes_tc = sorted(list(set([s['class'] for s in tc_students if s['class']])))
    
    class_by_medium = {}
    for med in mediums:
        class_by_medium[med] = sorted(list(set([s['class'] for s in active_students if s['medium'] == med])))
        
    data = {
        "active_students": active_students,
        "tc_students": tc_students,
        "classes_main": classes_main,
        "mediums": mediums,
        "classes_tc": classes_tc,
        "class_by_medium": class_by_medium,
        "due_fees": due_fees,
        "pending_students": pending_students
    }
    
    # Write to data.js
    with open(js_output_path, "w", encoding="utf-8") as f:
        f.write("// Data exported from Roll No List.xlsx\n")
        f.write("window.STUDENTS_DATA = ")
        json.dump(data, f, indent=4, ensure_ascii=False)
        f.write(";\n")
        
    print(f"Data export successful. Saved to {js_output_path}.")
    print(f"Exported {len(active_students)} active students, {len(tc_students)} TC students, {len(pending_students)} pending students, and {len(due_fees)} fee records.")
    
except Exception as e:
    print("Error during data export:", e)
