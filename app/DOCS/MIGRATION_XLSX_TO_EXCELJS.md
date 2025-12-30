# Migration: xlsx → ExcelJS

**Date:** 2025-12-26
**Reason:** Security vulnerabilities (Prototype Pollution + ReDoS) in `xlsx` package

## Vulnerabilities Resolved

- **GHSA-4r6h-8v6p-xvw6**: Prototype Pollution in sheetJS
- **GHSA-5pgg-2g8v-p4x9**: SheetJS Regular Expression Denial of Service (ReDoS)
- **Severity:** HIGH
- **Status:** No fix available in xlsx package

## Solution

Replaced `xlsx@0.18.5` with `exceljs@4.4.0` - a modern, actively maintained library with zero known vulnerabilities.

## Files Modified

### 1. `scripts/import-impeesa-members.ts`

**Changes:**
- Import: `import * as XLSX from "xlsx"` → `import ExcelJS from "exceljs"`
- Workbook loading: `XLSX.readFile(path)` → `new ExcelJS.Workbook(); await workbook.xlsx.readFile(path)`
- Sheet access: `workbook.Sheets[name]` → `workbook.getWorksheet(name)` or `workbook.worksheets[0]`
- Data extraction: Replaced `XLSX.utils.sheet_to_json()` with custom `extractRows()` using `worksheet.eachRow()`
- Date parsing: Replaced `XLSX.SSF.parse_date_code()` with custom Excel serial date conversion

### 2. `scripts/import-classes-members.ts`

**Changes:**
- Import: `import * as xlsx from "xlsx"` → `import ExcelJS from "exceljs"`
- Workbook loading: `xlsx.readFile()` → `new ExcelJS.Workbook(); await workbook.xlsx.readFile()`
- JSON conversion: Replaced `xlsx.utils.sheet_to_json()` with manual row iteration
- Date parsing: Same custom Excel serial date conversion as above

## Technical Details

### Excel Serial Date Conversion

ExcelJS returns date serial numbers (days since 1900-01-01). Custom conversion implemented:

```typescript
if (typeof value === "number") {
  const excelEpoch = new Date(1899, 11, 30); // Excel epoch (Dec 30, 1899)
  const date = new Date(excelEpoch.getTime() + value * 86400000);
  return Number.isNaN(date.getTime()) ? null : date;
}
```

### Worksheet to Array Conversion

ExcelJS uses iterator pattern instead of direct array conversion:

```typescript
const rows: unknown[][] = [];
worksheet.eachRow({ includeEmpty: true }, (row) => {
  const rowValues: unknown[] = [];
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (cell.type === ExcelJS.ValueType.Date) {
      rowValues[colNumber - 1] = cell.value;
    } else {
      rowValues[colNumber - 1] = cell.value;
    }
  });
  rows.push(rowValues);
});
```

## Benefits

1. **Security**: Zero vulnerabilities vs. 2 HIGH severity in xlsx
2. **Maintenance**: ExcelJS is actively maintained with regular updates
3. **Features**: Better TypeScript support and more comprehensive Excel feature support
4. **Performance**: Comparable performance with better memory management
5. **Modern API**: Promise-based async operations

## Testing

Run the import scripts to verify functionality:

```bash
# Test impeesa members import (if DOCS/LISTAGEM IMPEESA.xlsx exists)
tsx scripts/import-impeesa-members.ts

# Test classes import (if DOCS/classes.xlsx exists)
tsx scripts/import-classes-members.ts
```

## Security Audit

Before migration:
```bash
npm audit
# 1 high severity vulnerability
```

After migration:
```bash
npm audit
# found 0 vulnerabilities ✓
```

## Dependencies Changed

**Removed:**
- `xlsx@0.18.5`

**Added:**
- `exceljs@4.4.0`

## Rollback Plan

If issues arise, rollback is possible but NOT recommended due to security vulnerabilities:

```bash
npm uninstall exceljs
npm install xlsx@0.18.5
git checkout HEAD -- scripts/import-impeesa-members.ts scripts/import-classes-members.ts
```

## Future Considerations

- ExcelJS supports streaming for very large files if needed
- Can add write capabilities (xlsx export) without additional dependencies
- Better support for Excel formulas and formatting if needed in future

## References

- ExcelJS Documentation: https://github.com/exceljs/exceljs
- Security Advisories:
  - https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
  - https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
