import type { Boy } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export interface ExportPdfOptions {
  boys: Boy[]
  kgLevel?: 'all' | 'kg1' | 'kg2'
  categoryLabel?: string
  academicYear?: string
}

/**
 * Native Browser Print / Vector PDF Export
 * Opens a dedicated official registry window and launches the browser's native print engine.
 * Generates 100% crisp vector PDF with perfect Arabic typography, zero letter collision, and selectable text.
 */
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
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) لمعاينة وطباعة السجل')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>سجل الأولاد — رابطة البنين</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Cairo', system-ui, -apple-system, sans-serif;
          background-color: #ffffff;
          color: #0f172a;
          direction: rtl;
          padding: 10mm;
          font-size: 11px;
          line-height: 1.4;
        }
        @media screen {
          body {
            background-color: #f1f5f9;
            padding: 24px;
          }
          .registry-sheet {
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
            padding: 24px 32px;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          }
          .action-bar {
            max-width: 1200px;
            margin: 0 auto 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 10px;
          }
          .action-btn {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .action-btn:hover {
            background: #1d4ed8;
          }
          .close-btn {
            background: #334155;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
          }
          .close-btn:hover {
            background: #475569;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0 !important;
            background: #ffffff !important;
          }
          .registry-sheet {
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          font-size: 11px;
        }
        table.data-table th {
          background-color: #0f172a !important;
          color: #ffffff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          padding: 8px 6px;
          border: 1px solid #334155;
          text-align: center;
          font-weight: 700;
        }
        table.data-table td {
          padding: 6px 6px;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }
        table.data-table tr:nth-child(even) td {
          background-color: #f8fafc !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
        }
        .badge-kg1 {
          display: inline-block;
          padding: 2px 8px;
          background-color: #dbeafe !important;
          color: #1d4ed8 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-weight: 700;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
          font-size: 10px;
        }
        .badge-kg2 {
          display: inline-block;
          padding: 2px 8px;
          background-color: #d1fae5 !important;
          color: #047857 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-weight: 700;
          border-radius: 4px;
          border: 1px solid #a7f3d0;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="no-print action-bar">
        <div style="font-weight: 700; font-size: 14px;">
          سجل الأولاد — معاينة الطباعة وحفظ الـ PDF
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="action-btn" onclick="window.print()">
            🖨️ طباعة / حفظ كـ PDF
          </button>
          <button class="close-btn" onclick="window.close()">
            ✕ إغلاق
          </button>
        </div>
      </div>

      <div class="registry-sheet">
        <!-- Header -->
        <table style="width: 100%; border: none; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 8px;">
          <tr>
            <td style="width: 32%; border: none; text-align: right; vertical-align: top; background: transparent;">
              <h3 style="font-size: 14px; font-weight: 700; color: #1e3a8a; margin-bottom: 3px;">كنيسة مارمرقس — أسرة الأبرار حضانة</h3>
              <p style="font-size: 12px; color: #475569;">رابطة البنين — سجل المتابعة والرعاية</p>
            </td>
            <td style="width: 36%; border: none; text-align: center; vertical-align: top; background: transparent;">
              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">سجل الأولاد</h1>
              <p style="font-size: 12px; font-weight: 600; color: #0284c7;">العام الدراسي ${academicYear}</p>
            </td>
            <td style="width: 32%; border: none; text-align: left; vertical-align: top; background: transparent; font-size: 11px; color: #475569; line-height: 1.6;">
              <div><strong>تاريخ التصدير:</strong> ${todayStr}</div>
              <div><strong>الفئة:</strong> <span style="color: #0f172a; font-weight: 700;">${resolvedCategory}</span></div>
              <div><strong>إجمالي المقيدين:</strong> <span style="color: #0f172a; font-weight: 700;">${boys.length}</span> ولد</div>
            </td>
          </tr>
        </table>

        <!-- Table -->
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

        <!-- Footer Stamp -->
        <table style="width: 100%; border: none; border-top: 1px solid #cbd5e1; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #64748b;">
          <tr>
            <td style="width: 33%; border: none; text-align: right; background: transparent;">منظومة رابطة البنين — سجل رسمي معتمد</td>
            <td style="width: 34%; border: none; text-align: center; background: transparent;">توقيع خادم المرحلة: .......................................</td>
            <td style="width: 33%; border: none; text-align: left; background: transparent;">ختم وتوقيع أمين الخدمة: .......................................</td>
          </tr>
        </table>
      </div>

      <script>
        // Trigger print automatically on desktop after fonts load
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
          }, 400);
        });
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Direct file download PDF generator
 */
export async function exportBoysToPdf({
  boys,
  kgLevel = 'all',
  categoryLabel,
  academicYear = '2025-2026 م',
}: ExportPdfOptions): Promise<void> {
  // Use native vector print for guaranteed 100% sharp Arabic output with zero letter collision
  printBoysRegistryWindow({ boys, kgLevel, categoryLabel, academicYear })
}
