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
  const container = document.createElement('div')
  container.id = 'print-pdf-registry'
  container.style.position = 'fixed'
  container.style.top = '-99999px'
  container.style.left = '-99999px'
  container.style.width = '1120px' // A4 landscape width at standard desktop density
  container.style.padding = '24px 32px'
  container.style.backgroundColor = '#ffffff'
  container.style.color = '#0f172a'
  container.style.fontFamily =
    "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', Tahoma, sans-serif"
  container.style.direction = 'rtl'
  container.style.textAlign = 'right'
  container.style.boxSizing = 'border-box'

  // HTML content
  container.innerHTML = `
    <style>
      #print-pdf-registry * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      #print-pdf-registry table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
        font-size: 11px;
      }
      #print-pdf-registry thead {
        display: table-header-group;
      }
      #print-pdf-registry tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      #print-pdf-registry th {
        background-color: #0f172a;
        color: #ffffff;
        font-weight: 700;
        text-align: center;
        padding: 7px 5px;
        border: 1px solid #334155;
        font-size: 11px;
      }
      #print-pdf-registry td {
        padding: 6px 5px;
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

    <!-- Top Registry Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #0f172a;">
      <div style="text-align: right;">
        <h3 style="font-size: 14px; font-weight: 700; color: #1e3a8a;">كنيسة مارمرقس — أسرة الأبرار حضانة</h3>
        <p style="font-size: 12px; color: #475569; margin-top: 2px;">رابطة البنين — سجل المتابعة والرعاية</p>
      </div>
      <div style="text-align: center;">
        <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">سِجِلّ الأولاد</h1>
        <p style="font-size: 12px; font-weight: 600; color: #0284c7; margin-top: 2px;">العام الدراسي ${academicYear}</p>
      </div>
      <div style="text-align: left; font-size: 11px; color: #475569; line-height: 1.5;">
        <div><strong>تاريخ التصدير:</strong> ${todayStr}</div>
        <div><strong>الفئة:</strong> <span style="color: #0f172a; font-weight: 700;">${resolvedCategory}</span></div>
        <div><strong>إجمالي المقيدين:</strong> <span style="color: #0f172a; font-weight: 700;">${boys.length}</span> ولد</div>
      </div>
    </div>

    <!-- Official Registry Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 32px;">م</th>
          <th style="width: 175px; text-align: right; padding-right: 8px;">الاسم (ثلاثي)</th>
          <th style="width: 58px;">المرحلة</th>
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

    <!-- Footer / Stamp Section -->
    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
      <div>منظومة رابطة البنين — سجل رسمي معتمد</div>
      <div>توقيع خادم المرحلة: .......................................</div>
      <div>ختم وتوقيع أمين الخدمة: .......................................</div>
    </div>
  `

  document.body.appendChild(container)

  try {
    // Dynamic import html2pdf to ensure browser-only execution
    const html2pdf = (await import('html2pdf.js')).default

    const opt = {
      margin: [8, 8, 8, 8] as [number, number, number, number],
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape' as const,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }

    await html2pdf().set(opt).from(container).save()
  } finally {
    document.body.removeChild(container)
  }
}
