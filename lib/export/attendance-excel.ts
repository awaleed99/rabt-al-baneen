import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { MonthlyAttendanceData } from '@/lib/types'

export async function exportMonthlyAttendanceExcel(
  data: MonthlyAttendanceData,
  academicYear = '2025-2026 م'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'فصل الأمير تادرس — كنيسة مارمرقس'
  workbook.created = new Date()

  const sheetName = `حضور ${data.monthNameAr} ${data.year}`
  const ws = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, rightToLeft: true } as any],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: '4:4',
    },
  })

  // Columns: Index, Name, KG Level, [Fridays...], Total Attended, Rate %
  const baseCols: Array<{ key: string; width: number }> = [
    { key: 'index', width: 6 },
    { key: 'full_name', width: 28 },
    { key: 'kg_level', width: 12 },
  ]

  for (const f of data.fridays) {
    baseCols.push({ key: `fri_${f.date}`, width: 16 })
  }

  baseCols.push({ key: 'total_attended', width: 14 })
  baseCols.push({ key: 'attendance_rate', width: 14 })

  ws.columns = baseCols

  const totalColsCount = baseCols.length

  // Row 1: Main Title
  const row1 = ws.addRow(['كشف حضور الجمعة الشهري — فصل الأمير تادرس'])
  ws.mergeCells(1, 1, 1, totalColsCount)
  row1.height = 36
  const cellA1 = ws.getCell('A1')
  cellA1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  cellA1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Blue
  }
  cellA1.alignment = { vertical: 'middle', horizontal: 'center' }

  // Row 2: Subtitle Metadata
  const subtitle = `شهر ${data.monthNameAr} ${data.year}  |  العام الدراسي: ${academicYear}  |  عدد الأولاد: ${data.stats.totalBoys}  |  نسبة الحضور العامة: ${data.stats.overallAttendanceRate}%  |  تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`
  const row2 = ws.addRow([subtitle])
  ws.mergeCells(2, 1, 2, totalColsCount)
  row2.height = 24
  const cellA2 = ws.getCell('A2')
  cellA2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } }
  cellA2.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDBEAFE' }, // Soft Blue
  }
  cellA2.alignment = { vertical: 'middle', horizontal: 'center' }

  // Row 3: Spacer
  const row3 = ws.addRow([])
  row3.height = 8

  // Row 4: Column Headers
  const headerTitles = ['م', 'الاسم (ثلاثي)', 'المرحلة']
  for (const f of data.fridays) {
    headerTitles.push(f.labelAr)
  }
  headerTitles.push('أيام الحضور')
  headerTitles.push('نسبة الحضور')

  const headerRow = ws.addRow(headerTitles)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate Navy
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    }
  })

  // Data Rows
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  }

  data.rows.forEach((row, idx) => {
    const isEven = idx % 2 === 1
    const rowValues: any[] = [
      idx + 1,
      row.boy.full_name || '—',
      (row.boy.kg_level || 'kg1').toUpperCase(),
    ]

    for (const f of data.fridays) {
      const status = row.attendance[f.date]
      if (status === 'present') {
        rowValues.push('حاضر ✓')
      } else if (status === 'excused') {
        rowValues.push('معتذر ◯')
      } else {
        rowValues.push('غائب ✗')
      }
    }

    rowValues.push(`${row.presentCount} من ${data.fridays.length}`)
    rowValues.push(`${row.attendanceRate}%`)

    const sheetRow = ws.addRow(rowValues)
    sheetRow.height = 22

    sheetRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } }
      cell.border = borderStyle

      // Zebra striping
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
      }

      if (colNumber === 1) {
        // Index
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF64748B' } }
      } else if (colNumber === 2) {
        // Full name
        cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } }
      } else if (colNumber === 3) {
        // KG Level
        const isKg2 = (row.boy.kg_level || '').toLowerCase() === 'kg2'
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: isKg2 ? 'FF059669' : 'FF2563EB' },
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isKg2 ? 'FFECFDF5' : 'FFEFF6FF' },
        }
      } else if (colNumber >= 4 && colNumber < 4 + data.fridays.length) {
        // Friday attendance cells
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        const val = String(cell.value || '')
        if (val.includes('حاضر')) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }, // Soft Emerald
          }
        } else if (val.includes('معتذر')) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB45309' } }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' }, // Soft Amber
          }
        } else {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } }
        }
      } else if (colNumber === totalColsCount) {
        // Attendance rate %
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        const isPerfect = row.attendanceRate === 100
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: isPerfect ? 'FF047857' : 'FF1E3A8A' },
        }
        if (isPerfect) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' },
          }
        }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
    })
  })

  // Summary Row at Bottom
  const summaryValues: any[] = ['—', 'إجمالي الحضور لكل جمعة', '—']
  for (const f of data.fridays) {
    let count = 0
    for (const r of data.rows) {
      if (r.attendance[f.date] === 'present') count++
    }
    summaryValues.push(`${count} حاضر`)
  }
  summaryValues.push(`المتوسط: ${data.stats.overallAttendanceRate}%`)
  summaryValues.push('—')

  const summaryRow = ws.addRow(summaryValues)
  summaryRow.height = 24
  summaryRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }, // Slate 200
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0284C7' } },
      bottom: { style: 'thin', color: { argb: 'FF64748B' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  // Write and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `attendance-${data.year}-${String(data.month).padStart(2, '0')}.xlsx`
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, filename)
}
