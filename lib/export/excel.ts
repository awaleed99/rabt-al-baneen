import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { Boy } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export interface ExportExcelOptions {
  boys: Boy[]
  kgLevel?: 'all' | 'kg1' | 'kg2'
  categoryLabel?: string
  academicYear?: string
}

export async function exportBoysToExcel({
  boys,
  kgLevel = 'all',
  categoryLabel,
  academicYear = '2025-2026 م',
}: ExportExcelOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'فصل الأمير تادرس — Fasl El-Ameer Tadros'
  workbook.lastModifiedBy = 'فصل الأمير تادرس'
  workbook.created = new Date()
  workbook.modified = new Date()

  const resolvedCategory =
    categoryLabel ||
    (kgLevel === 'kg1' ? 'KG1' : kgLevel === 'kg2' ? 'KG2' : 'جميع الفئات (الكل)')

  const populateSheet = (
    sheetName: string,
    sheetBoys: Boy[],
    sheetSubtitleSuffix = ''
  ) => {
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

    // Set Column Widths
    ws.columns = [
      { key: 'index', width: 6 },
      { key: 'full_name', width: 28 },
      { key: 'kg_level', width: 12 },
      { key: 'address', width: 34 },
      { key: 'dob', width: 15 },
      { key: 'father_phone', width: 18 },
      { key: 'mother_phone', width: 18 },
      { key: 'last_check_in', width: 16 },
      { key: 'check_in_count', width: 13 },
      { key: 'notes', width: 30 },
    ]

    // Row 1: Title Header
    const row1 = ws.addRow(['سجل الأولاد — فصل الأمير تادرس'])
    ws.mergeCells('A1:J1')
    row1.height = 36
    const cellA1 = ws.getCell('A1')
    cellA1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    cellA1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Rich Dark Blue
    }
    cellA1.alignment = { vertical: 'middle', horizontal: 'center' }

    // Row 2: Subtitle & Metadata
    const subtitleText = `العام الدراسي ${academicYear}   |   الفئة: ${sheetSubtitleSuffix || resolvedCategory}   |   تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}   |   إجمالي المقيدين: ${sheetBoys.length}`
    const row2 = ws.addRow([subtitleText])
    ws.mergeCells('A2:J2')
    row2.height = 24
    const cellA2 = ws.getCell('A2')
    cellA2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } }
    cellA2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }, // Soft Blue Accent
    }
    cellA2.alignment = { vertical: 'middle', horizontal: 'center' }

    // Row 3: Spacer
    const row3 = ws.addRow([])
    row3.height = 8

    // Row 4: Column Headers
    const headers = [
      'م',
      'الاسم (ثلاثي)',
      'المرحلة',
      'العنوان ومكان السكن',
      'تاريخ الميلاد',
      'موبايل الأب',
      'موبايل الأم',
      'آخر زيارة',
      'عدد الزيارات',
      'ملاحظات',
    ]
    const headerRow = ws.addRow(headers)
    headerRow.height = 28
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }, // Deep Slate Navy
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      }
    })

    // Enable Autofilter on table headers
    ws.autoFilter = {
      from: 'A4',
      to: 'J4',
    }

    // Data Rows
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }

    sheetBoys.forEach((boy, idx) => {
      const isEven = idx % 2 === 1
      const rowData = [
        idx + 1,
        boy.full_name || '—',
        (boy.kg_level || 'kg1').toUpperCase(),
        boy.address || '—',
        boy.date_of_birth ? formatDate(boy.date_of_birth) : '—',
        boy.father_phone || boy.phone_number || '—',
        boy.mother_phone || '—',
        boy.last_check_in ? formatDate(boy.last_check_in) : 'لم يُزَر بعد',
        boy.check_in_count ?? 0,
        boy.notes || '',
      ]

      const dataRow = ws.addRow(rowData)
      dataRow.height = 22

      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } }
        cell.border = borderStyle

        // Zebra striping
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          }
        }

        // Specific alignments & colors
        const isKg2 = (boy.kg_level || '').toLowerCase() === 'kg2'
        if (colNumber === 1) {
          // Index
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF64748B' } }
        } else if (colNumber === 2) {
          // Name
          cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
          cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } }
        } else if (colNumber === 3) {
          // KG Level badge styling
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
        } else if (colNumber === 4 || colNumber === 10) {
          // Address, Notes
          cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
        } else {
          // Dates, Phones, Counts
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
      })
    })
  }

  // 1. Primary Sheet
  populateSheet('سجل البنين', boys)

  // 2. If 'all' was selected and we have boys in both KG1 and KG2, also create individual tabs
  if (kgLevel === 'all') {
    const kg1Boys = boys.filter((b) => (b.kg_level || 'kg1').toLowerCase() === 'kg1')
    const kg2Boys = boys.filter((b) => (b.kg_level || '').toLowerCase() === 'kg2')

    if (kg1Boys.length > 0) {
      populateSheet('سجل KG1', kg1Boys, 'KG1 فقط')
    }
    if (kg2Boys.length > 0) {
      populateSheet('سجل KG2', kg2Boys, 'KG2 فقط')
    }
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer()
  const todayStr = new Date().toISOString().split('T')[0]
  const filename = `rabt-al-baneen-${kgLevel !== 'all' ? kgLevel.toUpperCase() + '-' : ''}${todayStr}.xlsx`

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, filename)
}
