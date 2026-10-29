import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Plus, Edit2, Trash2, Check, X, Search,
  RefreshCw, Sparkles, Tag, ShieldAlert, BarChart3,
  Sprout, Package, Video, ChevronDown
} from 'lucide-react'
import { parseImageList } from '../../shared/productImages.js'
import { duplicateNameGroups, findSameNamedProduct, productNameKey } from '../../shared/productName.js'
import { PRODUCT_FORMS, productForm } from '../../shared/productForm.js'
import { cropList, joinCrops, CROP_CHOICES } from '../../shared/profileFieldRules'
import { packUnits } from '../../shared/packPricing'
import ProductTranslations from './ProductTranslations'
import ProductFormRail from './products/ProductFormRail'
import PricingSection from './products/PricingSection'
import MediaSection from './products/MediaSection'
import VisibilitySection from './products/VisibilitySection'
import VideosSection from './products/VideosSection'
import AdvancedSection from './products/AdvancedSection'
import TableLoader from '../../components/common/TableLoader'
import EmptyState from '../../components/common/EmptyState'
import { formatCurrency } from '../../utils/formatters'
import { invalidateCatalogProductsCache } from '../../hooks/useCatalogProducts'

const PFORM_SECTIONS = [
  { id: 'pform-basic', label: 'Basic details', hint: 'Title, category, badge' },
  { id: 'pform-pricing', label: 'Pricing & stock', hint: 'Price, MRP, quantity' },
  { id: 'pform-targeting', label: 'Crops & packs', hint: 'Crops, pests, sizes' },
  { id: 'pform-media', label: 'Photos & copy', hint: 'Gallery, description' },
  { id: 'pform-visibility', label: 'Visibility', hint: 'Audience, online' },
  { id: 'pform-advanced', label: 'Advanced', hint: 'Usage, related, reviews' },
]

const DEFAULT_CATEGORIES = ['Fungicide', 'Insecticide', 'Herbicide', 'Bio-Stimulant', 'Fertilizer', 'Nematicide', 'Adjuvant', 'Seeds', 'Equipments', 'Animal Husbandry']

const productImage = product => {
  const image = (Array.isArray(product.images) && product.images[0]) || product.image
  if (!image) return ''
  return image.startsWith('./') ? image.slice(1) : image
}

