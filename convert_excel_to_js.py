import pandas as pd
import json
import os

excel_path = r"Roll No List.xlsx"
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

try:
    if not os.path.exists(excel_path):
        print(f"Error: Excel file '{excel_path}' not found in the current directory.")
        exit(1)
        
    xl = pd.ExcelFile(excel_path)
    main_df = xl.parse('MAIN')
    tc_df = xl.parse('tcreport01072026')
    
    # Clean columns and handle NaN
    main_df.columns = main_df.columns.str.strip()
    tc_df.columns = tc_df.columns.str.strip()
    
    main_df = main_df.fillna("")
    tc_df = tc_df.fillna("")
    
    # Extract and format active students (MAIN)
    active_students = []
    active_by_sr = {}
    
    for _, row in main_df.iterrows():
        student_name = str(row.get('STUDENT NAME', '')).strip()
        if not student_name or student_name == "nan":
            continue
            
        father_name = str(row.get('FATHER NAME', '')).strip()
        mother_name = str(row.get('MOTHER NAME', '')).strip()
        
        # Handle dates
        dob = row.get('DOB', '')
        if isinstance(dob, pd.Timestamp):
            dob_str = dob.strftime('%d-%m-%Y')
        else:
            dob_str = str(dob).split(" ")[0] if dob else ""
            
        adm_date = row.get('Date of Admission', '')
        is_highlighted = False
        if isinstance(adm_date, pd.Timestamp):
            adm_date_str = adm_date.strftime('%d-%m-%Y')
            if adm_date.strftime('%Y-%m-%d') == '2026-06-30' or adm_date.strftime('%d-%m-%Y') == '30-06-2026':
                is_highlighted = True
        else:
            adm_date_str = str(adm_date).split(" ")[0] if adm_date else ""
            if "2026-06-30" in adm_date_str or "30-06-2026" in adm_date_str:
                is_highlighted = True
        
        # Clean numeric fields to prevent decimals
        sr_no = clean_int_str(row.get('SR No.', ''))
        roll_no = clean_int_str(row.get('ROLL NO', ''))
        rbse_roll = clean_int_str(row.get('RBSE Roll No', ''))
        student_nic = clean_int_str(row.get('Student NIC ID', ''))
        mobile_no = clean_int_str(row.get('ERP Mobile No', ''))
        
        student_rec = {
            "sr_no": sr_no,
            "student_nic_id": student_nic,
            "medium": str(row.get('Medium', '')).strip(),
            "class": str(row.get('Class', '')).strip(),
            "roll_no": roll_no,
            "rbse_roll_no": rbse_roll,
            "student_name": student_name,
            "father_name": father_name,
            "mother_name": mother_name,
            "dob": dob_str,
            "gender": str(row.get('Gender', '')).strip(),
            "social_category": str(row.get('Social Category', '')).strip(),
            "religion": str(row.get('Religion', '')).strip(),
            "date_of_admission": adm_date_str,
            "rte": str(row.get('RTE', '')).strip(),
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
    
    # Extract and format TC students (tcreport01072026)
    tc_students = []
    for _, row in tc_df.iterrows():
        student_name = str(row.get('Student Name', '')).strip()
        if not student_name or student_name == "nan":
            continue
            
        father_name = str(row.get('Father Name', '')).strip()
        
        dob = row.get('DOB', '')
        if isinstance(dob, pd.Timestamp):
            dob_str = dob.strftime('%d-%m-%Y')
        else:
            dob_str = str(dob).split(" ")[0] if dob else ""
            
        exit_date = row.get('Exit Date', '')
        is_highlighted = False
        if isinstance(exit_date, pd.Timestamp):
            exit_date_str = exit_date.strftime('%d-%m-%Y')
            if exit_date.strftime('%Y-%m-%d') == '2026-06-30' or exit_date.strftime('%d-%m-%Y') == '30-06-2026':
                is_highlighted = True
        else:
            exit_date_str = str(exit_date).split(" ")[0] if exit_date else ""
            if "2026-06-30" in exit_date_str or "30-06-2026" in exit_date_str:
                is_highlighted = True
                
        tc_sr = clean_int_str(row.get('SR NO', ''))
        tc_nic = clean_int_str(row.get('Nic Student ID', ''))
        
        tc_rec = {
            "sr_no": tc_sr,
            "student_nic_id": tc_nic,
            "class": str(row.get('Class', '')).strip(),
            "student_name": student_name,
            "father_name": father_name,
            "dob": dob_str,
            "exit_type": str(row.get('Exit Type', '')).strip(),
            "exit_type_reason": str(row.get('Exit Type Reason', '')).strip(),
            "exit_date": exit_date_str,
            "is_highlighted": is_highlighted
        }
        
        for k, v in list(tc_rec.items()):
            if v == "nan" or v == "NaN" or v == "NaT":
                tc_rec[k] = ""
                
        tc_students.append(tc_rec)
        
    # Sort TC students by Student Name, Father Name
    tc_students.sort(key=lambda x: (x['student_name'].upper(), x['father_name'].upper()))
    
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
        "due_fees": due_fees
    }
    
    # Write to data.js
    with open(js_output_path, "w", encoding="utf-8") as f:
        f.write("// Data exported from Roll No List.xlsx\n")
        f.write("window.STUDENTS_DATA = ")
        json.dump(data, f, indent=4, ensure_ascii=False)
        f.write(";\n")
        
    print(f"Data export successful. Saved to {js_output_path}.")
    print(f"Exported {len(active_students)} active students, {len(tc_students)} TC students, and {len(due_fees)} fee records.")
    
except Exception as e:
    print("Error during data export:", e)
