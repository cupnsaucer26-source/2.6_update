import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'

const SECTION_CONTENT = {
  products: {
    title: 'All Products',
    intro: 'Browse crop protection products selected for reliable field performance.',
    links: [
      ['/products?category=Fungicide', 'Bio-Fungicides & Crop Care', 'Field-tested bio-protection solutions'],
      ['/categories', 'Shop by Category', 'Find products by agricultural formulation'],
      ['/#cropSection', 'Shop by Crop', 'Choose products customized for your crop']
    ]
  },
  categories: {
    title: 'Categories',
    intro: 'Choose the right crop-care formulation for your farm.',
    links: [
      ['/products?category=Fungicide', 'Bio-Fungicides', 'Protect crops from fungal disease'],
      ['/products?category=Insecticide', 'Insecticides', 'Manage common field pests'],
      ['/products?category=Herbicide', 'Herbicides', 'Control weeds with confidence'],
      ['/products?category=Bio-Stimulant', 'Bio-Stimulants', 'Support healthier plant growth']
    ]
  },
  brands: {
    title: 'Brands',
    intro: 'Discover Sathyam Agro Mart products and trusted crop-care solutions.',
    links: [
      ['/products', 'Sathyam Agro Mart Formulations', 'Bio-certified crop protection'],
      ['/products?category=Bio-Stimulant', 'Bio-Stimulants & Nutrition', 'Compare available formulations']
    ]
  },
}

export default function StoreSection({ type }) {
  const location = useLocation()
  const [dynamicOptions, setDynamicOptions] = useState(null)

  useEffect(() => {
    if (type === 'categories') {
      axios.get('/api/catalog-options')
        .then(({ data }) => { if (data.success && data.data) setDynamicOptions(data.data) })
        .catch(() => {})
    }
  }, [type])

  const section = SECTION_CONTENT[type] || SECTION_CONTENT.products
  const links = useMemo(() => {
    if (type === 'categories' && dynamicOptions?.categories?.length) {
      return dynamicOptions.categories.map(cat => [
        `/products?category=${encodeURIComponent(cat)}`,
        cat,
        `Agricultural formulations in ${cat}`
      ])
    }
    return section.links
  }, [type, dynamicOptions, section.links])

  return (
    <div className="store-section-page animate-fade-in">
      <div className="store-section-heading">
        <span className="badge badge-green">Sathyam Agro Mart Store</span>
        <h1>{section.title}</h1>
        <p>{section.intro}</p>
      </div>
      <div className="store-section-grid">
        {links.map(([href, title, description]) => (
          <Link className="store-section-card" to={href} key={href + title}>
            <strong>{title}</strong>
            <span>{description}</span>
            <small>Open page</small>
          </Link>
        ))}
      </div>
      {location.search && <p className="store-section-filter">Showing options for {new URLSearchParams(location.search).toString().replaceAll('=', ': ').replaceAll('&', ' | ')}</p>}
    </div>
  )
}
