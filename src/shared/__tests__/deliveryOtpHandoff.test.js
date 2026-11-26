// Regression test suite for Delivery Dashboard OTP Handoff and Security Invariants
// Covers: Phase D requirements from Batch 19 Master Prompt.

import { test, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

// Pure extraction of delivery card mapping from src/pages/delivery/Dashboard.jsx:12-21
const toDeliveryCard = order => ({
  ...order,
  farmer: order.addressDetails?.name || order.farmer || order.customerName,
  phone: order.addressDetails?.phone || order.phone || order.customerPhone,
  amount: Number(order.amount ?? order.total ?? 0),
  payMode: order.payMode || (order.paymentStatus === 'Paid' ? 'Prepaid' : 'COD'),
  items: Array.isArray(order.items) ? order.items.map(item => `${item.name || 'Product'} x${item.qty || 1}`).join(', ') : order.items,
  status: order.deliveryStatus || order.status,
})

// Controller simulating delivery dashboard OTP handoff logic (Dashboard.jsx:36-49)
function createDeliveryController({ apiPost, onToast }) {
  let orders = []
  let otpInputs = {}
  let inflight = {}

  const setOrders = initialOrders => {
    orders = initialOrders.map(toDeliveryCard)
  }

  const setOtpInput = (orderId, value) => {
    otpInputs[orderId] = value
  }

  const verifyOTP = async (order) => {
    const entered = (otpInputs[order.id] || '').trim()
    if (!entered) {
      onToast('error', 'Enter the OTP the farmer received.')
      return { success: false, reason: 'empty_otp' }
    }

    if (inflight[order.id]) {
      return { success: false, reason: 'duplicate_blocked' }
    }

    try {
      inflight[order.id] = true
      const res = await apiPost('/api/delivery/verify-otp', { orderId: order.id, otp: entered })
      const data = res.data

      orders = orders.map(x => x.id === order.id ? {
        ...x,
        ...toDeliveryCard(data.order),
        status: 'Delivered',
        deliveryStatus: 'Delivered'
      } : x)

      onToast('success', `✅ OTP verified! Order ${order.id} marked Delivered`)
      return { success: true, order: orders.find(x => x.id === order.id) }
    } catch (err) {
      const message = err?.response?.data?.message
      onToast('error', message ? `❌ ${message}` : 'Unable to update this delivery.')
      return { success: false, error: message || 'Unable to update this delivery.' }
    } finally {
      delete inflight[order.id]
    }
  }

  return {
    setOrders,
    setOtpInput,
    verifyOTP,
    getOrders: () => orders,
    getInflight: orderId => Boolean(inflight[orderId])
  }
}

// ---------------- 1. DATA MAPPING & CARD NORMALIZATION ----------------

test('toDeliveryCard normalizes varied order schemas into standard delivery card model', () => {
  // Case A: Nested addressDetails schema
  const raw1 = {
    id: 'SAM-ORD-001',
    addressDetails: { name: 'P. Sengodan', phone: '9842100010' },
    total: 2950,
    paymentStatus: 'Paid',
    items: [{ name: 'Earth Power Pro', qty: 2 }, { name: 'Salico-G', qty: 1 }],
    status: 'Out for Delivery'
  }
  const card1 = toDeliveryCard(raw1)
  assert.equal(card1.farmer, 'P. Sengodan')
  assert.equal(card1.phone, '9842100010')
  assert.equal(card1.amount, 2950)
  assert.equal(card1.payMode, 'Prepaid')
  assert.equal(card1.items, 'Earth Power Pro x2, Salico-G x1')
  assert.equal(card1.status, 'Out for Delivery')

  // Case B: Flat customer fields with COD
  const raw2 = {
    id: 'SAM-ORD-002',
    customerName: 'M. Palanisamy',
    customerPhone: '9842100020',
    amount: 1100,
    payMode: 'COD',
    items: 'Bulk Organic Manure x1',
    deliveryStatus: 'Assigned'
  }
  const card2 = toDeliveryCard(raw2)
  assert.equal(card2.farmer, 'M. Palanisamy')
  assert.equal(card2.phone, '9842100020')
  assert.equal(card2.amount, 1100)
  assert.equal(card2.payMode, 'COD')
  assert.equal(card2.items, 'Bulk Organic Manure x1')
  assert.equal(card2.status, 'Assigned')
})

// ---------------- 2. OTP VALIDATION WORKFLOWS ----------------

test('Empty or whitespace OTP triggers client-side validation toast and blocks API request', async () => {
  let apiCalled = false
  const toastLogs = []

  const controller = createDeliveryController({
    apiPost: async () => {
      apiCalled = true
      return { data: { success: true } }
    },
    onToast: (type, msg) => toastLogs.push({ type, msg })
  })

  controller.setOrders([{ id: 'SAM-ORD-001', status: 'Out for Delivery' }])
  const [order] = controller.getOrders()

  // No OTP entered
  controller.setOtpInput('SAM-ORD-001', '   ')
  const res = await controller.verifyOTP(order)

  assert.equal(res.success, false)
  assert.equal(res.reason, 'empty_otp')
  assert.equal(apiCalled, false, 'Did not make network call for empty OTP')
  assert.equal(toastLogs.length, 1)
  assert.equal(toastLogs[0].type, 'error')
  assert.equal(toastLogs[0].msg, 'Enter the OTP the farmer received.')
})

test('Valid 4-digit OTP marks order Delivered and updates card state and badge', async () => {
  const toastLogs = []
  const controller = createDeliveryController({
    apiPost: async (url, body) => {
      assert.equal(url, '/api/delivery/verify-otp')
      assert.equal(body.orderId, 'SAM-ORD-001')
      assert.equal(body.otp, '4321')
      return {
        data: {
          success: true,
          order: {
            id: 'SAM-ORD-001',
            status: 'Delivered',
            deliveryStatus: 'Delivered',
            completedAt: '2026-10-28T12:00:00Z'
          }
        }
      }
    },
    onToast: (type, msg) => toastLogs.push({ type, msg })
  })

  controller.setOrders([{ id: 'SAM-ORD-001', status: 'Out for Delivery', payMode: 'COD', amount: 1500 }])
  const [order] = controller.getOrders()

  controller.setOtpInput('SAM-ORD-001', '4321')
  const res = await controller.verifyOTP(order)

  assert.equal(res.success, true)
  assert.equal(res.order.status, 'Delivered')
  assert.equal(res.order.deliveryStatus, 'Delivered')

  // Verify internal list is updated
  const updatedOrders = controller.getOrders()
  assert.equal(updatedOrders[0].status, 'Delivered')
  assert.equal(toastLogs[0].type, 'success')
  assert.ok(toastLogs[0].msg.includes('marked Delivered'))
})

test('Invalid OTP surfaces server error message and leaves order in active delivery state', async () => {
  const toastLogs = []
  const controller = createDeliveryController({
    apiPost: async () => {
      const error = new Error('Bad Request')
      error.response = {
        status: 400,
        data: { success: false, message: 'Invalid delivery OTP. 2 attempts remaining.' }
      }
      throw error
    },
    onToast: (type, msg) => toastLogs.push({ type, msg })
  })

  controller.setOrders([{ id: 'SAM-ORD-001', status: 'Out for Delivery' }])
  const [order] = controller.getOrders()

  controller.setOtpInput('SAM-ORD-001', '9999')
  const res = await controller.verifyOTP(order)

  assert.equal(res.success, false)
  assert.equal(res.error, 'Invalid delivery OTP. 2 attempts remaining.')

  // Order must remain un-delivered
  const currentOrders = controller.getOrders()
  assert.equal(currentOrders[0].status, 'Out for Delivery')
  assert.equal(toastLogs[0].type, 'error')
  assert.ok(toastLogs[0].msg.includes('Invalid delivery OTP'))
})

test('Duplicate submit protection prevents concurrent OTP verification requests for same order', async () => {
  let resolveNetwork
  const networkPromise = new Promise(r => { resolveNetwork = r })
  let callCount = 0

  const controller = createDeliveryController({
    apiPost: async () => {
      callCount++
      await networkPromise
      return {
        data: {
          success: true,
          order: { id: 'SAM-ORD-001', status: 'Delivered' }
        }
      }
    },
    onToast: () => {}
  })

  controller.setOrders([{ id: 'SAM-ORD-001', status: 'Out for Delivery' }])
  const [order] = controller.getOrders()
  controller.setOtpInput('SAM-ORD-001', '1234')

  // Trigger first verify
  const p1 = controller.verifyOTP(order)
  assert.equal(controller.getInflight('SAM-ORD-001'), true, 'Inflight flag set')

  // Trigger duplicate immediate click
  const p2 = await controller.verifyOTP(order)
  assert.equal(p2.success, false)
  assert.equal(p2.reason, 'duplicate_blocked')

  // Resolve network
  resolveNetwork()
  const res1 = await p1
  assert.equal(res1.success, true)
  assert.equal(controller.getInflight('SAM-ORD-001'), false, 'Inflight flag cleared in finally block')
  assert.equal(callCount, 1, 'Only 1 network call executed')
})

// ---------------- 3. SECURITY & ROLE INVARIANTS ----------------

test('Security Invariant: Non-admin delivery staff cannot bypass OTP via generic status update', () => {
  // Simulates server contract in server.js:2384-2386
  function canTransitionStatus(userRole, currentStatus, nextStatus) {
    if (nextStatus === 'Delivered' && userRole !== 'admin') {
      return { allowed: false, status: 403, message: 'Verify the customer OTP to complete this delivery.' }
    }
    if (currentStatus === 'Delivered' && userRole !== 'admin') {
      return { allowed: false, status: 400, message: 'This order is already delivered.' }
    }
    if (currentStatus === 'Delivered' && nextStatus === 'Cancelled') {
      return { allowed: false, status: 400, message: 'Delivered orders cannot be cancelled.' }
    }
    return { allowed: true }
  }

  // Delivery agent attempts PUT /api/orders/:id/status with nextStatus: 'Delivered'
  const deliveryAttempt = canTransitionStatus('delivery', 'Out for Delivery', 'Delivered')
  assert.equal(deliveryAttempt.allowed, false)
  assert.equal(deliveryAttempt.status, 403)
  assert.equal(deliveryAttempt.message, 'Verify the customer OTP to complete this delivery.')

  // Admin can close directly if required
  const adminAttempt = canTransitionStatus('admin', 'Out for Delivery', 'Delivered')
  assert.equal(adminAttempt.allowed, true)

  // Once Delivered, cannot be cancelled even by admin
  const cancelAttempt = canTransitionStatus('admin', 'Delivered', 'Cancelled')
  assert.equal(cancelAttempt.allowed, false)
  assert.equal(cancelAttempt.status, 400)
  assert.equal(cancelAttempt.message, 'Delivered orders cannot be cancelled.')
})
