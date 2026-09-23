import type { Boy } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export interface ExportPdfOptions {
  boys: Boy[]
  kgLevel?: 'all' | 'kg1' | 'kg2'
  categoryLabel?: string
  academicYear?: string
}

/**
 * Detects if the current user agent is mobile / tablet
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || ''
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua)
  const isTouchScreen = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  const isSmallScreen = window.innerWidth <= 800
  return isMobileUA || (Boolean(isTouchScreen) && isSmallScreen)
}

/**
 * Native Browser Print / Vector PDF Export
 * Opens a dedicated official registry window and launches the browser's native print engine.
 * Generates 100% crisp vector PDF with perfect Arabic typography, zero letter collision, and selectable text.
 * Returns true if window was opened successfully, false if on mobile or blocked by popup blocker.
 */
export function printBoysRegistryWindow({
  boys,
  kgLevel = 'all',
  categoryLabel,
  academicYear = '2025-2026 م',
}: ExportPdfOptions): boolean {
  if (typeof window === 'undefined') return false

  // On mobile devices, window.open('', '_blank') creates an unrenderable about:blank white tab.
  // We return false to let the caller present the in-page mobile printable modal.
  if (isMobileDevice()) {
    return false
  }

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
    return false
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>سجل الأولاد — فصل الأمير تادرس</title>
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
              <h3 style="font-size: 14px; font-weight: 700; color: #1e3a8a; margin-bottom: 3px;">كنيسة مارمرقس — فصل الأمير تادرس</h3>
              <p style="font-size: 12px; color: #475569;">فصل الأمير تادرس — سجل المتابعة والرعاية</p>
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
              <th style="width: 125px;">هواتف أولياء الأمور</th>
              <th style="width: 85px;">آخر زيارة</th>
              <th style="width: 55px;">الزيارات</th>
              <th style="text-align: right; padding-right: 8px;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${boys
              .map((boy, idx) => {
                const isKg2 = (boy.kg_level || '').toLowerCase() === 'kg2'
                const fPhone = boy.father_phone || boy.phone_number
                const mPhone = boy.mother_phone
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
                  <td style="text-align: center; font-family: monospace; font-size: 9px; line-height: 1.4;">
                    ${fPhone ? `<div><strong style="color: #1e3a8a;">الأب:</strong> <span dir="ltr">${fPhone}</span></div>` : ''}
                    ${mPhone ? `<div><strong style="color: #be185d;">الأم:</strong> <span dir="ltr">${mPhone}</span></div>` : ''}
                    ${!fPhone && !mPhone ? '—' : ''}
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
            <td style="width: 33%; border: none; text-align: right; background: transparent;">منظومة فصل الأمير تادرس — سجل رسمي معتمد</td>
            <td style="width: 34%; border: none; text-align: center; background: transparent;">توقيع خادم المرحلة: .......................................</td>
            <td style="width: 33%; border: none; text-align: left; background: transparent;">ختم وتوقيع أمين الخدمة: .......................................</td>
          </tr>
        </table>
      </div>

      <script>
        function triggerPrint() {
          setTimeout(function() {
            try {
              window.focus();
              window.print();
            } catch (e) {
              console.error('Print trigger error', e);
            }
          }, 350);
        }
        if (document.readyState === 'complete') {
          triggerPrint();
        } else {
          window.addEventListener('load', triggerPrint);
        }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
  return true
}

/**
 * Options for client-side direct PDF file download
 */
export interface DownloadPdfOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: string
  marginMm?: number | [number, number, number, number]
}

/**
 * Color sanitizer helper using browser Canvas 2D engine
 * Converts any modern color (oklab, oklch, lab, color-mix) to standard sRGB rgb/rgba
 */
const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'fill',
  'stroke',
] as const

const MODERN_COLOR_REGEX = /(?:oklab|oklch|lab)\([^)]+\)/gi

