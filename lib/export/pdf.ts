import type { Boy } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export interface ExportPdfOptions {
  boys: Boy[]
  kgLevel?: 'all' | 'kg1' | 'kg2'
  categoryLabel?: string
  academicYear?: string
}

export async function exportBoysToPdf({
  boys,
  kgLevel = 'all',
  categoryLabel,
  academicYear = '2025-2026 م',
}: ExportPdfOptions): Promise<void> {
  if (typeof window === 'undefined') return

  const resolvedCategory =
    categoryLabel ||
    (kgLevel === 'kg1' ? 'KG1' : kgLevel === 'kg2' ? 'KG2' : 'جميع الفئات (الكل)')
  const todayStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const isoDate = new Date().toISOString().split('T')[0]
  const filename = `rabt-al-baneen-${kgLevel !== 'all' ? kgLevel.toUpperCase() + '-' : ''}${isoDate}.pdf`

  // Build the dedicated print/export HTML container
  // Using pure table-based layout (no flexbox) for 100% html2canvas compatibility
  const container = document.createElement('div')
  container.id = 'print-pdf-registry'
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '1120px' // A4 landscape ratio width
  container.style.padding = '24px 32px'
  container.style.backgroundColor = '#ffffff'
  container.style.color = '#0f172a'
  container.style.zIndex = '99999'
  container.style.fontFamily =
    "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', Tahoma, sans-serif"
  container.style.direction = 'rtl'
  container.style.textAlign = 'right'
  container.style.boxSizing = 'border-box'

  container.innerHTML = `
    <style>
      #print-pdf-registry * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      #print-pdf-registry table.data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
        font-size: 11px;
      }
      #print-pdf-registry th {
        background-color: #0f172a;
        color: #ffffff;
        font-weight: 700;
        text-align: center;
        padding: 8px 5px;
        border: 1px solid #334155;
        font-size: 11px;
      }
      #print-pdf-registry td {
        padding: 6px 6px;
        border: 1px solid #cbd5e1;
        color: #1e293b;
        vertical-align: middle;
      }
      #print-pdf-registry tr:nth-child(even) td {
        background-color: #f8fafc;
      }
      .badge-kg1 {
        display: inline-block;
        padding: 2px 8px;
        background-color: #dbeafe;
        color: #1d4ed8;
        font-weight: 700;
        border-radius: 4px;
        border: 1px solid #bfdbfe;
        font-size: 10px;
      }
      .badge-kg2 {
        display: inline-block;
        padding: 2px 8px;
        background-color: #d1fae5;
        color: #047857;
        font-weight: 700;
        border-radius: 4px;
        border: 1px solid #a7f3d0;
        font-size: 10px;
      }
    </style>

    <!-- Header Table (Pure table layout for full html2canvas fidelity) -->
    <table style="width: 100%; border: none; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 8px;">
      <tr>
        <td style="width: 32%; border: none; text-align: right; vertical-align: top; background: transparent;">
          <h3 style="font-size: 14px; font-weight: 700; color: #1e3a8a; margin-bottom: 3px;">كنيسة مارمرقس — أسرة الأبرار حضانة</h3>
          <p style="font-size: 12px; color: #475569;">رابطة البنين — سجل المتابعة والرعاية</p>
        </td>
        <td style="width: 36%; border: none; text-align: center; vertical-align: top; background: transparent;">
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">سِجِلّ الأولاد</h1>
          <p style="font-size: 12px; font-weight: 600; color: #0284c7;">العام الدراسي ${academicYear}</p>
        </td>
        <td style="width: 32%; border: none; text-align: left; vertical-align: top; background: transparent; font-size: 11px; color: #475569; line-height: 1.6;">
          <div><strong>تاريخ التصدير:</strong> ${todayStr}</div>
          <div><strong>الفئة:</strong> <span style="color: #0f172a; font-weight: 700;">${resolvedCategory}</span></div>
          <div><strong>إجمالي المقيدين:</strong> <span style="color: #0f172a; font-weight: 700;">${boys.length}</span> ولد</div>
        </td>
      </tr>
    </table>

    <!-- Official Registry Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35px;">م</th>
          <th style="width: 175px; text-align: right; padding-right: 8px;">الاسم (ثلاثي)</th>
          <th style="width: 60px;">المرحلة</th>
          <th style="width: 220px; text-align: right; padding-right: 8px;">العنوان ومكان السكن</th>
          <th style="width: 85px;">تاريخ الميلاد</th>
          <th style="width: 105px;">موبايل ولي الأمر</th>
          <th style="width: 85px;">آخر زيارة</th>
          <th style="width: 55px;">الزيارات</th>
          <th style="text-align: right; padding-right: 8px;">ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${boys
          .map((boy, idx) => {
            const isKg2 = (boy.kg_level || '').toLowerCase() === 'kg2'
            return `
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
              <td style="font-weight: 700; color: #0f172a; padding-right: 8px;">${boy.full_name || '—'}</td>
              <td style="text-align: center;">
                <span class="${isKg2 ? 'badge-kg2' : 'badge-kg1'}">
                  ${(boy.kg_level || 'kg1').toUpperCase()}
                </span>
              </td>
              <td style="padding-right: 8px;">${boy.address || '—'}</td>
              <td style="text-align: center; font-family: monospace; font-size: 10px;">
                ${boy.date_of_birth ? formatDate(boy.date_of_birth) : '—'}
              </td>
              <td style="text-align: center; font-family: monospace; font-size: 10px; direction: ltr;">
                ${boy.phone_number || '—'}
              </td>
              <td style="text-align: center; font-size: 10px;">
                ${boy.last_check_in ? formatDate(boy.last_check_in) : '<span style="color: #94a3b8;">لم يُزَر</span>'}
              </td>
              <td style="text-align: center; font-weight: 600;">
                ${boy.check_in_count ?? 0}
              </td>
              <td style="padding-right: 8px; font-size: 10px; color: #475569;">
                ${boy.notes || ''}
              </td>
            </tr>
          `
          })
          .join('')}
      </tbody>
    </table>

    <!-- Footer Stamp Table -->
    <table style="width: 100%; border: none; border-top: 1px solid #cbd5e1; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #64748b;">
      <tr>
        <td style="width: 33%; border: none; text-align: right; background: transparent;">منظومة رابطة البنين — سجل رسمي معتمد</td>
        <td style="width: 34%; border: none; text-align: center; background: transparent;">توقيع خادم المرحلة: .......................................</td>
        <td style="width: 33%; border: none; text-align: left; background: transparent;">ختم وتوقيع أمين الخدمة: .......................................</td>
      </tr>
    </table>
  `

  document.body.appendChild(container)

  try {
    // Dynamic import to avoid SSR errors
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default || html2canvasModule
    const { jsPDF } = await import('jspdf')

    // Allow DOM to layout and render fonts before capturing
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Capture the container directly via html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    // A4 Landscape dimensions in mm: 297 x 210
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 297
    const pageHeight = 210
    const margin = 10
    const printableWidth = pageWidth - margin * 2 // 277 mm
    const printableHeight = pageHeight - margin * 2 // 190 mm

    const imgWidth = printableWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (imgHeight <= printableHeight) {
      // Fits on a single landscape page
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight)
    } else {
      // Multi-page splitting
      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
      heightLeft -= printableHeight

      while (heightLeft > 0) {
        position = position - printableHeight
        pdf.addPage('a4', 'landscape')
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
        heightLeft -= printableHeight
      }
    }

    // Save and download the PDF
    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}