// Tells open storefront tabs (src/storefront/Storefront.jsx listens on the same channel) to reload products.
const notifyStorefront = () => {
  if (!('BroadcastChannel' in window)) return
  const channel = new BroadcastChannel('sathya_catalog')
  channel.postMessage('products-changed')
  channel.close()
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [userFilter, setUserFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all') // 'all', 'both', 'online', 'offline'
  const [availableVideos, setAvailableVideos] = useState([])
  const [customVideoUrl, setCustomVideoUrl] = useState('')
  const [customVideoTitle, setCustomVideoTitle] = useState('')
  const [sortBy, setSortBy] = useState('user') // 'user', 'price_asc', 'price_desc', 'stock', 'default'
  const [showDemandSummary, setShowDemandSummary] = useState(false)
  const [catalogOptions, setCatalogOptions] = useState({ categories: DEFAULT_CATEGORIES, crops: [], storageBatches: [], diseases: [], physicalForms: PRODUCT_FORMS })
  const [newCategory, setNewCategory] = useState('')
  const [newCrop, setNewCrop] = useState('')
  const [cropMenuOpen, setCropMenuOpen] = useState(false)
  const cropMenuRef = useRef(null)
  const [newDisease, setNewDisease] = useState('')
  const [newPhysicalForm, setNewPhysicalForm] = useState('')
  const [newStorageBatch, setNewStorageBatch] = useState('')

  const [isEditing, setIsEditing] = useState(null)
  const [saving, setSaving] = useState(false) // a publish is on its way: the button waits for it
  // Every product, whatever the category/search filters show: the duplicate-name check needs them all.
  const [catalogue, setCatalogue] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'Fungicide',
    form: '',
    price: '',
    mrp: '',
    stock: '',
    hsnCode: '',
    gstRate: 18,
    badge: '',
    crops: '',
    diseases: '',
    description: '',
    visibility: 'both',
    online: true,
    taggedVideos: [],
    targetUserId: 'all',
    activeIngredient: '',
    dosage: '250g - 500g per Acre',
    packSizes: '250g, 500g, 1kg',
    images: '',
    howToUse: '',
    whenToUse: '',
    relatedBlogs: '',
    relatedProductIds: '',
    reviewsEnabled: false,
    emoji: '🌿'
  })

  useEffect(() => {
    fetchProducts()
    fetchUsersList()
    fetchCatalogOptions()
    fetchVideosList()
  }, [category, sortBy])

  const fetchVideosList = async () => {
    try {
      const { data } = await axios.get('/api/videos')
      if (data.success) setAvailableVideos(data.data || [])
    } catch (err) {
      console.error('Error loading videos for product attachment:', err)
    }
  }

  const fetchCatalogOptions = async () => {
    try {
      const { data } = await axios.get('/api/catalog-options')
      if (data.success) setCatalogOptions(data.data)
    } catch (err) {
      console.error('Error loading catalog options:', err)
    }
  }

  // Form field name -> the shared registry key it draws from and saves to
  // (server.js's /api/catalog-options, db.js's registerCatalogOptions).
  const FORM_FIELD_CATALOG_KEY = { category: 'categories', form: 'physicalForms', diseases: 'diseases' }
  const addFormOption = (field, value, setValue) => {
    const cleanValue = value.trim()
    if (!cleanValue) return
    setForm(current => ({ ...current, [field]: field === 'crops' || field === 'diseases' || field === 'packSizes' ? `${current[field] ? `${current[field]}, ` : ''}${cleanValue}` : cleanValue }))
    setValue('')
    const catalogKey = FORM_FIELD_CATALOG_KEY[field]
    if (catalogKey) persistCatalogOption(catalogKey, cleanValue, field)
  }

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    toast.info('Uploading image(s)...')
    const uploadedUrls = []
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }
      try {
        const reader = new FileReader()
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        
        const { data } = await axios.post('/api/upload', {
          filename: file.name,
          contentType: file.type,
          data: base64
        })
        
        if (data.success && data.url) {
          uploadedUrls.push(data.url)
        }
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    
    if (uploadedUrls.length > 0) {
      setForm(current => ({ 
        ...current, 
        images: [current.images, ...uploadedUrls].filter(Boolean).join('\n') 
      }))
      toast.success('Image(s) uploaded successfully!')
    }
    event.target.value = ''
  }

  // Display-only helpers for the product form (section rail, required meter,
  // discount readout, photo previews). They read form state; saving is unchanged.
  const [activeSection, setActiveSection] = useState(PFORM_SECTIONS[0].id)
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    if (el.tagName === 'DETAILS') el.open = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }
  const handleFormScroll = (event) => {
    const body = event.currentTarget
    const top = body.getBoundingClientRect().top + 24
    let current = PFORM_SECTIONS[0].id
    for (const s of PFORM_SECTIONS) {
      const el = document.getElementById(s.id)
      if (el && el.getBoundingClientRect().top <= top) current = s.id
    }
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) current = PFORM_SECTIONS[PFORM_SECTIONS.length - 1].id
    if (current !== activeSection) setActiveSection(current)
  }
  // On tablet/phone the rail is a horizontal strip: keep the active step in view.
  useEffect(() => {
    const button = document.querySelector('.pform-rail > button.active')
    const rail = button?.parentElement
    if (rail && rail.scrollWidth > rail.clientWidth) {
      rail.scrollTo({ left: Math.max(0, button.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2), behavior: 'smooth' })
    }
  }, [activeSection])
  const removeListItem = (field, item) => {
    setForm(current => ({ ...current, [field]: current[field].split(',').map(s => s.trim()).filter(s => s && s !== item).join(', ') }))
  }
  // Suitable Crops: a checklist dropdown over the admin's crop registry
  // (catalogOptions.crops, the same list every other crop picker in the app
  // reads from), not free text - so a filter option is never a typo away
  // from matching nothing.
  const selectedCrops = cropList(form.crops)
  const cropChoices = catalogOptions.crops?.length ? catalogOptions.crops : CROP_CHOICES
  const toggleCrop = crop => {
    const exists = selectedCrops.some(c => c.toLowerCase() === crop.toLowerCase())
    const next = exists ? selectedCrops.filter(c => c.toLowerCase() !== crop.toLowerCase()) : [...selectedCrops, crop]
    setForm(current => ({ ...current, crops: joinCrops(next) }))
  }
  // Every "Add new ..." box in this form (category, physical form, crop,
  // disease, pack size) writes to the same shared Settings.catalogOptions
  // registry server-side (db.js's registerCatalogOptions). Saving it here,
  // the moment it's typed - not only as a side effect of publishing a
  // product that happens to use it - is what makes it show up in every
  // dropdown, for every admin, immediately: their own next product, the
  // storefront filters, everyone's session, not just this one after a save.
  // Deduped against the built-in fallback too, so typing "Wheat" when the
  // registry is still empty (and the dropdown is showing the fallback list)
  // doesn't add a second "Wheat" once the real registry catches up.
  const CATALOG_FALLBACKS = { categories: DEFAULT_CATEGORIES, physicalForms: PRODUCT_FORMS, crops: CROP_CHOICES, diseases: [], storageBatches: [] }
  const persistCatalogOption = async (catalogKey, rawValue, label) => {
    const value = rawValue.trim()
    if (!value) return
    const known = [...(catalogOptions[catalogKey] || []), ...(CATALOG_FALLBACKS[catalogKey] || [])]
    if (known.some(v => v.toLowerCase() === value.toLowerCase())) return
    setCatalogOptions(current => ({ ...current, [catalogKey]: [...(current[catalogKey] || []), value] }))
    try {
      const { data } = await axios.post('/api/catalog-options', { [catalogKey]: [value] })
      if (data.success) setCatalogOptions(data.data)
    } catch {
      toast.error(`"${value}" is set for this product, but could not be saved to the shared ${label} list. It will still save with this product.`)
    }
  }
  const addCustomCrop = value => {
    const crop = value.trim()
    if (!crop) return
    setNewCrop('')
    toggleCrop(crop)
    persistCatalogOption('crops', crop, 'crop')
  }
  useEffect(() => {
    if (!cropMenuOpen) return undefined
    const onOutside = event => { if (!cropMenuRef.current?.contains(event.target)) setCropMenuOpen(false) }
    const onEscape = event => { if (event.key === 'Escape') setCropMenuOpen(false) }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [cropMenuOpen])
  const photoList = parseImageList(form.images)
  const requiredChecks = [
    { label: 'Product title', done: Boolean(String(form.name).trim()) },
    { label: 'Category', done: Boolean(String(form.category).trim()) },
    { label: 'Physical form', done: Boolean(String(form.form || '').trim()) },
    { label: 'Selling price', done: form.price !== '' },
    { label: 'Stock quantity', done: form.stock !== '' },
    { label: 'HSN code', done: Boolean(String(form.hsnCode || '').trim()) },
    { label: 'GST rate', done: form.gstRate !== undefined && form.gstRate !== '' },
    { label: 'Suitable crops', done: Boolean(String(form.crops).trim()) },
    { label: 'Target pests / diseases', done: Boolean(String(form.diseases).trim()) },
    { label: 'At least one photo', done: photoList.length > 0 },
    { label: 'Product description', done: Boolean(String(form.description).trim()) },
  ]
  const requiredDone = requiredChecks.filter(c => c.done).length
  const discountPercent = Number(form.mrp) > Number(form.price) && Number(form.price) > 0
    ? Math.round((1 - Number(form.price) / Number(form.mrp)) * 100)
    : 0

  const fetchCatalogue = async () => {
    try {
      const { data } = await axios.get('/api/products')
      if (data.success) setCatalogue(data.data)
    } catch {
      // The server checks names on publish anyway.
    }
  }

  const fetchProducts = async () => {
    fetchCatalogue()
    setLoading(true)
    try {
      const { data } = await axios.get('/api/products', {
        params: {
          category,
          sortBy,
          search: search.trim() || undefined
        }
      })
      if (data.success) {
        setProducts(data.data)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      toast.error('Could not load products from database')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersList = async () => {
    try {
      const { data } = await axios.get('/api/admin/users')
      if (data.success) {
        setUsers(data.data)
      }
    } catch (err) {
      console.error('Error loading users for assignment:', err)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchProducts()
  }

  // Filter products by targeted user and channel if selected
  const filtered = products.filter(p => {
    if (userFilter !== 'all') {
      if (userFilter === 'general' && p.targetUserId && p.targetUserId !== 'all') return false
      if (userFilter !== 'general' && p.targetUserId !== userFilter) return false
    }
    if (channelFilter !== 'all') {
      const vis = p.visibility || (p.online === false ? 'offline' : 'both')
      if (channelFilter === 'both' && vis !== 'both') return false
      if (channelFilter === 'online' && vis !== 'online' && vis !== 'both') return false
      if (channelFilter === 'offline' && vis !== 'offline' && vis !== 'both') return false
    }
    return true
  })

  const openAddModal = () => {
    setIsEditing(null)
    setCustomVideoUrl('')
    setCustomVideoTitle('')
    const defaultPackDetails = [
      { size: '250g', price: '200', mrp: '250' },
      { size: '500g', price: '380', mrp: '450' },
      { size: '1kg', price: '720', mrp: '850' }
    ]
    setForm({
      name: '',
      category: 'Fungicide',
      form: '',
      price: '380',
      mrp: '450',
      stock: 100,
      badge: 'Best Seller',
      crops: 'Paddy / Rice, Wheat',
      diseases: '',
      description: '',
      visibility: 'both',
      online: true,
      taggedVideos: [],
      targetUserId: userFilter !== 'all' && userFilter !== 'general' ? userFilter : 'all',
      activeIngredient: '100% Bio-Active Formulation',
      dosage: '250g per Acre',
      packSizes: '250g, 500g, 1kg',
      packDetails: defaultPackDetails,
      hsnCode: '3808',
      gstRate: 18,
      images: '',
      howToUse: '',
      whenToUse: '',
      relatedBlogs: '',
      relatedProductIds: '',
      reviewsEnabled: false,
      emoji: '🌿'
    })
    setModalOpen(true)
  }

  const openEditModal = (p) => {
    setIsEditing(p.id)
    setCustomVideoUrl('')
    setCustomVideoTitle('')
    const pVis = p.visibility || (p.online === false ? 'offline' : 'both')
    const pPackSizes = Array.isArray(p.packSizes) && p.packSizes.length
      ? p.packSizes.map(s => typeof s === 'object' ? s.size : s)
      : (p.packSizes ? String(p.packSizes).split(',').map(s => s.trim()).filter(Boolean) : ['250g', '500g', '1kg'])
    const basePrice = Number(p.price || 0)
    const baseMrp = Number(p.originalPrice || p.mrp || basePrice * 1.2)
    const basePack = p.selectedPack || pPackSizes[0]

    const packDetails = pPackSizes.map(size => {
      let price = p.packagePrices?.[size] || p.packPrices?.[size]
      let mrp = p.packageMrps?.[size] || p.packMrps?.[size]
      if (price === undefined) {
        if (basePack && size && packUnits(basePack) > 0) {
          price = Math.round(basePrice * (packUnits(size) / packUnits(basePack)))
        } else {
          price = basePrice
        }
      }
      if (mrp === undefined) {
        mrp = basePrice > 0 ? Math.round(baseMrp * (price / basePrice)) : price
      }
      return { size, price: String(price), mrp: String(mrp) }
    })

    setForm({
      name: p.name || '',
      category: p.category || 'Fungicide',
      form: p.form || '',
      price: p.price || '',
      mrp: p.originalPrice || p.mrp || '',
      stock: p.stock !== undefined ? p.stock : '',
      badge: p.badge || '',
      crops: Array.isArray(p.crops) ? p.crops.join(', ') : (p.crops || ''),
      diseases: Array.isArray(p.diseases) ? p.diseases.join(', ') : (p.diseases || ''),
      description: p.description || '',
      visibility: pVis,
      online: pVis !== 'offline',
      taggedVideos: Array.isArray(p.taggedVideos) ? p.taggedVideos : [],
      targetUserId: p.targetUserId || 'all',
      activeIngredient: p.activeIngredient || '',
      dosage: p.dosage || '250g per Acre',
      packSizes: pPackSizes.join(', '),
      packDetails,
      hsnCode: p.hsnCode || '3808',
      gstRate: p.gstRate !== undefined ? p.gstRate : 18,
      images: Array.isArray(p.images) ? p.images.join('\n') : (p.image || ''),
      howToUse: p.howToUse || '',
      whenToUse: p.whenToUse || '',
      relatedBlogs: Array.isArray(p.relatedBlogs) ? p.relatedBlogs.map(blog => `${blog.title || ''} | ${blog.url || ''}`).join('\n') : '',
      relatedProductIds: Array.isArray(p.relatedProductIds) ? p.relatedProductIds.join(', ') : '',
      reviewsEnabled: p.reviewsEnabled === true,
      emoji: p.emoji || '🌿'
    })
    setModalOpen(true)
  }

  // One product per name: the store shows every product to everyone, so a
  // second one with the same name would appear twice. Checked while typing
  // here, and again by the server when publishing.
  // Editing a product keeps working under its current name, even while an
  // older copy with that name still exists; only a new name has to be free.
  const editingOriginal = isEditing ? catalogue.find(p => String(p.id) === String(isEditing)) : null
  const renamed = !editingOriginal || productNameKey(editingOriginal.name) !== productNameKey(form.name)
  const sameNamed = modalOpen && renamed ? findSameNamedProduct(catalogue, form.name, isEditing) : null
  const duplicateGroups = duplicateNameGroups(catalogue)
  const editExisting = product => {
    const full = catalogue.find(p => String(p.id) === String(product.id)) || products.find(p => String(p.id) === String(product.id)) || product
    openEditModal(full)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (saving) return
    if (sameNamed) {
      toast.error(`"${sameNamed.name}" is already in the catalogue. Edit that product instead.`)
      document.getElementById('pformName')?.focus()
      return
    }
    if (requiredDone < requiredChecks.length) {
      toast.error(`Please fill required fields (${requiredChecks.filter(c => !c.done).map(c => c.label).join(', ')})`)
      return
    }

    const images = parseImageList(form.images)
    if (images.length === 0) {
      toast.error('Add at least one product photo URL or asset path')
      return
    }

    const visibility = form.visibility || (form.online ? 'both' : 'offline')

    const packagePrices = {}
    const packageMrps = {}
    const packSizesList = []

    const packDetails = Array.isArray(form.packDetails) ? form.packDetails : []
    packDetails.forEach(item => {
      const s = (item.size || '').trim()
      if (!s) return
      packSizesList.push(s)
      packagePrices[s] = Number(item.price) || Number(form.price) || 0
      packageMrps[s] = Number(item.mrp) || Number(form.mrp) || Math.round(packagePrices[s] * 1.2)
    })

    if (packSizesList.length === 0) {
      form.packSizes.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
        packSizesList.push(s)
        packagePrices[s] = Number(form.price) || 0
        packageMrps[s] = Number(form.mrp) || Math.round(packagePrices[s] * 1.2)
      })
    }

    const firstSize = packSizesList[0] || 'Standard'
    const finalPrice = packagePrices[firstSize] !== undefined ? packagePrices[firstSize] : Number(form.price || 0)
    const finalMrp = packageMrps[firstSize] !== undefined ? packageMrps[firstSize] : Number(form.mrp || finalPrice * 1.2)

    const payload = {
      ...form,
      visibility,
      online: visibility !== 'offline',
      taggedVideos: Array.isArray(form.taggedVideos) ? form.taggedVideos : [],
      price: finalPrice,
      originalPrice: finalMrp,
      packagePrices,
      packageMrps,
      hsnCode: form.hsnCode || '3808',
      gstRate: Number(form.gstRate !== undefined ? form.gstRate : 18),
      cgstRate: Number(form.gstRate !== undefined ? form.gstRate : 18) / 2,
      sgstRate: Number(form.gstRate !== undefined ? form.gstRate : 18) / 2,
      igstRate: Number(form.gstRate !== undefined ? form.gstRate : 18),
      stock: Number(form.stock),
      crops: form.crops.split(',').map(s => s.trim()).filter(Boolean),
      diseases: form.diseases.split(',').map(s => s.trim()).filter(Boolean),
      packSizes: packSizesList,
      images,
      image: images[0],
      howToUse: form.howToUse.trim(),
      whenToUse: form.whenToUse.trim(),
      relatedBlogs: form.relatedBlogs.split('\n').map(line => {
        const [title, url] = line.split('|').map(value => value.trim())
        return title && url ? { title, url } : null
      }).filter(Boolean),
      relatedProductIds: form.relatedProductIds.split(',').map(value => value.trim()).filter(Boolean),
      reviewsEnabled: form.reviewsEnabled
    }

    setSaving(true)
    try {
      if (isEditing) {
        const { data } = await axios.put(`/api/products/${isEditing}`, payload)
        if (data.success) {
          toast.success(data.message || 'Product updated successfully in DB! 🌿')
          notifyStorefront()
          fetchProducts()
          fetchCatalogOptions()
          setModalOpen(false)
        }
      } else {
        const { data } = await axios.post('/api/products', payload)
        if (data.success) {
          toast.success(data.message || 'New product added and live on customer storefront! ✨')
          notifyStorefront()
          fetchProducts()
          fetchCatalogOptions()
          setModalOpen(false)
        }
      }
    } catch (err) {
      console.error('Save product error:', err)
      const reply = err.response?.data
      const msg = reply?.message || 'Error saving product'
      if (reply?.code === 'DUPLICATE_PRODUCT' && reply.duplicateOf) {
        // Published from another screen or by another admin since this list loaded.
        fetchProducts()
        toast.error(msg, { action: { label: 'Edit existing', onClick: () => editExisting(reply.duplicateOf) } })
      } else {
        toast.error(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from store database?`)) {
      return
    }

    try {
      const { data } = await axios.delete(`/api/products/${id}`)
      if (data.success) {
        toast.success(`"${name}" removed from catalog and database`)
        notifyStorefront()
        fetchProducts()
      }
    } catch (err) {
      toast.error('Failed to delete product')
    }
  }

  // Count user targeted products
  const targetedCount = products.filter(p => p.targetUserId && p.targetUserId !== 'all').length
  const generalCount = products.length - targetedCount

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Products Master
          </h1>
          <p>Full control over store catalog, real-time customer reflections, and user-based targeting & sorting</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowDemandSummary(!showDemandSummary)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={15} /> {showDemandSummary ? 'Hide User Demand' : 'User Allocation & Demand'}
          </button>
          <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add New Product
          </button>
        </div>
      </div>

      {/* USER DEMAND & SORTING INSIGHTS ACCORDION */}
      {showDemandSummary && (
        <div className="card animate-fade-in" style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '12px', padding: '18px 20px', marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--brand-400)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sparkles size={16} /> User Demand & Targeted Inventory Allocations
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Based on sorting by registered user farm needs
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Admin can sort by user or filter specifically to decide which high-yield bio products or bulk packages to add for specific farmers:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {users.filter(u => u.role === 'farmer').map(u => {
              const assigned = products.filter(p => p.targetUserId === u.id)
              return (
                <div key={u.id} style={{
                  background: 'rgba(0, 0, 0, 0.35)', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{u.name}</div>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>🌾 {u.crop || 'Paddy'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {u.acreage} Acres • {u.village || 'Farm'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--brand-400)' }}>
                      {assigned.length > 0 ? `🎯 ${assigned.length} Targeted Products` : '⚠️ No custom products yet'}
                    </span>
                    <button
                      onClick={() => {
                        setUserFilter(u.id)
                        setShowDemandSummary(false)
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Filter & View
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FILTER & USER SORTING BAR */}
      <div className="filter-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '240px' }}>
          <div className="search-box" style={{ width: '100%', position: 'relative' }}>
            <Search size={16} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              style={{ width: '100%', paddingLeft: '38px' }}
              placeholder="Search products by chemical, crop, or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </form>

        {/* Filter by Category */}
        <select
          className="filter-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          title="Filter by Category"
        >
          {['All', ...catalogOptions.categories].map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>

        {/* Filter by Target User */}
        <select
          className="filter-select"
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          title="Filter by User Assignment"
          style={{ minWidth: '180px', borderColor: userFilter !== 'all' ? 'var(--brand-400)' : undefined }}
        >
          <option value="all">Filter: All Products ({products.length})</option>
          <option value="general">🌐 General Catalog ({generalCount})</option>
          <optgroup label="Targeted Farmers">
            {users.filter(u => u.role === 'farmer').map(u => (
              <option key={u.id} value={u.id}>
                👤 {u.name} ({u.crop || 'Farmer'})
              </option>
            ))}
          </optgroup>
        </select>

        {/* Filter by Sales Channel */}
        <select
          className="filter-select"
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
          title="Filter by Sales Channel"
          style={{ minWidth: '160px', borderColor: channelFilter !== 'all' ? 'var(--brand-400)' : undefined }}
        >
          <option value="all">Channel: All Channels</option>
          <option value="both">🔄 Both (Web &amp; POS)</option>
          <option value="online">🌐 Online Only (Web)</option>
          <option value="offline">🏬 Offline Only (POS)</option>
        </select>

        {/* Sort Controls (including Sort by User) */}
        <select
          className="filter-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          title="Sort catalog"
        >
          <option value="user">Sort: By Target User 👥</option>
          <option value="default">Sort: Default Catalog Order</option>
          <option value="price_asc">Sort: Price (Low to High)</option>
          <option value="price_desc">Sort: Price (High to Low)</option>
          <option value="stock">Sort: Stock Quantity</option>
        </select>

        <button className="btn btn-outline" onClick={fetchProducts} title="Refresh catalog from DB">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="card" style={{ background: 'var(--dark-800)', borderRadius: '12px', border: '1px solid var(--dark-700)', overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="admin-products-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--dark-700)' }}>
                <th style={{ padding: '14px 16px' }}>Product</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px' }}>Channel</th>
                <th style={{ padding: '14px 16px' }}>Price / MRP</th>
                <th style={{ padding: '14px 16px' }}>Stock</th>
                <th style={{ padding: '14px 16px' }}>Targeted User (Sorting)</th>
                <th style={{ padding: '14px 16px' }}>Suitable Crops</th>
                <th style={{ padding: '14px 16px' }}>Badge</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader colSpan={9} message="Loading products from database..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px 16px' }}>
                    <EmptyState
                      icon={<Package size={28} />}
                      title="No products found"
                      description='Adjust filters or click "Add New Product" to create one.'
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--dark-700)' }}>
                    {/* Product Name & Description */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="admin-product-thumb" style={{
                          width: '40px', height: '40px', borderRadius: '8px',
                          background: 'rgba(74, 222, 128, 0.1)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
                        }}>
                          {productImage(p) && <img src={productImage(p)} alt="" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {p.name}
                            {duplicateGroups[productNameKey(p.name)] && (
                              <span className="pform-dup-badge" title={`${duplicateGroups[productNameKey(p.name)].length} products share this name, so the store shows it more than once. Keep one and delete the others.`}>Duplicate</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.tagline || p.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-blue">{p.category}</span>
                      {productForm(p) && (
                        <span className="badge badge-gray" style={{ marginLeft: 4 }} title={p.form ? 'Set on the product' : 'Guessed from its name/size — open the product to set it directly'}>
                          {productForm(p)}
                        </span>
                      )}
                    </td>

                    {/* Channel Availability */}
                    <td style={{ padding: '14px 16px' }}>
                      {p.visibility === 'both' || (p.visibility === undefined && p.online !== false) ? (
                        <span className="badge badge-green" title="Available on Online Web Store & POS Billing Counter">🔄 Both</span>
                      ) : p.visibility === 'offline' || p.online === false ? (
                        <span className="badge badge-yellow" title="Available on POS Billing Counter only">🏬 Offline Only</span>
                      ) : (
                        <span className="badge badge-blue" title="Available on Online Web Store only">🌐 Online Only</span>
                      )}
                      {Array.isArray(p.taggedVideos) && p.taggedVideos.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
                            🎬 {p.taggedVideos.length} {p.taggedVideos.length === 1 ? 'Demo Video' : 'Demo Videos'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Price & MRP */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-400)' }}>{formatCurrency(p.price)}</div>
                      {Number(p.originalPrice || p.mrp) > Number(p.price) && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCurrency(p.originalPrice || p.mrp)}
                        </div>
                      )}
                    </td>

                    {/* Stock Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${p.stock > 50 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'}`}>
                        {p.stock > 0 ? `${p.stock} units` : 'Out of stock'}
                      </span>
                    </td>

                    {/* Targeted User / Sorting */}
                    <td style={{ padding: '14px 16px' }}>
                      {p.targetUserId && p.targetUserId !== 'all' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                            🎯 {p.targetUserName || p.targetUserId}
                          </span>
                          {p.targetUserPhone && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📞 {p.targetUserPhone}</span>
                          )}
                        </div>
                      ) : (
                        <span className="badge" style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                          🌐 General Public
                        </span>
                      )}
                    </td>

                    {/* Crops */}
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {Array.isArray(p.crops) ? p.crops.slice(0, 2).join(', ') + (p.crops.length > 2 ? ` +${p.crops.length - 2}` : '') : p.crops}
                    </td>

                    {/* Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      {p.badge && (
                        <span className={`badge ${p.badge.toLowerCase().includes('best') ? 'badge-yellow' : p.badge.toLowerCase().includes('organic') ? 'badge-green' : 'badge-blue'}`}>
                          {p.badge}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                          onClick={() => openEditModal(p)}
                          title="Edit product"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Delete product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="modal-backdrop product-modal" style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="pform-shell">
            <div className="pform-header">
              <div className="pform-header-main">
                <span className="pform-header-icon">{isEditing ? <Edit2 size={17} /> : <Plus size={18} />}</span>
                <div>
                  <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                  <p>{isEditing ? 'Update catalog details — changes go live immediately.' : 'Fields marked * are required. Everything else can be filled in later.'}</p>
                </div>
              </div>
              <span className={`pform-status ${form.online ? '' : 'offline'}`}>
                <i aria-hidden="true" />{form.online ? 'Online on store' : 'Billing only'}
              </span>
              <button type="button" className="pform-close" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} id="product-form">
              <div className="pform-frame">
                {/* Section rail: desktop only (hidden by CSS below 1025px) */}
                <ProductFormRail
                  sections={PFORM_SECTIONS}
                  activeSection={activeSection}
                  scrollToSection={scrollToSection}
                  requiredDone={requiredDone}
                  requiredChecks={requiredChecks}
                />

              <div className="pform-body" onScroll={handleFormScroll}>

                {/* BASIC DETAILS */}
                <section className="pform-section" id="pform-basic">
                  <div className="pform-section-head">
                    <span className="pform-section-icon"><Tag size={15} /></span>
                    <div>
                      <h3>Basic Details</h3>
                      <span className="pform-section-sub">Name, category and the badge shoppers see on the card</span>
                    </div>
                  </div>
                  <div className="pform-field">
                    <label htmlFor="pformName">Product Title *</label>
                    <input
                      id="pformName"
                      required
                      placeholder="Product name as printed on the pack"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      aria-invalid={sameNamed ? 'true' : undefined}
                      aria-describedby={sameNamed ? 'pformNameDuplicate' : undefined}
                    />
                    {sameNamed && (
                      <div className="pform-duplicate" id="pformNameDuplicate" role="alert">
                        <ShieldAlert size={16} aria-hidden="true" />
                        <span><strong>“{sameNamed.name}”</strong> is already in the catalogue. Publishing it again would show it twice in the store.</span>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => editExisting(sameNamed)}>Edit that product</button>
                      </div>
                    )}
                  </div>
                  <div className="pform-field pform-grid-2">
                    <div>
                      <label>Category *</label>
                      <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        {catalogOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="pform-adder">
                        <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category" />
                        <button type="button" onClick={() => addFormOption('category', newCategory, setNewCategory)}><Plus size={14} className="pform-adder-icon" />Add</button>
                      </div>
                    </div>
                    <div>
                      {/* Liquid, Powder, Pellets... - what shoppers filter the shop
                          by (src/shared/productForm.js). Same registry as
                          Category: a form typed here is saved to every store
                          that shares this database (server catalogOptions.
                          physicalForms) the next time this product is saved,
                          and offered on every product after that - so a typo
                          here becomes a filter option nothing ever matches. */}
                      <label htmlFor="pformPhysicalForm">Physical Form *</label>
                      <select
                        id="pformPhysicalForm"
                        required
                        value={form.form}
                        onChange={e => setForm({ ...form, form: e.target.value })}
                      >
                        <option value="" disabled>Choose a physical form…</option>
                        {(catalogOptions.physicalForms?.length ? catalogOptions.physicalForms : PRODUCT_FORMS).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div className="pform-adder">
                        <input value={newPhysicalForm} onChange={e => setNewPhysicalForm(e.target.value)} placeholder="New physical form" />
                        <button type="button" onClick={() => addFormOption('form', newPhysicalForm, setNewPhysicalForm)}><Plus size={14} className="pform-adder-icon" />Add</button>
                      </div>
                    </div>
                  </div>
                  <div className="pform-field">
                    <label>Store Badge</label>
                    <select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })}>
                      <option value="">None</option>
                      <option value="Best Seller">Best Seller</option>
                      <option value="100% Organic">100% Organic</option>
                      <option value="Top Rated">Top Rated</option>
                      <option value="Expert Choice">Expert Choice</option>
                      <option value="New Launch">New Launch</option>
                    </select>
                    <p className="pform-hint pform-badge-preview">
                      Card preview: {form.badge ? <span className="pform-chip">{form.badge}</span> : <em>no badge</em>}
                    </p>
                  </div>
                </section>

                {/* PRICING & STOCK */}
                <PricingSection
                  form={form}
                  setForm={setForm}
                  discountPercent={discountPercent}
                />

                {/* CROP, PEST & PACK TARGETING */}
                <section className="pform-section" id="pform-targeting">
                  <div className="pform-section-head">
                    <span className="pform-section-icon"><Sprout size={15} /></span>
                    <div>
                      <h3>Crop, Pest &amp; Pack Targeting</h3>
                      <span className="pform-section-sub">Drives the store's crop, pest and pack-size filters</span>
                    </div>
                  </div>

                  <div className="pform-field">
                    <label>Suitable Crops *</label>
                    <div className="pform-multiselect" ref={cropMenuRef}>
                      <button
                        type="button"
                        className="pform-multiselect-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={cropMenuOpen}
                        onClick={() => setCropMenuOpen(open => !open)}
                      >
                        <span className={selectedCrops.length ? '' : 'pform-multiselect-placeholder'}>
                          {selectedCrops.length ? `${selectedCrops.length} crop${selectedCrops.length === 1 ? '' : 's'} selected` : 'Select crops…'}
                        </span>
                        <ChevronDown size={15} className={`pform-multiselect-caret${cropMenuOpen ? ' open' : ''}`} aria-hidden="true" />
                      </button>
                      {cropMenuOpen && (
                        <div className="pform-multiselect-panel" role="listbox" aria-multiselectable="true">
                          {cropChoices.map(crop => {
                            const checked = selectedCrops.some(c => c.toLowerCase() === crop.toLowerCase())
                            return (
                              <label key={crop} className="pform-multiselect-option">
                                <input type="checkbox" checked={checked} onChange={() => toggleCrop(crop)} />
                                <span>{crop}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {selectedCrops.length > 0 && (
                      <div className="pform-chips">
                        {selectedCrops.map(c => <span key={c} className="pform-chip">{c}<button type="button" className="pform-chip-x" onClick={() => removeListItem('crops', c)} aria-label={`Remove ${c}`}><X size={11} /></button></span>)}
                      </div>
                    )}
                    <div className="pform-adder">
                      <input value={newCrop} onChange={e => setNewCrop(e.target.value)} placeholder="Not listed? Add a custom crop" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCrop(newCrop) } }} />
                      <button type="button" onClick={() => addCustomCrop(newCrop)}><Plus size={14} className="pform-adder-icon" />Add crop</button>
                    </div>
                  </div>

                  <div className="pform-field">
                    <label>Target Pests / Diseases * <em>(comma separated)</em></label>
                    <input
                      required
                      placeholder="e.g. Blast, Whitefly, Leaf Miner"
                      value={form.diseases}
                      onChange={e => setForm({ ...form, diseases: e.target.value })}
                    />
                    {form.diseases.trim() && (
                      <div className="pform-chips">
                        {form.diseases.split(',').map(s => s.trim()).filter(Boolean).map(d => <span key={d} className="pform-chip">{d}<button type="button" className="pform-chip-x" onClick={() => removeListItem('diseases', d)} aria-label={`Remove ${d}`}><X size={11} /></button></span>)}
                      </div>
                    )}
                    <p className="pform-hint">Powers the storefront's "Shop by Pest &amp; Disease" filters — a product only shows up there once it's tagged with the disease it treats.</p>
                    <div className="pform-adder">
                      <select value="" onChange={e => addFormOption('diseases', e.target.value, setNewDisease)}>
                        <option value="">Choose a known pest / disease</option>
                        {catalogOptions.diseases.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input value={newDisease} onChange={e => setNewDisease(e.target.value)} placeholder="Add a new pest / disease" />
                      <button type="button" onClick={() => addFormOption('diseases', newDisease, setNewDisease)}><Plus size={14} className="pform-adder-icon" />Add disease</button>
                    </div>
                  </div>

                  <div className="pform-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📦 Pack Sizes &amp; Individual Pricing (₹)</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--brand-400)' }}>Configure price &amp; MRP for each pack size</span>
                    </label>

                    <div className="pack-sizes-admin-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      {(form.packDetails || []).map((pd, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ flex: 1 }}>
                            <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pack Size Name</small>
                            <input
                              type="text"
                              value={pd.size}
                              placeholder="e.g. 250g, 1kg"
                              style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                              onChange={e => {
                                const val = e.target.value
                                setForm(current => {
                                  const next = [...(current.packDetails || [])]
                                  next[idx] = { ...next[idx], size: val }
                                  return { ...current, packDetails: next, packSizes: next.map(n => n.size).filter(Boolean).join(', ') }
                                })
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Selling Price (₹)</small>
                            <input
                              type="number"
                              value={pd.price}
                              placeholder="Selling ₹"
                              style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                              onChange={e => {
                                const val = e.target.value
                                setForm(current => {
                                  const next = [...(current.packDetails || [])]
                                  next[idx] = { ...next[idx], price: val }
                                  return { ...current, packDetails: next }
                                })
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>MRP / Original (₹)</small>
                            <input
                              type="number"
                              value={pd.mrp}
                              placeholder="MRP ₹"
                              style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                              onChange={e => {
                                const val = e.target.value
                                setForm(current => {
                                  const next = [...(current.packDetails || [])]
                                  next[idx] = { ...next[idx], mrp: val }
                                  return { ...current, packDetails: next }
                                })
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', marginTop: '14px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                            title="Remove this pack size"
                            onClick={() => {
                              setForm(current => {
                                const next = (current.packDetails || []).filter((_, i) => i !== idx)
                                return { ...current, packDetails: next, packSizes: next.map(n => n.size).filter(Boolean).join(', ') }
                              })
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <select
                        value=""
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                        onChange={e => {
                          const val = e.target.value
                          if (!val) return
                          setForm(current => {
                            const next = [...(current.packDetails || []), { size: val, price: '', mrp: '' }]
                            return { ...current, packDetails: next, packSizes: next.map(n => n.size).filter(Boolean).join(', ') }
                          })
                        }}
                      >
                        <option value="">Quick select saved pack size...</option>
                        {catalogOptions.storageBatches.map(batch => <option key={batch} value={batch}>{batch}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Custom size (e.g. 5kg)"
                        value={newStorageBatch}
                        onChange={e => setNewStorageBatch(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        onClick={() => {
                          const val = newStorageBatch.trim()
                          if (!val) return
                          setForm(current => {
                            const next = [...(current.packDetails || []), { size: val, price: '', mrp: '' }]
                            return { ...current, packDetails: next, packSizes: next.map(n => n.size).filter(Boolean).join(', ') }
                          })
                          setNewStorageBatch('')
                          persistCatalogOption('storageBatches', val, 'pack size')
                        }}
                      >
                        + Add Size
                      </button>
                    </div>
                  </div>
                </section>

                {/* PHOTOS & DESCRIPTION */}
                <MediaSection
                  form={form}
                  setForm={setForm}
                  photoList={photoList}
                  handlePhotoUpload={handlePhotoUpload}
                />

                {/* TARGETING & VISIBILITY */}
                <VisibilitySection
                  form={form}
                  setForm={setForm}
                  users={users}
                />

                {/* PRODUCT VIDEOS & DEMONSTRATIONS */}
                <VideosSection
                  form={form}
                  setForm={setForm}
                  availableVideos={availableVideos}
                  customVideoTitle={customVideoTitle}
                  setCustomVideoTitle={setCustomVideoTitle}
                  customVideoUrl={customVideoUrl}
                  setCustomVideoUrl={setCustomVideoUrl}
                />

                {/* ADVANCED / OPTIONAL DETAILS */}
                <AdvancedSection
                  form={form}
                  setForm={setForm}
                />
                {isEditing && <ProductTranslations product={editingOriginal} onSaved={fetchProducts} />}
              </div>
              </div>

              <div className="pform-footer">
                <span className="pform-footer-note">
                  {requiredDone === requiredChecks.length
                    ? <><Check size={14} aria-hidden="true" /> Ready to publish</>
                    : <>{requiredChecks.length - requiredDone} required {requiredChecks.length - requiredDone === 1 ? 'field' : 'fields'} left</>}
                </span>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || Boolean(sameNamed)} aria-busy={saving || undefined}>
                  {saving
                    ? (isEditing ? 'Saving…' : 'Publishing…')
                    : (isEditing ? 'Save Product Changes' : 'Save & Publish to Store')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
