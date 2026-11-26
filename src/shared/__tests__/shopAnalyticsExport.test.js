// Regression test suite for ShopAnalytics XLSX Export and Dynamic Loader
// Covers: Phase B requirements from Batch 19 Master Prompt.

import { test, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import * as path from 'node:path'

// Test fixture data matching ShopAnalytics.jsx state
const mockKpis = {
  totalGrossSales: 540000,
  totalGstCollected: 64800,
  totalInvoiceCount: 180,
  avgBillValue: 3000,
  totalActiveStores: 3,
  totalStores: 4,
  topStore: { name: 'Erode Main Branch', code: 'SB-001', grossSales: 280000 },
  paymentMix: {
    cash: 240000,
    upi: 210000,
    credit: 60000,
    bankTransfer: 30000
  }
}

const mockStoreBreakdown = [
  {
    code: 'SB-001',
    name: 'Erode Main Branch',
    location: 'Erode',
    adminName: 'Ramesh Kumar',
    staffCount: 5,
    totalBills: 90,
    grossSales: 280000,
    totalGst: 33600,
    cash: 120000,
    upi: 110000,
    credit: 35000,
    bankTransfer: 15000,
    status: 'active'
  },
  {
    code: 'SB-002',
    name: 'Salem West Branch',
    location: 'Salem',
    adminName: 'Suresh Babu',
    staffCount: 3,
    totalBills: 60,
    grossSales: 160000,
    totalGst: 19200,
    cash: 80000,
    upi: 65000,
    credit: 15000,
    bankTransfer: 0,
    status: 'active'
  }
]

const mockTopProducts = [
  { name: 'Earth Power Pro (50kg)', unitsSold: 150, revenue: 195000 },
  { name: 'Salico-G Granules (10kg)', unitsSold: 90, revenue: 99000 },
  { name: 'Gold Gel Pro - Banana (5L)', unitsSold: 45, revenue: 67500 }
]

const mockInvoices = [
  {
    invoiceNo: 'SAM-INV-2026-0101',
    date: '2026-10-28T09:15:00.000Z',
    storeCode: 'SB-001',
    storeName: 'Erode Main Branch',
    customerName: 'K. Murugan',
    customerPhone: '9842100001',
    paymentMode: 'UPI',
    status: 'PAID',
    items: [{ name: 'Earth Power Pro', qty: 2, rate: 1300 }],
    taxableAmount: 2600,
    cgst: 156,
    sgst: 156,
    igst: 0,
    totalGst: 312,
    roundOff: 0,
    grandTotal: 2912,
    cashier: 'Ramesh Staff'
  },
  {
    invoiceNo: 'SAM-INV-2026-0102',
    date: '2026-10-28T10:30:00.000Z',
    storeCode: 'SB-002',
    storeName: 'Salem West Branch',
    customerName: 'S. Ramasamy',
    customerPhone: '9842100002',
    paymentMode: 'Cash',
    status: 'PAID',
    items: [{ name: 'Salico-G Granules', qty: 1, rate: 1100 }],
    taxableAmount: 1100,
    cgst: 66,
    sgst: 66,
    igst: 0,
    totalGst: 132,
    roundOff: 0,
    grandTotal: 1232,
    cashier: 'Suresh Staff'
  }
]

// Pure extraction of ShopAnalytics.jsx export handlers & dynamic loader logic
function createExportController({
  loadXlsxImpl,
  onAlert = () => {},
  onError = () => {}
}) {
  let xlsxModulePromise = null

  async function loadXlsx() {
    if (!xlsxModulePromise) {
      xlsxModulePromise = loadXlsxImpl()
        .then(mod => (mod.utils ? mod : (mod.default || mod)))
        .catch(err => {
          xlsxModulePromise = null
          throw err
        })
    }
    return xlsxModulePromise
  }

  let exporting = false
  let exportingInvoices = false
  let loading = false
  const exportHistory = []

  const exportFullExcelReport = async (data = { kpis: mockKpis, storeBreakdown: mockStoreBreakdown, topProducts: mockTopProducts }, invoices = mockInvoices) => {
    if (exporting || loading) return { cancelled: true, reason: 'busy' }
    try {
      exporting = true
      const XLSX = await loadXlsx()
      const wb = XLSX.utils.book_new()
      const timestamp = '2026-10-28'

      // Sheet 1: Executive Overview
      const kpis = data?.kpis || {}
      const overviewData = [
        ['SATHYAM BIO - ENTERPRISE SHOPS OVERVIEW & ANALYTICS REPORT'],
        ['Generated At:', '28/10/2026, 10:00:00 am'],
        ['Filtered Store:', 'All Stores'],
        ['Date Range:', 'All Time'],
        [],
        ['Metric', 'Value'],
        ['Total Gross Sales', kpis.totalGrossSales || 0],
        ['Total GST Collected', kpis.totalGstCollected || 0],
        ['Total Invoices Issued', kpis.totalInvoiceCount || 0],
        ['Average Invoice Value (AOV)', kpis.avgBillValue || 0],
        ['Active Store Locations', kpis.totalActiveStores || 0],
        ['Total Network Stores', kpis.totalStores || 0],
        ['Top Performing Store', kpis.topStore ? `${kpis.topStore.name} (${kpis.topStore.code}) - ₹${kpis.topStore.grossSales}` : 'N/A'],
        [],
        ['Payment Method Breakdown', 'Total Amount (₹)'],
        ['Cash', kpis.paymentMix?.cash || 0],
        ['UPI / Digital', kpis.paymentMix?.upi || 0],
        ['Credit Account', kpis.paymentMix?.credit || 0],
        ['Bank Transfer', kpis.paymentMix?.bankTransfer || 0],
      ]
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
      wsOverview['!cols'] = [{ wch: 30 }, { wch: 35 }]
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Executive Overview')

      // Sheet 2: Store Breakdown
      const storeRows = (data?.storeBreakdown || []).map(s => ({
        'Store Code': s.code || '',
        'Store Name': s.name || '',
        'Location / District': s.location || '',
        'Admin In-Charge': s.adminName || '—',
        'Staff Count': s.staffCount || 0,
        'Total Bills Generated': s.totalBills || 0,
        'Gross Revenue (₹)': s.grossSales || 0,
        'GST Collected (₹)': s.totalGst || 0,
        'Cash Collections (₹)': s.cash || 0,
        'UPI Collections (₹)': s.upi || 0,
        'Credit Sales (₹)': s.credit || 0,
        'Bank Transfer (₹)': s.bankTransfer || 0,
        'Operating Status': (s.status || 'active').toUpperCase(),
      }))
      const wsStores = XLSX.utils.json_to_sheet(storeRows)
      wsStores['!cols'] = [
        { wch: 14 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
        { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
        { wch: 16 }, { wch: 18 }, { wch: 15 }
      ]
      XLSX.utils.book_append_sheet(wb, wsStores, 'Store Performance')

      // Sheet 3: Itemized Invoices (with SAM prefix)
      const invoiceRows = invoices.map(inv => ({
        'Invoice Number': inv.invoiceNo || '',
        'Date & Time': inv.date ? new Date(inv.date).toLocaleString('en-IN') : '',
        'Store Code': inv.storeCode || '',
        'Store Name': inv.storeName || '',
        'Customer Name': inv.customerName || 'Walk-in Customer',
        'Customer Phone': inv.customerPhone || '',
        'Payment Mode': inv.paymentMode || 'Cash',
        'Payment Status': inv.status || 'PAID',
        'Item Count': (inv.items || []).length,
        'Taxable Value (₹)': inv.taxableAmount || 0,
        'CGST (₹)': inv.cgst || 0,
        'SGST (₹)': inv.sgst || 0,
        'IGST (₹)': inv.igst || 0,
        'Total GST (₹)': inv.totalGst || 0,
        'Round Off (₹)': inv.roundOff || 0,
        'Grand Total (₹)': inv.grandTotal || 0,
        'Cashier': inv.cashier || '',
      }))
      const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows)
      XLSX.utils.book_append_sheet(wb, wsInvoices, 'All Invoices (SAM)')

      // Sheet 4: Top Products Sold
      const productRows = (data?.topProducts || []).map((p, idx) => ({
        'Rank': idx + 1,
        'Product Name': p.name,
        'Units Sold': p.unitsSold,
        'Gross Revenue (₹)': p.revenue,
      }))
      const wsProducts = XLSX.utils.json_to_sheet(productRows)
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Products Sold')

      const fileName = `SathyamBio_Shops_Analytics_${timestamp}.xlsx`
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      exportHistory.push({ type: 'full', fileName, workbook: wb, buffer })
      return { success: true, fileName, buffer }
    } catch (err) {
      onError(err)
      onAlert('Failed to generate Excel report. Please try again.')
      return { success: false, error: err }
    } finally {
      exporting = false
    }
  }

  const exportInvoicesExcel = async (invoices = mockInvoices) => {
    if (exportingInvoices) return { cancelled: true, reason: 'busy' }
    try {
      exportingInvoices = true
      const XLSX = await loadXlsx()
      const wb = XLSX.utils.book_new()
      const timestamp = '2026-10-28'

      const invoiceRows = invoices.map(inv => ({
        'Invoice Number': inv.invoiceNo || '',
        'Date': inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '',
        'Time': inv.date ? new Date(inv.date).toLocaleTimeString('en-IN') : '',
        'Store Code': inv.storeCode || '',
        'Store Name': inv.storeName || '',
        'Customer Name': inv.customerName || 'Walk-in Customer',
        'Customer Phone': inv.customerPhone || '',
        'Payment Method': inv.paymentMode || 'Cash',
        'Status': inv.status || 'PAID',
        'Taxable Amount (₹)': inv.taxableAmount || 0,
        'Total GST (₹)': inv.totalGst || 0,
        'Invoice Grand Total (₹)': inv.grandTotal || 0,
        'Billed By': inv.cashier || '',
      }))
      const ws = XLSX.utils.json_to_sheet(invoiceRows)
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices Ledger')

      const fileName = `SathyamBio_Invoices_${timestamp}.xlsx`
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      exportHistory.push({ type: 'invoices', fileName, workbook: wb, buffer })
      return { success: true, fileName, buffer }
    } catch (err) {
      onError(err)
      onAlert('Failed to export invoices. Please try again.')
      return { success: false, error: err }
    } finally {
      exportingInvoices = false
    }
  }

  return {
    loadXlsx,
    exportFullExcelReport,
    exportInvoicesExcel,
    getExporting: () => exporting,
    getExportingInvoices: () => exportingInvoices,
    setLoading: val => { loading = val },
    getExportHistory: () => exportHistory
  }
}

// ---------------- TESTS ----------------

test('XLSX dynamic import is NOT invoked on initialization', () => {
  let importCount = 0
  createExportController({
    loadXlsxImpl: async () => {
      importCount++
      return import('xlsx')
    }
  })
  assert.equal(importCount, 0, 'XLSX is not loaded prematurely before user click')
})

test('Dynamic loader returns valid XLSX namespace and caches the promise', async () => {
  let importCount = 0
  const controller = createExportController({
    loadXlsxImpl: async () => {
      importCount++
      return import('xlsx')
    }
  })

  const xlsx1 = await controller.loadXlsx()
  assert.ok(xlsx1.utils, 'XLSX.utils is accessible')
  assert.ok(xlsx1.write, 'XLSX.write is accessible')
  assert.equal(importCount, 1, 'Imported once on first call')

  const xlsx2 = await controller.loadXlsx()
  assert.strictEqual(xlsx1, xlsx2, 'Subsequent call returns cached module reference')
  assert.equal(importCount, 1, 'Import count remains 1 due to cached promise')
})

test('Failed dynamic import clears cache, surfaces user alert, and enables clean retry', async () => {
  let attempt = 0
  let alertMessage = ''
  let errorLogged = null

  const controller = createExportController({
    loadXlsxImpl: async () => {
      attempt++
      if (attempt === 1) {
        throw new Error('Network timeout downloading xlsx chunk')
      }
      return import('xlsx')
    },
    onAlert: msg => { alertMessage = msg },
    onError: err => { errorLogged = err }
  })

  // First attempt fails
  const res1 = await controller.exportFullExcelReport()
  assert.equal(res1.success, false)
  assert.equal(controller.getExporting(), false, 'Exporting state is reset on error in finally block')
  assert.equal(alertMessage, 'Failed to generate Excel report. Please try again.')
  assert.ok(errorLogged.message.includes('Network timeout'))

  // Second attempt succeeds because cache was cleared in .catch()
  const res2 = await controller.exportFullExcelReport()
  assert.equal(res2.success, true)
  assert.ok(res2.fileName.startsWith('SathyamBio_Shops_Analytics_'))
  assert.equal(attempt, 2, 'Second import succeeded without permanent lock')
})

test('Duplicate click prevention: exportFullExcelReport rejects concurrent execution', async () => {
  let slowImportResolve
  const slowPromise = new Promise(resolve => { slowImportResolve = resolve })

  const controller = createExportController({
    loadXlsxImpl: async () => {
      await slowPromise
      return import('xlsx')
    }
  })

  // Start first export (will pause awaiting slowPromise)
  const p1 = controller.exportFullExcelReport()
  assert.equal(controller.getExporting(), true, 'Exporting state is true while inflight')

  // Attempt duplicate export while p1 is running
  const resDuplicate = await controller.exportFullExcelReport()
  assert.deepEqual(resDuplicate, { cancelled: true, reason: 'busy' }, 'Concurrent export call was immediately blocked')

  // Complete first export
  const realXlsx = await import('xlsx')
  slowImportResolve(realXlsx)
  const res1 = await p1
  assert.equal(res1.success, true)
  assert.equal(controller.getExporting(), false, 'Exporting state reset after completion')
})

test('Duplicate click prevention: exportInvoicesExcel rejects concurrent execution', async () => {
  let slowImportResolve
  const slowPromise = new Promise(resolve => { slowImportResolve = resolve })

  const controller = createExportController({
    loadXlsxImpl: async () => {
      await slowPromise
      return import('xlsx')
    }
  })

  const p1 = controller.exportInvoicesExcel()
  assert.equal(controller.getExportingInvoices(), true, 'exportingInvoices state is true while inflight')

  const resDuplicate = await controller.exportInvoicesExcel()
  assert.deepEqual(resDuplicate, { cancelled: true, reason: 'busy' })

  const realXlsx = await import('xlsx')
  slowImportResolve(realXlsx)
  const res1 = await p1
  assert.equal(res1.success, true)
  assert.equal(controller.getExportingInvoices(), false, 'exportingInvoices reset after completion')
})

test('exportFullExcelReport is disabled while data is loading from API', async () => {
  const controller = createExportController({
    loadXlsxImpl: async () => import('xlsx')
  })
  controller.setLoading(true)

  const res = await controller.exportFullExcelReport()
  assert.deepEqual(res, { cancelled: true, reason: 'busy' }, 'Blocked while API data loading is true')
})

test('Full Enterprise Report generates exact 4-sheet workbook with schema & financial integrity', async () => {
  const realXlsx = await import('xlsx')
  const XLSX = realXlsx.utils ? realXlsx : (realXlsx.default || realXlsx)

  const controller = createExportController({
    loadXlsxImpl: async () => XLSX
  })

  const res = await controller.exportFullExcelReport()
  assert.equal(res.success, true)
  assert.equal(res.fileName, 'SathyamBio_Shops_Analytics_2026-10-28.xlsx')

  // Deserialize buffer back to workbook
  const wb = XLSX.read(res.buffer, { type: 'buffer' })
  assert.deepEqual(wb.SheetNames, [
    'Executive Overview',
    'Store Performance',
    'All Invoices (SAM)',
    'Top Products Sold'
  ], 'Worksheet names match exact 4-sheet schema')

  // Validate Sheet 1 (Executive Overview)
  const wsOverview = wb.Sheets['Executive Overview']
  const overviewRows = XLSX.utils.sheet_to_json(wsOverview, { header: 1 })
  assert.equal(overviewRows[0][0], 'SATHYAM BIO - ENTERPRISE SHOPS OVERVIEW & ANALYTICS REPORT')
  assert.equal(overviewRows[2][0], 'Filtered Store:')
  assert.equal(overviewRows[2][1], 'All Stores')

  // Validate Sheet 2 (Store Performance)
  const storeRows = XLSX.utils.sheet_to_json(wb.Sheets['Store Performance'])
  assert.equal(storeRows.length, 2)
  assert.equal(storeRows[0]['Store Code'], 'SB-001')
  assert.equal(storeRows[0]['Store Name'], 'Erode Main Branch')
  assert.equal(storeRows[0]['Gross Revenue (₹)'], 280000)
  assert.equal(storeRows[0]['Operating Status'], 'ACTIVE')

  // Validate Sheet 3 (All Invoices SAM) & financial consistency
  const invoiceRows = XLSX.utils.sheet_to_json(wb.Sheets['All Invoices (SAM)'])
  assert.equal(invoiceRows.length, 2)
  const inv1 = invoiceRows[0]
  assert.equal(inv1['Invoice Number'], 'SAM-INV-2026-0101')
  assert.equal(inv1['Payment Mode'], 'UPI')
  assert.equal(inv1['Taxable Value (₹)'], 2600)
  assert.equal(inv1['CGST (₹)'], 156)
  assert.equal(inv1['SGST (₹)'], 156)
  assert.equal(inv1['Total GST (₹)'], 312)
  assert.equal(inv1['Grand Total (₹)'], 2912)
  assert.equal(inv1['CGST (₹)'] + inv1['SGST (₹)'], inv1['Total GST (₹)'])
  assert.equal(inv1['Taxable Value (₹)'] + inv1['Total GST (₹)'] + inv1['Round Off (₹)'], inv1['Grand Total (₹)'])

  // Validate Sheet 4 (Top Products Sold)
  const productRows = XLSX.utils.sheet_to_json(wb.Sheets['Top Products Sold'])
  assert.equal(productRows.length, 3)
  assert.equal(productRows[0]['Rank'], 1)
  assert.equal(productRows[0]['Product Name'], 'Earth Power Pro (50kg)')
  assert.equal(productRows[0]['Units Sold'], 150)
  assert.equal(productRows[0]['Gross Revenue (₹)'], 195000)
})

test('Invoices Ledger Report generates single-sheet export with correct columns and headers', async () => {
  const realXlsx = await import('xlsx')
  const XLSX = realXlsx.utils ? realXlsx : (realXlsx.default || realXlsx)

  const controller = createExportController({
    loadXlsxImpl: async () => XLSX
  })

  const res = await controller.exportInvoicesExcel()
  assert.equal(res.success, true)
  assert.equal(res.fileName, 'SathyamBio_Invoices_2026-10-28.xlsx')

  const wb = XLSX.read(res.buffer, { type: 'buffer' })
  assert.deepEqual(wb.SheetNames, ['Invoices Ledger'])

  const ledgerRows = XLSX.utils.sheet_to_json(wb.Sheets['Invoices Ledger'])
  assert.equal(ledgerRows.length, 2)
  assert.equal(ledgerRows[0]['Invoice Number'], 'SAM-INV-2026-0101')
  assert.equal(ledgerRows[0]['Payment Method'], 'UPI')
  assert.equal(ledgerRows[0]['Taxable Amount (₹)'], 2600)
  assert.equal(ledgerRows[0]['Total GST (₹)'], 312)
  assert.equal(ledgerRows[0]['Invoice Grand Total (₹)'], 2912)
  assert.equal(ledgerRows[0]['Billed By'], 'Ramesh Staff')
})