// Optional helper to open a clean print preview window using the browser's native print engine
export function printBoysRegistryWindow({
  boys,
  kgLevel = 'all',
  categoryLabel,
  academicYear = '2025-2026 م',
}: ExportPdfOptions): void {
  if (typeof window === 'undefined') return

  const resolvedCategory =
    categoryLabel ||
    (kgLevel === 'kg1' ? 'KG1' : kgLevel === 'kg2' ? 'KG2' : 'جميع الفئات (الكل)')
  const todayStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>سجل الأولاد — رابطة البنين</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: 'Cairo', system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 10mm;
          color: #0f172a;
          direction: rtl;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px 4px;
          border: 1px solid #334155;
          text-align: center;
        }
        td {
          padding: 6px 4px;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
        <div>
          <h3 style="margin: 0; font-size: 14px;">كنيسة مارمرقس — أسرة الأبرار حضانة</h3>
          <p style="margin: 3px 0 0; font-size: 11px; color: #475569;">رابطة البنين — سجل المتابعة</p>
        </div>
        <div style="text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">سِجِلّ الأولاد</h1>
          <p style="margin: 3px 0 0; font-size: 11px; color: #0284c7;">العام الدراسي ${academicYear}</p>
        </div>
        <div style="text-align: left; font-size: 10px; color: #475569;">
          <div>تاريخ التصدير: ${todayStr}</div>
          <div>الفئة: <strong>${resolvedCategory}</strong></div>
          <div>العدد: <strong>${boys.length}</strong></div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">م</th>
            <th style="width: 160px; text-align: right;">الاسم</th>
            <th style="width: 50px;">المرحلة</th>
            <th style="width: 200px; text-align: right;">العنوان</th>
            <th style="width: 80px;">تاريخ الميلاد</th>
            <th style="width: 100px;">الهاتف</th>
            <th style="width: 80px;">آخر زيارة</th>
            <th style="width: 45px;">الزيارات</th>
            <th style="text-align: right;">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${boys.map((b, i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td><strong>${b.full_name || '—'}</strong></td>
              <td style="text-align: center;">${(b.kg_level || 'kg1').toUpperCase()}</td>
              <td>${b.address || '—'}</td>
              <td style="text-align: center;">${b.date_of_birth ? formatDate(b.date_of_birth) : '—'}</td>
              <td style="text-align: center; direction: ltr;">${b.phone_number || '—'}</td>
              <td style="text-align: center;">${b.last_check_in ? formatDate(b.last_check_in) : 'لم يُزَر'}</td>
              <td style="text-align: center;">${b.check_in_count ?? 0}</td>
              <td>${b.notes || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