function createColorSanitizer() {
  if (typeof document === 'undefined') {
    return (val: string) => val
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const cache = new Map<string, string>()

  const toRgba = (colorStr: string): string => {
    if (!ctx || !colorStr) return 'rgba(0,0,0,0)'
    const cached = cache.get(colorStr)
    if (cached) return cached

    try {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#00000000'
      ctx.fillStyle = colorStr
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      const alpha = Number((a / 255).toFixed(3))
      const res = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
      cache.set(colorStr, res)
      return res
    } catch {
      return 'rgba(0,0,0,0)'
    }
  }

  return (val: string): string => {
    if (!val || typeof val !== 'string') return val
    if (!/(oklab|oklch|lab)/i.test(val)) return val
    MODERN_COLOR_REGEX.lastIndex = 0
    return val.replace(MODERN_COLOR_REGEX, (match) => toRgba(match))
  }
}

/**
 * Downloads a DOM element as a crisp, high-resolution PDF file directly on client device
 * Works seamlessly on iOS Safari, Android Chrome, and Desktop browsers without blank screens.
 */
export async function downloadElementAsPdf(
  elementOrId: string | HTMLElement,
  options: DownloadPdfOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const element =
    typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId

  if (!element) {
    console.error('downloadElementAsPdf: target element not found:', elementOrId)
    return false
  }

  const filename = options.filename
    ? options.filename.endsWith('.pdf')
      ? options.filename
      : `${options.filename}.pdf`
    : 'document.pdf'

  const orientation = options.orientation || 'landscape'
  const margin = options.marginMm ?? (orientation === 'landscape' ? [6, 8, 6, 8] : [8, 8, 8, 8])

  // Show hidden elements temporarily (e.g., hidden print:block)
  const wasHidden = element.classList.contains('hidden')
  if (wasHidden) {
    element.classList.remove('hidden')
    element.style.display = 'block'
  }

  // Silence html2canvas oklab/lab/oklch console errors — these are non-fatal warnings.
  // html2canvas falls back gracefully and still renders the PDF.
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message ?? '')
    if (/(unsupported color function|oklab|oklch)/i.test(msg)) return
    originalConsoleError.apply(console, args)
  }

  // Pre-sanitize all color values in the element tree before html2canvas reads them
  const sanitizeCss = createColorSanitizer()
  const allEls = [element, ...Array.from(element.querySelectorAll('*'))]
  const styleBackups = new Map<HTMLElement, string>()
  for (const el of allEls) {
    const htmlEl = el as HTMLElement
    if (!htmlEl.style) continue
    styleBackups.set(htmlEl, htmlEl.getAttribute('style') ?? '')
    try {
      const comp = getComputedStyle(el)
      for (const prop of COLOR_PROPS) {
        const val = (comp as any)[prop]
        if (val && /(oklab|oklch|lab)/i.test(val)) {
          const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
          htmlEl.style.setProperty(cssProp, sanitizeCss(val), 'important')
        }
      }
      const bs = comp.boxShadow
      if (bs && /(oklab|oklch|lab)/i.test(bs)) {
        htmlEl.style.setProperty('box-shadow', sanitizeCss(bs), 'important')
      }
      const ts = comp.textShadow
      if (ts && /(oklab|oklch|lab)/i.test(ts)) {
        htmlEl.style.setProperty('text-shadow', sanitizeCss(ts), 'important')
      }
    } catch { /* ignore per-element errors */ }
  }

  try {
    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = (html2pdfModule as any).default || html2pdfModule

    const opt = {
      margin,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          try {
            const styleTag = clonedDoc.createElement('style')
            styleTag.innerHTML = `*, *::before, *::after { --tw-shadow-color: rgba(0,0,0,0.08) !important; }`
            clonedDoc.head?.appendChild(styleTag)
          } catch { /* silent */ }
        },
      },
      jsPDF: {
        unit: 'mm',
        format: options.format || 'a4',
        orientation,
        compress: true,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }

    await html2pdf().set(opt).from(element).save()
    return true
  } catch (err) {
    console.warn('[PDF export] error:', err)
    return false
  } finally {
    console.error = originalConsoleError
    for (const [htmlEl, originalStyle] of styleBackups.entries()) {
      if (originalStyle) {
        htmlEl.setAttribute('style', originalStyle)
      } else {
        htmlEl.removeAttribute('style')
      }
    }
    if (wasHidden) {
      element.classList.add('hidden')
      element.style.display = ''
    }
  }
}

