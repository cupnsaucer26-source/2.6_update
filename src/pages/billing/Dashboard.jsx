import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import {
  Check,
  Percent,
  CreditCard,
  Package,
  Printer,
  Eye,
  Plus,
  Building
  , Banknote, Smartphone, Landmark, Search as SearchIcon, AlertTriangle, ReceiptText, WalletCards
} from 'lucide-react'
import ExactGstInvoice from '../../components/billing/ExactGstInvoice'
import { calculateBillingSummary } from '../../shared/billingSummary'
import AddItemCard from './components/AddItemCard'
import PaymentModeCard from './components/PaymentModeCard'
import DocumentMetaCard from './components/DocumentMetaCard'
import BuyerConsigneeCard from './components/BuyerConsigneeCard'
import TransportDetailsCard from './components/TransportDetailsCard'
import BillItemsCard from './components/BillItemsCard'
import RecentInvoicesCard from './components/RecentInvoicesCard'
import BillingStatsCard from './components/BillingStatsCard'
import BillSummaryCard from './components/BillSummaryCard'
import { computeTodayStats } from '../../shared/billingInvoices'

export default function BillingDashboard() {
  // Catalog & Inventory
  const [catalog, setCatalog] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productSearch, setProductSearch] = useState('')

  // Item Addition Form
  const [itemQty, setItemQty] = useState(1)
  const [itemRate, setItemRate] = useState('')
  const [itemUnit, setItemUnit] = useState('Nos')
  const [itemBatch, setItemBatch] = useState('Primary Batch')
  const [itemHsn, setItemHsn] = useState('31010099')
  const [itemGstRate, setItemGstRate] = useState(18)
  const [itemDiscPercent, setItemDiscPercent] = useState(0)

  // Current Bill Items
  const [items, setItems] = useState([])

  // Document Details
  const [documentType, setDocumentType] = useState('TAX INVOICE')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [ackNo, setAckNo] = useState('')
  const [ackDate, setAckDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
  })
  const [irn, setIrn] = useState('')

  // Buyer (Bill To) Details
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerCityState, setBuyerCityState] = useState('')
  const [buyerPincode, setBuyerPincode] = useState('')
  const [buyerGstin, setBuyerGstin] = useState('')
  const [buyerState, setBuyerState] = useState('Tamil Nadu')
  const [buyerStateCode, setBuyerStateCode] = useState('33')
  const [placeOfSupply, setPlaceOfSupply] = useState('Tamil Nadu')
  const [contactName, setContactName] = useState('')

  // Consignee (Ship To) Details
  const [sameAsBuyer, setSameAsBuyer] = useState(false)
  const [consigneeName, setConsigneeName] = useState('')
  const [consigneeSubName, setConsigneeSubName] = useState('')
  const [consigneeAddress, setConsigneeAddress] = useState('')
  const [consigneeCityState, setConsigneeCityState] = useState('')
  const [consigneePhone, setConsigneePhone] = useState('')
  const [consigneePincode, setConsigneePincode] = useState('')
  const [consigneeGstin, setConsigneeGstin] = useState('')

  // Despatch & Transport Details
  const [showTransportSection, setShowTransportSection] = useState(true)
  const [buyersOrderNo, setBuyersOrderNo] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [despatchDocNo, setDespatchDocNo] = useState('')
  const [deliveryNoteDate, setDeliveryNoteDate] = useState('')
  const [despatchedThrough, setDespatchedThrough] = useState('')
  const [destination, setDestination] = useState('')
  const [billOfLading, setBillOfLading] = useState('')
  const [motorVehicleNo, setMotorVehicleNo] = useState('')
  const [termsOfDelivery, setTermsOfDelivery] = useState('Door Delivery')

  // Payment Mode & References
  // Options: Cash, UPI, Card, Bank Transfer, Credit Purchase
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [paymentTerms, setPaymentTerms] = useState('Immediate')
  const [buyerRef, setBuyerRef] = useState('')
  const [otherReferences, setOtherReferences] = useState('')

  // Coupon & Global Discount
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0)
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  // Invoice Preview & History
  const [activeInvoiceForView, setActiveInvoiceForView] = useState(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [todayStats, setTodayStats] = useState({ sales: 0, transactions: 0, gst: 0 })
  const [invoiceHistory, setInvoiceHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Load Products & Invoices
  useEffect(() => {
    axios.get('/api/products')
      .then(({ data }) => {
        if (data.success) {
          const products = (data.data || []).map(product => {
            const rawGst = Number(product.gstRate ?? product.gst)
            const gstRate = Number.isFinite(rawGst) ? rawGst : 18
            const cgstRate = Number(product.cgstRate) || +(gstRate / 2).toFixed(2)
            const sgstRate = Number(product.sgstRate) || +(gstRate / 2).toFixed(2)
            const igstRate = Number(product.igstRate) || gstRate
            return {
              ...product,
              hsnCode: product.hsnCode || product.hsn || '31010099',
              gstRate,
              cgstRate,
              sgstRate,
              igstRate,
              price: Number(product.price) || 0,
              unit: product.unit || 'Nos'
            }
          })
          setCatalog(products)
          if (products[0]) {
            selectProduct(products[0])
          }
        }
      })
      .catch(() => toast.error('Could not load products for billing'))

    // Fetch the next SAM-formatted invoice number from server
    fetchNextInvoiceNo()

    loadTodayStats()
    loadInvoiceHistory()
  }, [])

  // Fetch next SAM invoice number from server
  const fetchNextInvoiceNo = async () => {
    try {
      const { data } = await axios.get('/api/billing/next-invoice-no')
      if (data.success && data.invoiceNo) {
        setInvoiceNo(data.invoiceNo)
      }
    } catch {
      // Fallback: generate a client-side SAM number if server call fails
      const user = JSON.parse(localStorage.getItem('sathya_user') || '{}')
      const code = user.storeCode || 'GEN'
      setInvoiceNo(`SAM ${code} ${Date.now().toString().slice(-4)}`)
    }
  }

  // When documentType changes, keep the SAM number intact (just update doc type label)
  const handleDocTypeChange = (type) => {
    setDocumentType(type)
    // SAM invoice number stays the same regardless of doc type
  }

  const selectProduct = (p) => {
    setSelectedProduct(p.id)
    setItemRate(p.price)
    setItemHsn(p.hsnCode || '31010099')
    setItemGstRate(Number.isFinite(Number(p.gstRate)) ? Number(p.gstRate) : 18)
    setItemUnit(p.unit || 'Nos')
  }

  const loadTodayStats = async () => {
    try {
      const { data } = await axios.get('/api/billing/invoices')
      if (data.success) {
        setTodayStats(computeTodayStats(data.data))
      }
    } catch {
      // ignore
    }
  }

  const loadInvoiceHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data } = await axios.get('/api/billing/invoices')
      if (data.success) setInvoiceHistory((data.data || []).slice(0, 30))
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleProductDropdownChange = (e) => {
    const prodId = e.target.value
    const found = catalog.find(p => p.id === prodId)
    if (found) {
      selectProduct(found)
    }
  }

  // Add Item to Bill
  const addItem = () => {
    const product = catalog.find(p => p.id === selectedProduct)
    const name = product ? product.name : (productSearch?.trim() || 'Custom Product')

    if (!selectedProduct && !productSearch?.trim()) {
      toast.error('Please select a product or enter a custom product name')
      return
    }

    const parsedRate = parseFloat(itemRate)
    const rate = Number.isFinite(parsedRate) ? parsedRate : (product ? product.price : 0)

    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error('Enter a valid Rate (must be greater than 0)')
      return
    }

    const qty = Math.max(1, Number(itemQty) || 1)
    const discPercent = Math.max(0, Number(itemDiscPercent) || 0)
    const lineAmount = (qty * rate) * (1 - discPercent / 100)
    const rawItemGst = Number(itemGstRate)
    const gstRate = Number.isFinite(rawItemGst) ? rawItemGst : 18
    const cgstRate = +(gstRate / 2).toFixed(2)
    const sgstRate = +(gstRate / 2).toFixed(2)

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      // The catalogue product this line was picked from, if any - a custom,
      // freely-typed line has none. The server uses this, not the line's own
      // id above, to take the sale out of that product's online stock.
      productId: product?.id || '',
      name,
      batch: itemBatch || 'Primary Batch',
      hsnCode: itemHsn || '31010099',
      qty,
      unit: itemUnit || 'Nos',
      rate,
      price: rate,
      per: itemUnit || 'Nos',
      discPercent,
      amount: lineAmount,
      lineTotal: lineAmount,
      gstRate,
      cgstRate,
      sgstRate,
      lineCgst: +(lineAmount * (cgstRate / 100)).toFixed(2),
      lineSgst: +(lineAmount * (sgstRate / 100)).toFixed(2)
    }

    setItems(prev => [...prev, newItem])
    toast.success(`✅ Added "${name}" to bill`)

    // Reset for next entry
    setItemQty(1)
    setItemDiscPercent(0)
    setProductSearch('')
  }

  const removeItem = (id) => setItems(items.filter(i => i.id !== id))

  const updateItemQty = (id, newQty) => {
    if (newQty < 1) return
    setItems(items.map(i => {
      if (i.id === id) {
        const lineAmount = (newQty * i.rate) * (1 - (i.discPercent || 0) / 100)
        return {
          ...i,
          qty: newQty,
          amount: lineAmount,
          lineTotal: lineAmount,
          lineCgst: +(lineAmount * (i.cgstRate / 100)).toFixed(2),
          lineSgst: +(lineAmount * (i.sgstRate / 100)).toFixed(2)
        }
      }
      return i
    }))
  }

  // Financial calculations via shared pure billingSummary module
  const {
    itemsSubtotal,
    manualDiscAmt,
    totalDiscount,
    taxableSubtotal,
    totalCgst,
    totalSgst,
    totalGst,
    rawGrandTotal,
    roundedGrandTotal,
    roundOff,
    grandTotalWords,
    taxWords
  } = calculateBillingSummary({
    items,
    globalDiscountPercent,
    couponDiscountAmount
  })

  // Coupon Handlers
  const applyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      toast.error('Enter a coupon code')
      return
    }
    setValidatingCoupon(true)
    try {
      // The endpoint reads `cartTotal` and answers { success, data: {...} }.
      // This sent `cartSubtotal` and read `data.coupon`/`data.discountAmount`,
      // so the counter's coupon box always priced the basket at 0 and applied
      // nothing - it never once worked.
      const { data } = await axios.post('/api/coupons/validate', {
        code: couponCodeInput.trim(),
        cartTotal: itemsSubtotal,
        userPhone: buyerPhone
      })

      if (data.success && data.data) {
        setAppliedCoupon(data.data)
        setCouponDiscountAmount(data.data.discount || 0)
        toast.success(`Coupon '${data.data.code}' applied! Saved ₹${data.data.discount}`)
      } else {
        toast.error(data.message || 'Invalid coupon code')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not validate coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponDiscountAmount(0)
    setCouponCodeInput('')
    toast.info('Coupon removed')
  }

  // Construct current invoice object
  const constructCurrentInvoicePayload = () => {
    const finalBuyer = {
      name: buyerName || 'Walk-in Customer',
      phone: buyerPhone || '',
      line1: buyerAddress || '',
      cityState: buyerCityState || 'Madurai-625016, Tamil Nadu',
      pincode: buyerPincode || '625016',
      gstin: buyerGstin || '',
      stateName: buyerState || 'Tamil Nadu',
      stateCode: buyerStateCode || '33',
      placeOfSupply: placeOfSupply || 'Tamil Nadu',
      contactName: contactName || buyerName
    }

    const finalConsignee = sameAsBuyer ? finalBuyer : {
      name: consigneeName || buyerName,
      subName: consigneeSubName || '',
      line1: consigneeAddress || buyerAddress,
      cityState: consigneeCityState || buyerCityState,
      phone: consigneePhone || buyerPhone,
      pincode: consigneePincode || buyerPincode,
      gstin: consigneeGstin || buyerGstin,
      stateName: buyerState || 'Tamil Nadu',
      stateCode: buyerStateCode || '33'
    }

    const finalDespatch = {
      buyersOrderNo,
      orderDate,
      despatchDocNo,
      deliveryNoteDate,
      despatchedThrough,
      destination
    }

    const finalTransport = {
      billOfLading,
      motorVehicleNo,
      termsOfDelivery
    }

    return {
      documentType,
      invoiceNo,
      date: invoiceDate,
      ackNo,
      ackDate,
      irn,
      customerName: buyerName,
      customerPhone: buyerPhone,
      buyerDetails: finalBuyer,
      consigneeDetails: finalConsignee,
      despatchDetails: finalDespatch,
      transportDetails: finalTransport,
      paymentMode,
      paymentTerms: paymentMode === 'Credit Purchase' ? (paymentTerms || '30 Days Credit') : paymentTerms,
      buyerRef,
      otherReferences,
      items,
      subtotal: itemsSubtotal,
      discountAmount: totalDiscount,
      couponCode: appliedCoupon?.code || '',
      roundOff,
      grandTotal: roundedGrandTotal,
      amountInWords: grandTotalWords,
      taxAmountInWords: taxWords
    }
  }

  // Preview Bill without saving yet
  const handlePreviewCurrentBill = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item to preview the bill')
      return
    }
    const currentInv = constructCurrentInvoicePayload()
    setActiveInvoiceForView(currentInv)
    setIsInvoiceModalOpen(true)
  }

  // Create & Print GST Invoice
  const handleSaveAndPrintInvoice = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one item before generating the bill')
      return
    }

    const payload = constructCurrentInvoicePayload()

    try {
      const { data } = await axios.post('/api/billing/invoice', payload)
      if (!data.success) throw new Error(data.message || 'Could not create invoice')

      // Record coupon usage
      if (appliedCoupon) {
        axios.post('/api/coupons/use', {
          couponId: appliedCoupon._id || appliedCoupon.id,
          code: appliedCoupon.code,
          customerPhone: buyerPhone || 'Walk-in Customer',
          customerName: buyerName || 'Walk-in Customer',
          orderId: data.invoice.id,
          discountAmount: couponDiscountAmount,
          orderTotal: roundedGrandTotal
        }).catch(() => {})
      }

      toast.success('GST Invoice generated successfully! 🧾')
      setActiveInvoiceForView(data.invoice)
      setIsInvoiceModalOpen(true)
      loadTodayStats()
      loadInvoiceHistory()
      // Fetch the next SAM invoice number for the next bill
      fetchNextInvoiceNo()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not create invoice')
    }
  }

  const clearCurrentBill = () => {
    setItems([])
    setGlobalDiscountPercent(0)
    setAppliedCoupon(null)
    setCouponDiscountAmount(0)
    setCouponCodeInput('')
    setBuyerRef('')
    setOtherReferences('')
    toast.info('Bill cleared')
  }

  const filteredCatalog = catalog.filter(product =>
    `${product.name} ${product.category || ''} ${product.id} ${product.hsnCode || ''}`.toLowerCase().includes(productSearch.toLowerCase())
  )

  const paymentOptions = [
    { id: 'Cash', label: 'Cash', icon: <Banknote size={18} /> },
    { id: 'UPI', label: 'UPI', icon: <Smartphone size={18} /> },
    { id: 'Card', label: 'Card', icon: <CreditCard size={18} /> },
    { id: 'Bank Transfer', label: 'Bank Transfer', icon: <Landmark size={18} /> },
    { id: 'Credit Purchase', label: 'Credit Purchase', icon: <WalletCards size={18} /> }
  ]

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ReceiptText size={24} /> Sathyam Agro Clinic POS Billing &amp; e-Invoice Engine
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Official GSTIN: <strong>33AFBFS8329C1Z6</strong> · State: Tamil Nadu (33) · Ellis Nagar, Madurai
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={handlePreviewCurrentBill} disabled={items.length === 0}>
            <Eye size={15} style={{ marginRight: 5 }} /> Preview Bill
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveAndPrintInvoice} disabled={items.length === 0}>
            <Printer size={15} style={{ marginRight: 5 }} /> Print e-Invoice
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <BillingStatsCard todayStats={todayStats} />

      {/* Main Grid: Left Inputs & Bill Table / Right Checkout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 24, alignItems: 'start' }}>
        {/* LEFT COLUMN: Input Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* SECTION 1: Document Meta & Invoice Type */}
          <DocumentMetaCard
            documentType={documentType}
            handleDocTypeChange={handleDocTypeChange}
            invoiceNo={invoiceNo}
            setInvoiceNo={setInvoiceNo}
            invoiceDate={invoiceDate}
            setInvoiceDate={setInvoiceDate}
            ackNo={ackNo}
            setAckNo={setAckNo}
            ackDate={ackDate}
            setAckDate={setAckDate}
            irn={irn}
            setIrn={setIrn}
          />

          {/* SECTION 2: Buyer & Consignee Details */}
          <BuyerConsigneeCard
            buyerName={buyerName}
            setBuyerName={setBuyerName}
            buyerPhone={buyerPhone}
            setBuyerPhone={setBuyerPhone}
            buyerGstin={buyerGstin}
            setBuyerGstin={setBuyerGstin}
            buyerAddress={buyerAddress}
            setBuyerAddress={setBuyerAddress}
            buyerCityState={buyerCityState}
            setBuyerCityState={setBuyerCityState}
            buyerPincode={buyerPincode}
            setBuyerPincode={setBuyerPincode}
            buyerStateCode={buyerStateCode}
            setBuyerStateCode={setBuyerStateCode}
            sameAsBuyer={sameAsBuyer}
            setSameAsBuyer={setSameAsBuyer}
            consigneeName={consigneeName}
            setConsigneeName={setConsigneeName}
            consigneeSubName={consigneeSubName}
            setConsigneeSubName={setConsigneeSubName}
            consigneeGstin={consigneeGstin}
            setConsigneeGstin={setConsigneeGstin}
            consigneeAddress={consigneeAddress}
            setConsigneeAddress={setConsigneeAddress}
            consigneeCityState={consigneeCityState}
            setConsigneeCityState={setConsigneeCityState}
            consigneePincode={consigneePincode}
            setConsigneePincode={setConsigneePincode}
            consigneePhone={consigneePhone}
            setConsigneePhone={setConsigneePhone}
          />

          {/* SECTION 3: Despatch & Transport Details (Collapsible) */}
          <TransportDetailsCard
            showTransportSection={showTransportSection}
            setShowTransportSection={setShowTransportSection}
            motorVehicleNo={motorVehicleNo}
            setMotorVehicleNo={setMotorVehicleNo}
            despatchedThrough={despatchedThrough}
            setDespatchedThrough={setDespatchedThrough}
            destination={destination}
            setDestination={setDestination}
            billOfLading={billOfLading}
            setBillOfLading={setBillOfLading}
            buyersOrderNo={buyersOrderNo}
            setBuyersOrderNo={setBuyersOrderNo}
            orderDate={orderDate}
            setOrderDate={setOrderDate}
            despatchDocNo={despatchDocNo}
            setDespatchDocNo={setDespatchDocNo}
            termsOfDelivery={termsOfDelivery}
            setTermsOfDelivery={setTermsOfDelivery}
          />

          {/* SECTION 4: Add Item to Bill */}
          <AddItemCard
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            handleProductDropdownChange={handleProductDropdownChange}
            filteredCatalog={filteredCatalog}
            catalog={catalog}
            itemBatch={itemBatch}
            setItemBatch={setItemBatch}
            itemHsn={itemHsn}
            setItemHsn={setItemHsn}
            itemQty={itemQty}
            setItemQty={setItemQty}
            itemRate={itemRate}
            setItemRate={setItemRate}
            itemUnit={itemUnit}
            setItemUnit={setItemUnit}
            addItem={addItem}
          />

          {/* SECTION 5: Current Bill Items Table */}
          <BillItemsCard
            items={items}
            updateItemQty={updateItemQty}
            removeItem={removeItem}
            clearCurrentBill={clearCurrentBill}
          />

          {/* SECTION 6: Recent Invoices & Reprint History */}
          <RecentInvoicesCard
            invoiceHistory={invoiceHistory}
            historyLoading={historyLoading}
            onRefresh={loadInvoiceHistory}
            onViewInvoice={(inv) => {
              setActiveInvoiceForView(inv)
              setIsInvoiceModalOpen(true)
            }}
          />
        </div>

        {/* RIGHT COLUMN: Payment Mode & Checkout Panel */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Payment Mode Selector */}
          <PaymentModeCard
            paymentOptions={paymentOptions}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            paymentTerms={paymentTerms}
            setPaymentTerms={setPaymentTerms}
            buyerRef={buyerRef}
            setBuyerRef={setBuyerRef}
            otherReferences={otherReferences}
            setOtherReferences={setOtherReferences}
          />

          {/* Checkout & Bill Summary Card */}
          <BillSummaryCard
            appliedCoupon={appliedCoupon}
            couponDiscountAmount={couponDiscountAmount}
            couponCodeInput={couponCodeInput}
            setCouponCodeInput={setCouponCodeInput}
            validatingCoupon={validatingCoupon}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
            globalDiscountPercent={globalDiscountPercent}
            setGlobalDiscountPercent={setGlobalDiscountPercent}
            summary={{
              itemsSubtotal,
              manualDiscAmt,
              couponDiscountAmount,
              taxableSubtotal,
              totalCgst,
              totalSgst,
              roundOff,
              roundedGrandTotal,
              grandTotalWords
            }}
            itemsCount={items.length}
            handleSaveAndPrintInvoice={handleSaveAndPrintInvoice}
            handlePreviewCurrentBill={handlePreviewCurrentBill}
          />
        </div>
      </div>

      {/* Exact GST Invoice Popup / Print View */}
      {isInvoiceModalOpen && activeInvoiceForView && (
        <ExactGstInvoice
          invoice={activeInvoiceForView}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}
    </div>
  )
}
