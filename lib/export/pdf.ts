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
 * Sanitizes modern CSS color functions (oklab, oklch, lab) in cloned DOM to valid sRGB
 * to ensure 100% compatibility with html2canvas and html2pdf without parser errors.
 */
function sanitizeColorsForHtml2Canvas(clonedDoc: Document, targetEl: HTMLElement | null) {
  try {
    const defaultView = clonedDoc.defaultView || window
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const colorCache = new Map<string, string>()

    const cssColorToRgba = (colorStr: string): string => {
      if (!ctx || !colorStr) return 'rgba(0,0,0,0)'
      const cached = colorCache.get(colorStr)
      if (cached) return cached

      try {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = '#00000000'
        ctx.fillStyle = colorStr
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        const alpha = Number((a / 255).toFixed(3))
        const res = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
        colorCache.set(colorStr, res)
        return res
      } catch {
        return 'rgba(0,0,0,0)'
      }
    }

    const MODERN_COLOR_REGEX = /(?:oklab|oklch|lab)\([^)]+\)/gi

    const sanitizeCssString = (val: string): string => {
      if (!val || typeof val !== 'string') return val
      if (!MODERN_COLOR_REGEX.test(val)) return val
      MODERN_COLOR_REGEX.lastIndex = 0
      return val.replace(MODERN_COLOR_REGEX, (match) => cssColorToRgba(match))
    }

    // Proxy defaultView.getComputedStyle so any computed access by html2canvas returns standard sRGB
    if (defaultView && defaultView.getComputedStyle) {
      const rawGetComputedStyle = defaultView.getComputedStyle.bind(defaultView)
      defaultView.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
        const declaration = rawGetComputedStyle(elt, pseudoElt)
        return new Proxy(declaration, {
          get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver)
            if (typeof value === 'string' && /(oklab|oklch|lab)/i.test(value)) {
              return sanitizeCssString(value)
            }
            if (prop === 'getPropertyValue') {
              return (propName: string) => {
                const rawVal = target.getPropertyValue(propName)
                if (typeof rawVal === 'string' && /(oklab|oklch|lab)/i.test(rawVal)) {
                  return sanitizeCssString(rawVal)
                }
                return rawVal
              }
            }
            return typeof value === 'function' ? value.bind(target) : value
          },
        })
      }
    }

    // Also sanitize inline styles on all elements in cloned target
    if (targetEl) {
      const allElements = [targetEl, ...Array.from(targetEl.querySelectorAll('*'))]
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

      for (const el of allElements) {
        const htmlEl = el as HTMLElement
        if (!htmlEl.style) continue
        const comp = defaultView.getComputedStyle(el)
        if (!comp) continue

        for (const prop of COLOR_PROPS) {
          const val = comp[prop]
          if (val && /(oklab|oklch|lab)/i.test(val)) {
            const sanitized = sanitizeCssString(val)
            const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
            htmlEl.style.setProperty(cssProp, sanitized, 'important')
          }
        }

        const bs = comp.boxShadow
        if (bs && /(oklab|oklch|lab)/i.test(bs)) {
          htmlEl.style.setProperty('box-shadow', sanitizeCssString(bs), 'important')
        }

        const ts = comp.textShadow
        if (ts && /(oklab|oklch|lab)/i.test(ts)) {
          htmlEl.style.setProperty('text-shadow', sanitizeCssString(ts), 'important')
        }
      }
    }

    // Inject fallback stylesheet in clonedDoc to prevent any uncaught CSS variables with oklab/oklch
    const styleEl = clonedDoc.createElement('style')
    styleEl.innerHTML = `
      *, *::before, *::after {
        --tw-shadow-color: rgba(0, 0, 0, 0.08) !important;
      }
    `
    clonedDoc.head?.appendChild(styleEl)
  } catch (e) {
    console.warn('sanitizeColorsForHtml2Canvas warning:', e)
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

  // If element is hidden (e.g., hidden print:block), temporarily show it for rendering
  const wasHidden = element.classList.contains('hidden')
  if (wasHidden) {
    element.classList.remove('hidden')
    element.style.display = 'block'
  }

  // Intercept any unhandled color errors from html2canvas logger
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('unsupported color function')) {
      return
    }
    originalConsoleError.apply(console, args)
  }

  try {
    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = (html2pdfModule as any).default || html2pdfModule

    const opt = {
      margin,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document, clonedEl?: HTMLElement) => {
          const targetEl =
            clonedEl ||
            (typeof elementOrId === 'string'
              ? clonedDoc.getElementById(elementOrId)
              : null)
          sanitizeColorsForHtml2Canvas(clonedDoc, targetEl)
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
    console.error('downloadElementAsPdf error:', err)
    return false
  } finally {
    console.error = originalConsoleError
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