/**
 * Direct file download PDF generator
 */
export async function exportBoysToPdf({
  boys,
  kgLevel = 'all',
  categoryLabel,
  academicYear = '2025-2026 م',
}: ExportPdfOptions): Promise<boolean> {
  // Use native vector print for guaranteed 100% sharp Arabic output with zero letter collision
  return printBoysRegistryWindow({ boys, kgLevel, categoryLabel, academicYear })
}

// ─── Shared Arabic font style block for all print windows ────────────────────
function _arabicFontStyle(pageSize = 'A4 portrait'): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    @page { size: ${pageSize}; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', Arial, sans-serif !important;
      direction: rtl;
      background: #ffffff;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print { .no-print { display: none !important; } }
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      margin-bottom: 14px;
      font-weight: 700;
      font-size: 13px;
    }
    .action-btn {
      background: #2563eb; color: #fff; border: none;
      padding: 7px 16px; font-size: 13px; font-weight: 700;
      border-radius: 6px; cursor: pointer;
      font-family: 'Cairo', sans-serif;
      margin-left: 8px;
    }
    .close-btn {
      background: #475569; color: #fff; border: none;
      padding: 7px 14px; font-size: 13px; font-weight: 600;
      border-radius: 6px; cursor: pointer;
      font-family: 'Cairo', sans-serif;
    }
  `
}

// ─── Print-window: Monthly Birthdays ─────────────────────────────────────────
export interface PrintBirthdaysOptions {
  boys: Array<{
    id: string
    full_name: string
    kg_level: string
    turningAge: number
    birthDay: number
    dayNameAr: string
    father_phone?: string | null
    mother_phone?: string | null
  }>
  monthNameAr: string
  year: number
}

export function printBirthdaysWindow({ boys, monthNameAr, year }: PrintBirthdaysOptions): boolean {
  if (typeof window === 'undefined') return false
  if (isMobileDevice()) return false

  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  const today = new Date().toLocaleDateString('ar-EG')
  const rows = boys
    .map(
      (b, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#faf5ff'}">
      <td style="text-align:center;font-weight:700;color:#6b7280">${idx + 1}</td>
      <td style="font-weight:700;color:#0f172a;padding-right:8px">${b.full_name}</td>
      <td style="text-align:center">
        <span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;
          background:${b.kg_level === 'kg2' ? '#dcfce7' : '#dbeafe'};
          color:${b.kg_level === 'kg2' ? '#166534' : '#1e40af'};
          border:1px solid ${b.kg_level === 'kg2' ? '#86efac' : '#93c5fd'}">
          ${b.kg_level === 'kg2' ? 'KG2' : 'KG1'}
        </span>
      </td>
      <td style="text-align:center;font-weight:700">${b.birthDay} ${monthNameAr}</td>
      <td style="text-align:center;color:#4b5563">${b.dayNameAr}</td>
      <td style="text-align:center;font-weight:700;color:#7e22ce">${b.turningAge} سنوات</td>
      <td style="text-align:center;font-size:10px;direction:ltr">${b.father_phone || '—'}</td>
      <td style="text-align:center;font-size:10px;direction:ltr">${b.mother_phone || '—'}</td>
    </tr>
  `
    )
    .join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>كشف أعياد الميلاد — ${monthNameAr} ${year}</title>
      <style>
        ${_arabicFontStyle('A4 portrait')}
        h1 { font-size: 20px; font-weight: 800; color: #1e1b4b; }
        h2 { font-size: 12px; font-weight: 700; color: #6b21a8; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
        th {
          background: #7e22ce !important; color: #fff !important;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
          padding: 8px 8px; border: 1px solid #6b21a8;
          text-align: center; font-weight: 700;
        }
        td { padding: 7px 8px; border: 1px solid #e9d5ff; vertical-align: middle; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .footer {
          margin-top: 20px; padding-top: 12px; border-top: 1px solid #e9d5ff;
          display: flex; justify-content: space-between;
          font-size: 11px; color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="no-print action-bar">
        <span>كشف أعياد الميلاد — ${monthNameAr} ${year}</span>
        <div>
          <button class="action-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
          <button class="close-btn" onclick="window.close()">✕ إغلاق</button>
        </div>
      </div>

      <div style="border-bottom:3px solid #7e22ce;padding-bottom:14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2>كنيسة الشهيد العظيم مارمرقس — فصل الأمير تادرس</h2>
          <h1>كشف أعياد ميلاد الطلبة — شهر ${monthNameAr} (${year})</h1>
        </div>
        <div style="text-align:left;font-size:11px;color:#6b7280;line-height:1.7">
          <div><strong>إجمالي المحتفلين:</strong> ${boys.length} طفل</div>
          <div><strong>تاريخ الإصدار:</strong> ${today}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:36px">م</th>
            <th style="text-align:right;padding-right:8px">اسم الطفل</th>
            <th style="width:60px">المرحلة</th>
            <th style="width:90px">تاريخ الميلاد</th>
            <th style="width:80px">يوم الأسبوع</th>
            <th style="width:75px">العمر الجديد</th>
            <th style="width:110px">هاتف الأب</th>
            <th style="width:110px">هاتف الأم</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="footer">
        <span>فصل الأمير تادرس — رعاية وافتقاد أعياد الميلاد</span>
        <span>توقيع خادم المرحلة: .......................................</span>
      </div>

      <script>
        setTimeout(function() { window.focus(); window.print(); }, 400);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
  return true
}

// ─── Print-window: Monthly Attendance ────────────────────────────────────────
export interface PrintAttendanceOptions {
  rows: Array<{
    boy: { full_name: string; kg_level: string }
    attendance: Record<string, string> // date -> status
    presentCount: number
    totalFridaysCount: number
    attendanceRate: number
  }>
  fridays: Array<{ date: string; labelAr: string }>
  monthNameAr: string
  year: number
}

export function printAttendanceWindow({
  rows,
  fridays,
  monthNameAr,
  year,
}: PrintAttendanceOptions): boolean {
  if (typeof window === 'undefined') return false
  if (isMobileDevice()) return false

  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  const today = new Date().toLocaleDateString('ar-EG')

  // Friday header columns
  const fridayCols = fridays
    .map((f) => `<th style="width:38px;min-width:34px">${f.labelAr}</th>`)
    .join('')

  const tableRows = rows
    .map((row, idx) => {
      const statusCells = fridays
        .map((f) => {
          const status = row.attendance[f.date]
          let cell = '—'
          let bg = 'transparent'
          let color = '#94a3b8'
          if (status === 'present') {
            cell = '✓'
            bg = '#dcfce7'
            color = '#166534'
          } else if (status === 'absent') {
            cell = '✗'
            bg = '#fee2e2'
            color = '#991b1b'
          } else if (status === 'excused') {
            cell = 'م'
            bg = '#fef9c3'
            color = '#854d0e'
          }
          return `<td style="text-align:center;font-weight:700;font-size:13px;background:${bg} !important;color:${color};-webkit-print-color-adjust:exact;print-color-adjust:exact">${cell}</td>`
        })
        .join('')

      const rateColor =
        row.attendanceRate >= 80
          ? '#166534'
          : row.attendanceRate >= 50
          ? '#854d0e'
          : '#991b1b'

      return `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="text-align:center;font-weight:700;color:#6b7280">${idx + 1}</td>
        <td style="font-weight:700;color:#0f172a;padding-right:8px">${row.boy.full_name}</td>
        <td style="text-align:center">
          <span style="padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;
            background:${row.boy.kg_level === 'kg2' ? '#dcfce7' : '#dbeafe'};
            color:${row.boy.kg_level === 'kg2' ? '#166534' : '#1e40af'};
            border:1px solid ${row.boy.kg_level === 'kg2' ? '#86efac' : '#93c5fd'};
            -webkit-print-color-adjust:exact;print-color-adjust:exact">
            ${row.boy.kg_level === 'kg2' ? 'KG2' : 'KG1'}
          </span>
        </td>
        ${statusCells}
        <td style="text-align:center;font-weight:700;color:#0f172a">${row.presentCount}/${row.totalFridaysCount}</td>
        <td style="text-align:center;font-weight:800;color:${rateColor}">${row.attendanceRate.toFixed(0)}%</td>
      </tr>
    `
    })
    .join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>كشف حضور الجمعة — ${monthNameAr} ${year}</title>
      <style>
        ${_arabicFontStyle('A4 landscape')}
        h1 { font-size: 19px; font-weight: 800; color: #0c1b47; }
        h2 { font-size: 12px; font-weight: 700; color: #1e3a8a; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10.5px; }
        th {
          background: #1e3a8a !important; color: #fff !important;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
          padding: 7px 5px; border: 1px solid #1e40af;
          text-align: center; font-weight: 700;
        }
        td { padding: 6px 5px; border: 1px solid #cbd5e1; vertical-align: middle; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .footer {
          margin-top: 20px; padding-top: 12px; border-top: 1px solid #cbd5e1;
          display: flex; justify-content: space-between;
          font-size: 11px; color: #6b7280;
        }
        .legend {
          display: inline-flex; gap: 14px; font-size: 10px;
          margin-top: 8px; color: #374151;
        }
        .legend span { display: inline-flex; align-items: center; gap: 4px; }
      </style>
    </head>
    <body>
      <div class="no-print action-bar">
        <span>كشف حضور الجمعة — ${monthNameAr} ${year}</span>
        <div>
          <button class="action-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
          <button class="close-btn" onclick="window.close()">✕ إغلاق</button>
        </div>
      </div>

      <div style="border-bottom:3px solid #1e3a8a;padding-bottom:14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2>كنيسة الشهيد العظيم مارمرقس — فصل الأمير تادرس</h2>
          <h1>كشف الحضور الأسبوعي — ${monthNameAr} ${year}</h1>
          <div class="legend no-print">
            <span>✓ <strong>حاضر</strong></span>
            <span>✗ <strong>غائب</strong></span>
            <span>م <strong>معذور</strong></span>
          </div>
        </div>
        <div style="text-align:left;font-size:11px;color:#6b7280;line-height:1.7">
          <div><strong>إجمالي الطلبة:</strong> ${rows.length} طفل</div>
          <div><strong>عدد الجمع:</strong> ${fridays.length}</div>
          <div><strong>تاريخ الإصدار:</strong> ${today}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:34px">م</th>
            <th style="text-align:right;padding-right:8px;min-width:120px">اسم الطفل</th>
            <th style="width:50px">المرحلة</th>
            ${fridayCols}
            <th style="width:50px">الحضور</th>
            <th style="width:50px">النسبة</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="footer">
        <span>فصل الأمير تادرس — سجل الحضور الرسمي</span>
        <span>توقيع خادم المرحلة: .......................................</span>
        <span>ختم الخدمة: .......................................</span>
      </div>

      <script>
        setTimeout(function() { window.focus(); window.print(); }, 400);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
  return true
}

// ─── Print-window: Honor Roll ─────────────────────────────────────────────────
export interface PrintHonorRollOptions {
  boys: Array<{
    id: string
    full_name: string
    kg_level: string
    profile_image_url?: string | null
    notes?: string | null
  }>
  academicYear?: string
  monthName?: string
}

export function printHonorRollWindow({
  boys,
  academicYear = '2025-2026 م',
  monthName = '',
}: PrintHonorRollOptions): boolean {
  if (typeof window === 'undefined') return false
  if (isMobileDevice()) return false

  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  const today = new Date().toLocaleDateString('ar-EG')

  const ENCOURAGEMENTS = [
    'أنت نجم فصلنا اللامع! ⭐',
    'بطل حقيقي بكل المقاييس! 🦁',
    'فخر فصل الأمير تادرس! 👑',
    'أنت قدوة لكل زملائك! 🌟',
    'ما شاء الله عليك يا بطل! 🎯',
    'نجاحك يسعدنا كثيراً! 🎉',
    'استمر دايماً كده يا بطل! 🚀',
    'أنت من أفضل أبطالنا! 💪',
    'شطارتك تملأ قلبنا فرحاً! ❤️',
    'ربنا يبارك فيك ويكملك! 🙏',
    'حضورك بهجة وسعادة! ✨',
    'زملائك يفتخرون بيك! 🏅',
  ]

  const CARD_COLORS = [
    { bg: '#ede9fe', border: '#8b5cf6', num: '#7c3aed', text: '#6d28d9', badge: '#ddd6fe' },
    { bg: '#fef3c7', border: '#f59e0b', num: '#d97706', text: '#92400e', badge: '#fde68a' },
    { bg: '#d1fae5', border: '#10b981', num: '#059669', text: '#065f46', badge: '#a7f3d0' },
    { bg: '#fee2e2', border: '#ef4444', num: '#dc2626', text: '#991b1b', badge: '#fecaca' },
    { bg: '#e0f2fe', border: '#0ea5e9', num: '#0284c7', text: '#075985', badge: '#bae6fd' },
    { bg: '#fce7f3', border: '#ec4899', num: '#db2777', text: '#9d174d', badge: '#fbcfe8' },
  ]

  const RANK_EMOJIS = ['🥇', '🥈', '🥉', '🏅', '⭐', '🌟', '✨', '💫', '🎖️', '🏆', '🎗️', '🌈']

  const cards = boys
    .map((b, idx) => {
      const color = CARD_COLORS[idx % CARD_COLORS.length]
      const encouragement = ENCOURAGEMENTS[idx % ENCOURAGEMENTS.length]
      const rankEmoji = RANK_EMOJIS[idx % RANK_EMOJIS.length]

      const photoHtml = b.profile_image_url
        ? `<img src="${b.profile_image_url}" alt="${b.full_name}" style="
            width:80px;height:80px;border-radius:50%;
            object-fit:cover;
            border:3px solid ${color.border};
            display:block;margin:0 auto 8px;
            -webkit-print-color-adjust:exact;print-color-adjust:exact;
          " />`
        : `<div style="
            width:80px;height:80px;border-radius:50%;
            background:linear-gradient(135deg,${color.border},${color.num});
            -webkit-print-color-adjust:exact;print-color-adjust:exact;
            display:flex;align-items:center;justify-content:center;
            margin:0 auto 8px;
            font-size:26px;font-weight:900;color:#fff;
            border:3px solid ${color.border};
          ">${b.full_name.charAt(0)}</div>`

      return `
      <div style="
        background:${color.bg};
        border:2.5px solid ${color.border};
        border-radius:16px;
        padding:12px 10px 10px;
        text-align:center;
        page-break-inside:avoid;
        position:relative;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      ">
        <!-- rank badge -->
        <div style="
          position:absolute;top:8px;right:8px;
          font-size:18px;line-height:1;
        ">${rankEmoji}</div>

        <!-- number badge -->
        <div style="
          position:absolute;top:8px;left:8px;
          width:22px;height:22px;border-radius:50%;
          background:${color.num};
          -webkit-print-color-adjust:exact;print-color-adjust:exact;
          color:#fff;font-size:10px;font-weight:900;
          display:flex;align-items:center;justify-content:center;
        ">${idx + 1}</div>

        <!-- crown -->
        <div style="font-size:20px;margin-bottom:2px;line-height:1">👑</div>

        <!-- photo -->
        ${photoHtml}

        <!-- name -->
        <div style="font-size:12px;font-weight:900;color:#0f172a;margin-bottom:5px;line-height:1.2">${b.full_name}</div>

        <!-- kg badge -->
        <div style="margin-bottom:6px">
          <span style="
            display:inline-block;padding:2px 10px;border-radius:20px;font-size:9px;font-weight:800;
            background:${b.kg_level === 'kg2' ? '#dcfce7' : '#dbeafe'};
            color:${b.kg_level === 'kg2' ? '#166534' : '#1e40af'};
            border:1px solid ${b.kg_level === 'kg2' ? '#86efac' : '#93c5fd'};
            -webkit-print-color-adjust:exact;print-color-adjust:exact;
          ">${b.kg_level === 'kg2' ? 'KG2' : 'KG1'}</span>
        </div>

        <!-- encouragement -->
        <div style="
          background:${color.badge};
          -webkit-print-color-adjust:exact;print-color-adjust:exact;
          border-radius:8px;padding:5px 6px;
          font-size:10px;font-weight:800;color:${color.text};
          line-height:1.3;
        ">${encouragement}</div>
      </div>
    `
    })
    .join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>لوحة شرف أبطال — فصل الأمير تادرس</title>
      <style>
        ${_arabicFontStyle('A4 portrait')}
        body { padding: 6mm; }
        .header-band {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a8a 100%) !important;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
          color: #fff;
          padding: 16px 20px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 14px;
          border: 2px solid #fbbf24;
        }
        .header-band .trophy { font-size: 44px; line-height: 1; margin-bottom: 4px; }
        .header-band h1 { font-size: 22px; font-weight: 900; color: #fbbf24; margin-bottom: 3px; }
        .header-band .sub { font-size: 11px; color: #c7d2fe; }
        .header-band .motto {
          margin-top: 8px;
          background: rgba(251,191,36,0.15);
          border: 1px solid rgba(251,191,36,0.3);
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #fde68a;
          font-style: italic;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .footer {
          border-top: 2px solid #f59e0b;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
          padding-top: 10px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 10px; color: #374151; text-align: center;
          gap: 10px;
        }
        .footer-closing {
          text-align: center;
          font-size: 11px;
          font-weight: 800;
          color: #7c3aed;
          margin-bottom: 8px;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
      </style>
    </head>
    <body>
      <div class="no-print action-bar">
        <span>🏆 لوحة شرف أبطال فصل الأمير تادرس — ${monthName || academicYear}</span>
        <div>
          <button class="action-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
          <button class="close-btn" onclick="window.close()">✕ إغلاق</button>
        </div>
      </div>

      <div class="header-band">
        <div class="trophy">🏆</div>
        <h1>أبطال ونجوم فصلنا 🌟</h1>
        <p class="sub">لوحة شرف أطفال فصل الأمير تادرس · كنيسة مارمرقس · ${monthName ? monthName + ' · ' : ''}العام ${academicYear}</p>
        <p class="sub">${boys.length} بطل متميز · تاريخ الإصدار: ${today}</p>
        <div class="motto">✨ «إيه أحلى من ولاد ملتزمين ومحبوبين وفرحانين!» ✨</div>
      </div>

      <div class="grid">${cards}</div>

      <div class="footer-closing">
        🌈 أحبائنا الأبطال — استمروا في التميز والالتزام وربنا يكملكم بالخير! 🌈
      </div>

      <div class="footer">
        <div>
          <div style="margin-bottom:4px;font-weight:700">توقيع مسؤول المرحلة</div>
          <div style="font-family:monospace;color:#9ca3af">................................................</div>
        </div>
        <div style="text-align:center">
          <div style="width:52px;height:52px;border:2px dashed #f59e0b;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:8px;color:#d97706;-webkit-print-color-adjust:exact;print-color-adjust:exact">ختم<br>الإدارة</div>
        </div>
        <div>
          <div style="margin-bottom:4px;font-weight:700">اعتماد المشرف العام</div>
          <div style="font-family:monospace;color:#9ca3af">................................................</div>
        </div>
      </div>

      <script>
        setTimeout(function() { window.focus(); window.print(); }, 500);
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
  return true
}
