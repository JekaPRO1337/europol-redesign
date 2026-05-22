import { useMemo, useState, useEffect, useRef } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Check,
  ChevronDown,
  MapPin,
  Navigation,
  Phone,
  RefreshCcw,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Warehouse,
  ShoppingCart,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Info
} from 'lucide-react'
import { catalogMeta, collections, products } from './data/catalog'
import type { Product, ProductCategory } from './data/catalog'

type CategoryFilter = 'Усі' | ProductCategory
type SortMode = 'popular' | 'price-asc' | 'price-desc'
type ActivePage = 'home' | 'catalog' | 'why-us' | 'delivery' | 'contacts'

type CartItem = {
  id: string
  product: Product
  width: number
  length: number
}

type RoomItem = {
  id: string
  productName: string
  productId: string
  width: number
  length: number
}

const phoneDisplay = '+38 (050) 308-99-09'
const phoneHref = 'tel:+380503089909'
const address = 'проспект Свободи, 85, Кременчук'
const email = 'evropol2009@ukr.net'

const currency = new Intl.NumberFormat('uk-UA')
const formatPrice = (price: number) => `${currency.format(price)} грн/м²`
const formatTotal = (price: number) => `${currency.format(price)} грн`

const titleFixes: Record<string, string> = {
  'Актіва Элиот 6': 'Актіва Еліот 6',
  'LG Hausysy Decotile GSW 5717': 'LG Hausys Decotile GSW 5717',
}
const cleanTitle = (title: string) => titleFixes[title] ?? title

const heroIds = [
  'форс-канвас-1',
  'преміум-сохо-3',
  'ультра-кракед-дуб-5',
  'lg-hausys-decotile-wood-7826',
  'олімпік-медісон-6',
  'квінтекс-гамбл-дуб-669-д',
]

const featuredIds = [
  'актіва-авеню-3',
  'комфорт-харвей-3',
  'форс-канвас-1',
  'преміум-сохо-3',
  'абсолют-луїс-4',
  'lg-hausys-decotile-wood-7826',
]

const shortSummary = (product: Product) => {
  if (product.category === 'ПВХ покриття') {
    return 'Кварц-вінілове LVT покриття для дому, офісу та комерційних просторів.'
  }
  if (product.summary.includes('напівкомерційний') || product.summary.includes('Напівкомерційний')) {
    return 'Напівкомерційний лінолеум для кімнат, коридорів і щоденного навантаження.'
  }
  if (product.summary.includes('Висока зносостійкість')) {
    return 'Зносостійке покриття з реалістичною структурою дерева або каменю.'
  }
  return 'Практичне покриття для житла, орендних квартир і швидких ремонтів.'
}

const factFrom = (text: string, pattern: RegExp, label: string) => {
  const match = text.match(pattern)
  return match ? `${label} ${match[1].replace(/\s+/g, ' ').trim()}` : ''
}

const productFacts = (product: Product) => {
  const source = product.summary
  const facts = [
    factFrom(source, /Загальна товщина:\s*([0-9,.]+\s*мм)/i, 'товщина'),
    factFrom(source, /Товщина робочого шару:\s*([0-9,.]+\s*мм)/i, 'шар'),
    factFrom(source, /Захисний шар:\s*([0-9,.]+\s*мм)/i, 'захист'),
    factFrom(source, /Клас зносостійкості:\s*([0-9/]+)/i, 'клас'),
  ].filter(Boolean)

  if (facts.length > 0) return [...new Set(facts)].slice(0, 3)
  return product.category === 'ПВХ покриття' ? ['LVT', '2,5 мм', 'захисний шар'] : ['побутовий', 'легкий догляд']
}

const uniqueById = (items: Product[]) => Array.from(new Map(items.map((item) => [item.id, item])).values())

const heroProducts = uniqueById([
  ...heroIds.map((id) => products.find((product) => product.id === id)).filter((item): item is Product => Boolean(item)),
  ...products,
]).slice(0, 6)

const featuredProducts = uniqueById([
  ...featuredIds
    .map((id) => products.find((product) => product.id === id))
    .filter((item): item is Product => Boolean(item)),
  ...products,
]).slice(0, 20)

function useInfiniteCarousel<T>(items: T[]) {
  const ref = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const trackBarRef = useRef<HTMLDivElement>(null)
  const doubled = [...items, ...items]

  useEffect(() => {
    const track = ref.current
    if (!track) return

    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const mouseDown = (e: MouseEvent) => {
      isDown = true
      startX = e.pageX - track.offsetLeft
      scrollLeft = track.scrollLeft
    }

    const mouseLeave = () => { isDown = false }
    const mouseUp = () => { isDown = false }

    const mouseMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - track.offsetLeft
      const walk = (x - startX) * 1.5
      track.scrollLeft = scrollLeft - walk
    }

    track.addEventListener('mousedown', mouseDown)
    track.addEventListener('mouseleave', mouseLeave)
    track.addEventListener('mouseup', mouseUp)
    track.addEventListener('mousemove', mouseMove)

    return () => {
      track.removeEventListener('mousedown', mouseDown)
      track.removeEventListener('mouseleave', mouseLeave)
      track.removeEventListener('mouseup', mouseUp)
      track.removeEventListener('mousemove', mouseMove)
    }
  }, [])

  useEffect(() => {
    const track = ref.current
    const thumb = thumbRef.current
    const bar = trackBarRef.current
    if (!track || !thumb || !bar) return

    let isDragging = false

    const syncThumb = () => {
      const maxScroll = track.scrollWidth - track.clientWidth
      if (maxScroll <= 0) {
        thumb.style.transform = 'translateX(0)'
        return
      }
      const ratio = track.scrollLeft / maxScroll
      const barWidth = bar.clientWidth
      const thumbWidth = thumb.clientWidth
      const maxTranslate = barWidth - thumbWidth
      thumb.style.transform = `translateX(${ratio * maxTranslate}px)`
    }

    const onThumbDown = (e: MouseEvent) => {
      isDragging = true
      thumb.classList.add('active')
      document.body.style.userSelect = 'none'
      e.preventDefault()
    }

    const onBarDown = (e: MouseEvent) => {
      const rect = bar.getBoundingClientRect()
      const maxScroll = track.scrollWidth - track.clientWidth
      if (maxScroll <= 0) return
      const ratio = (e.clientX - rect.left) / bar.clientWidth
      track.scrollLeft = ratio * maxScroll
    }

    const onMove = (e: MouseEvent) => {
      if (!isDragging) return
      const rect = bar.getBoundingClientRect()
      const maxScroll = track.scrollWidth - track.clientWidth
      if (maxScroll <= 0) return
      let ratio = (e.clientX - rect.left) / bar.clientWidth
      ratio = Math.max(0, Math.min(1, ratio))
      track.scrollLeft = ratio * maxScroll
    }

    const onUp = () => {
      isDragging = false
      thumb.classList.remove('active')
      document.body.style.userSelect = ''
    }

    track.addEventListener('scroll', syncThumb)
    window.addEventListener('resize', syncThumb)
    thumb.addEventListener('mousedown', onThumbDown)
    bar.addEventListener('mousedown', onBarDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

    syncThumb()

    return () => {
      track.removeEventListener('scroll', syncThumb)
      window.removeEventListener('resize', syncThumb)
      thumb.removeEventListener('mousedown', onThumbDown)
      bar.removeEventListener('mousedown', onBarDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return { ref, thumbRef, trackBarRef, items: doubled }
}

function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="52" height="52" className="brand-logo-svg" style={{ minWidth: '52px', marginRight: '10px' }}>
      <circle cx="50" cy="50" r="48" fill="#1c241f" />
      <circle cx="50" cy="50" r="43" fill="#d93829" />
      <circle cx="50" cy="50" r="37" fill="#1c241f" />
      <circle cx="50" cy="50" r="32" fill="#1e5f99" />
      <circle cx="50" cy="50" r="26" fill="#1c241f" />
      <circle cx="50" cy="50" r="21" fill="#69b036" />
      <circle cx="50" cy="50" r="15" fill="#1c241f" />
      <circle cx="50" cy="50" r="10" fill="#efc75f" />
      <circle cx="50" cy="50" r="5" fill="#1c241f" />
      <circle cx="50" cy="50" r="2" fill="#ffffff" />
      <path d="M 2 50 A 48 48 0 0 0 50 98 L 98 98 C 88 99, 70 100, 50 100 A 50 50 0 0 1 2 50 Z" fill="#1c241f" />
    </svg>
  )
}

function App() {
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<ActivePage>('home')

  // Catalog State
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('Усі')
  const [collection, setCollection] = useState('Усі колекції')
  const [maxPrice, setMaxPrice] = useState(catalogMeta.maxPrice)
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const [visibleCount, setVisibleCount] = useState(18)

  // Interactive Cart Drawer State
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Product Details Modal State
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null)
  const [modalWidth, setModalWidth] = useState<number>(3)
  const [modalLength, setModalLength] = useState<number>(5)

  // Room Calculator Widget State
  const [rooms, setRooms] = useState<RoomItem[]>([
    { id: '1', productName: '', productId: '', width: 3, length: 5 },
  ])
  const [calcPhone, setCalcPhone] = useState('')

  // Checkout Client Form State
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('380')

  const [deliveryMethod, setDeliveryMethod] = useState('Самовивіз з пр-т Свободи, 85 (0 грн)')

  // Featured carousel
  const { ref: trackRef, thumbRef, trackBarRef, items: carouselItems } = useInfiniteCarousel(featuredProducts)

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [successOrderDetails, setSuccessOrderDetails] = useState<string | null>(null)
  


  // Trigger Toast Notification helper
  const showToast = (message: string) => {
    setToastMessage(message)
  }

  // Clear toast automatically
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Custom Navigation function
  const navigateTo = (page: ActivePage) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Cart operations
  const addToCart = (product: Product, width: number, length: number) => {
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.width === width && item.length === length
    )

    if (existingIndex > -1) {
      showToast(`Розмір ${width}м x ${length}м для "${cleanTitle(product.title)}" вже є у кошику!`)
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${width}-${length}-${Date.now()}`,
        product,
        width,
        length,
      }
      setCart((current) => [...current, newItem])
      showToast(`"${cleanTitle(product.title)}" додано до кошика!`)
    }
  }

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id))
    showToast('Позицію видалено з кошика')
  }

  const updateCartItem = (id: string, updates: Partial<Pick<CartItem, 'width' | 'length'>>) => {
    setCart((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = products.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        cleanTitle(product.title).toLowerCase().includes(normalizedQuery) ||
        product.collection.toLowerCase().includes(normalizedQuery)
      const matchesCategory = category === 'Усі' || product.category === category
      const matchesCollection = collection === 'Усі колекції' || product.collection === collection
      const matchesPrice = product.price <= maxPrice

      return matchesQuery && matchesCategory && matchesCollection && matchesPrice
    })

    return result.sort((a, b) => {
      if (sortMode === 'price-asc') return a.price - b.price
      if (sortMode === 'price-desc') return b.price - a.price
      return featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id)
    })
  }, [category, collection, maxPrice, query, sortMode])

  const visibleProducts = filteredProducts.slice(0, visibleCount)

  const resetFilters = () => {
    setQuery('')
    setCategory('Усі')
    setCollection('Усі колекції')
    setMaxPrice(catalogMeta.maxPrice)
    setSortMode('popular')
    setVisibleCount(18)
  }

  // Open Details Modal and reset modal calculator defaults
  const openProductDetail = (product: Product) => {
    setSelectedProductForModal(product)
    setModalWidth(3)
    setModalLength(5)
  }

  // Home Calculator operations
  const addCalcRoom = () => {
    const newId = (rooms.length + 1).toString()
    setRooms([...rooms, { id: newId, productName: '', productId: '', width: 3, length: 5 }])
  }

  const removeCalcRoom = (id: string) => {
    if (rooms.length === 1) {
      setRooms([{ id: '1', productName: '', productId: '', width: 3, length: 5 }])
    } else {
      setRooms(rooms.filter((r) => r.id !== id))
    }
  }

  const handleRoomProductSelect = (roomId: string, value: string) => {
    // Find the product matching the selected option value (Title + price format or just Title)
    const found = products.find(
      (p) => `${cleanTitle(p.title)} (${p.price} грн/м²)` === value || cleanTitle(p.title) === value
    )
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              productName: value,
              productId: found ? found.id : '',
            }
          : room
      )
    )
  }

  const handleRoomDimensionChange = (roomId: string, field: 'width' | 'length', value: number) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              [field]: value,
            }
          : room
      )
    )
  }

  // Calculate totals for home calculator
  const calcTotalArea = useMemo(() => {
    return rooms.reduce((sum, r) => sum + r.width * r.length, 0)
  }, [rooms])

  const calcTotalPrice = useMemo(() => {
    return rooms.reduce((sum, r) => {
      const product = products.find((p) => p.id === r.productId)
      return sum + (product ? Math.round(r.width * r.length * product.price) : 0)
    }, 0)
  }, [rooms])

  // Viber Export for Room Calculator
  const handleCalcViberExport = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Construct Viber text
    let message = `📐 Запит на прорахунок кімнат:\n\n`
    if (calcPhone) {
      message += `📞 Контактний телефон: ${calcPhone}\n\n`
    }
    message += `🏢 Список приміщень:\n`

    let unpriced = false
    rooms.forEach((room, idx) => {
      const area = room.width * room.length
      const product = products.find((p) => p.id === room.productId)
      
      if (product) {
        const cost = Math.round(area * product.price)
        message += `${idx + 1}. Кімната ${idx + 1}: ${cleanTitle(product.title)} (${product.category})\n`
        message += `   Розмір: ${room.width}м x ${room.length}м | Площа: ${area.toFixed(1)} м²\n`
        message += `   Ціна: ${product.price} грн/м² | Вартість: ${cost} грн\n\n`
      } else {
        unpriced = true
        message += `${idx + 1}. Кімната ${idx + 1}: Покриття не обрано (${room.productName || 'Не вказано'})\n`
        message += `   Розмір: ${room.width}м x ${room.length}м | Площа: ${area.toFixed(1)} м²\n\n`
      }
    })

    message += `-------------------------\n`
    message += `📐 Загальна площа: ${calcTotalArea.toFixed(1)} м²\n`
    if (calcTotalPrice > 0) {
      message += `💰 Попередня сума: ${formatTotal(calcTotalPrice)}${unpriced ? ' (+необрані кімнати)' : ''}\n`
    }
    message += `\nБудь ласка, уточніть наявність цих розмірів на складі Європол.`

    // Copy to clipboard
    navigator.clipboard.writeText(message)
      .then(() => {
        showToast('Прорахунок скопійовано! Відкриваємо Viber...')
        setSuccessOrderDetails(message)
        // Delay opening to let state updates settle
        setTimeout(() => {
          window.open(`viber://chat?number=%2B380503089909`, '_blank')
        }, 800)
      })
      .catch((err) => {
        console.error('Failed to copy', err)
        showToast('Помилка копіювання. Спробуйте ще раз.')
      })
  }

  // Cart Totals
  const cartTotalArea = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.width * item.length, 0)
  }, [cart])

  const cartTotalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + Math.round(item.width * item.length * item.product.price), 0)
  }, [cart])

  const cartTotalWeight = useMemo(() => {
    return cartTotalArea * 2.2 // estimate 2.2kg per m² of quality linoleum
  }, [cartTotalArea])

  const deliveryCost = useMemo(() => {
    if (deliveryMethod.includes('Кременчук') && cartTotalPrice < 15000) return 250
    return 0 // self-pickup or region (paid separately to carrier)
  }, [deliveryMethod, cartTotalPrice])

  const grandTotal = cartTotalPrice + deliveryCost

  // Cart Form Order Submit (Viber Link + Copy message)
  const handleCartSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientPhone.trim()) {
      showToast('Введіть ваш контактний номер телефону!')
      return
    }

    let message = `🛒 Нове замовлення Європол Кременчук:\n\n`
    message += `👤 Клієнт: ${clientName || 'Не вказано'}\n`
    message += `📞 Телефон: ${clientPhone}\n`
    message += `🚚 Доставка: ${deliveryMethod}\n\n`
    message += `📦 Обрані товари:\n`

    cart.forEach((item, idx) => {
      const area = item.width * item.length
      const cost = Math.round(area * item.product.price)
      message += `${idx + 1}. ${cleanTitle(item.product.title)} (${item.product.category})\n`
      message += `   Розмір: ${item.width}м x ${item.length}м | Площа: ${area.toFixed(1)} м²\n`
      message += `   Ціна: ${item.product.price} грн/м² | Сума: ${cost} грн\n\n`
    })

    message += `-------------------------\n`
    message += `📐 Загальна площа: ${cartTotalArea.toFixed(1)} м²\n`
    message += `⚖️ Орієнтовна вага: ${cartTotalWeight.toFixed(1)} кг\n`
    if (deliveryCost > 0) {
      message += `🚚 Вартість доставки: ${deliveryCost} грн\n`
    }
    message += `💰 Разом до сплати: ${formatTotal(grandTotal)}\n\n`
    message += `Надіслано з сайту Європол.`

    navigator.clipboard.writeText(message)
      .then(() => {
        showToast('Замовлення скопійовано! Відкриваємо Viber...')
        setSuccessOrderDetails(message)
        setIsCartOpen(false)
        setTimeout(() => {
          window.open(`viber://chat?number=%2B380503089909`, '_blank')
        }, 800)
      })
      .catch((err) => {
        console.error('Failed to copy', err)
        showToast('Помилка копіювання.')
      })
  }

  // Dummy Payment Click handler
  const handleDummyPayment = (paymentType: string) => {
    if (cart.length === 0) return
    
    let message = `💳 Оплата замовлення через ${paymentType}:\n\n`
    message += `👤 Покупець: ${clientName || 'Швидкий покупець'}\n`
    message += `📞 Телефон: ${clientPhone || 'Не вказано'}\n`
    message += `🚚 Доставка: ${deliveryMethod}\n\n`
    message += `📦 Склад замовлення:\n`
    
    cart.forEach((item, idx) => {
      const area = item.width * item.length
      message += `${idx + 1}. ${cleanTitle(item.product.title)} - ${item.width}м x ${item.length}м (${area.toFixed(1)} м²)\n`
    })
    
    message += `\n💰 Сума: ${formatTotal(grandTotal)}\n`
    message += `Статус транзакції: [СИМУЛЯЦІЯ УСПІШНОЇ ОПЛАТИ]\n`
    message += `Менеджер зв'яжеться для відвантаження.`

    navigator.clipboard.writeText(message)
      .then(() => {
        showToast(`Оплату через ${paymentType} імітовано! Деталі скопійовано.`)
        setSuccessOrderDetails(message)
        setIsCartOpen(false)
        setCart([])
      })
  }

  return (
    <div className="site-shell">
      {/* Toast popup */}
      {toastMessage && (
        <div className="toast-notif" role="alert">
          <Info size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Checkout/Calculation Success Dialog */}
      {successOrderDetails && (
        <div className="order-success-overlay" onClick={() => setSuccessOrderDetails(null)}>
          <div className="order-success-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-circle">
              <Check size={32} />
            </div>
            <h3>Запит сформовано!</h3>
            <p>
              Деталі вашого прорахунку успішно скопійовано в буфер обміну. 
              Зараз вас буде перенаправлено до Viber менеджера Європол. 
              <strong> Будь ласка, вставте скопійований текст (Ctrl+V) у повідомлення та надішліть його!</strong>
            </p>
            <div style={{ background: '#f5f7f6', padding: '12px', borderRadius: '8px', fontSize: '12px', textAlign: 'left', maxHeight: '150px', overflowY: 'auto', marginBottom: '20px', whiteSpace: 'pre-line', fontFamily: 'monospace', border: '1px solid var(--line)' }}>
              {successOrderDetails}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="button secondary full" 
                onClick={() => {
                  navigator.clipboard.writeText(successOrderDetails)
                  showToast('Скопійовано!')
                }}
              >
                Копіювати ще раз
              </button>
              <button 
                className="button primary full" 
                onClick={() => {
                  window.open(`viber://chat?number=%2B380503089909`, '_blank')
                }}
              >
                У Viber
              </button>
            </div>
            <button className="modal-close-btn" style={{ top: '12px', right: '12px' }} onClick={() => setSuccessOrderDetails(null)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <div className="modal-overlay" onClick={() => setSelectedProductForModal(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProductForModal(null)} aria-label="Закрити">
              <X size={20} />
            </button>
            
            <div className="modal-grid">
              <div className="modal-image-pane">
                <img src={selectedProductForModal.image} alt={cleanTitle(selectedProductForModal.title)} />
              </div>
              
              <div className="modal-info-pane">
                <div>
                  <span className="product-category" style={{ display: 'inline-block', marginBottom: '6px' }}>
                    {selectedProductForModal.category} • {selectedProductForModal.collection}
                  </span>
                  <h2>{cleanTitle(selectedProductForModal.title)}</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
                    {shortSummary(selectedProductForModal)} {selectedProductForModal.summary.split('Технічні')[0]}
                  </p>
                </div>

                <div className="modal-specs-table">
                  <div className="modal-spec-row">
                    <span className="modal-spec-label">Ціна покриття:</span>
                    <span className="modal-spec-val" style={{ color: 'var(--green-dark)', fontSize: '15px' }}>
                      {formatPrice(selectedProductForModal.price)}
                    </span>
                  </div>
                  {selectedProductForModal.specs.length > 0 ? (
                    selectedProductForModal.specs.slice(0, 5).map((spec, idx) => {
                      const parts = spec.split(':')
                      if (parts.length > 1) {
                        return (
                          <div className="modal-spec-row" key={idx}>
                            <span className="modal-spec-label">{parts[0].trim()}:</span>
                            <span className="modal-spec-val">{parts.slice(1).join(':').trim()}</span>
                          </div>
                        )
                      }
                      return (
                        <div className="modal-spec-row" key={idx}>
                          <span className="modal-spec-label" style={{ gridColumn: '1 / -1' }}>{spec}</span>
                        </div>
                      )
                    })
                  ) : (
                    <>
                      <div className="modal-spec-row">
                        <span className="modal-spec-label">Призначення:</span>
                        <span className="modal-spec-val">Житлові та комерційні приміщення</span>
                      </div>
                      <div className="modal-spec-row">
                        <span className="modal-spec-label">Основа підлоги:</span>
                        <span className="modal-spec-val">Тепла дубльована основа</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Room Calculator box */}
                <div className="modal-calc-box">
                  <h4>Швидкий калькулятор вартості</h4>
                  <div className="modal-calc-inputs">
                    <div className="modal-calc-field">
                      <label htmlFor="modal-width-select">Ширина рулону (м)</label>
                      <select 
                        id="modal-width-select"
                        value={modalWidth} 
                        onChange={(e) => setModalWidth(Number(e.target.value))}
                      >
                        <option value={1.5}>1.5 м</option>
                        <option value={2}>2.0 м</option>
                        <option value={2.5}>2.5 м</option>
                        <option value={3}>3.0 м</option>
                        <option value={3.5}>3.5 м</option>
                        <option value={4}>4.0 м</option>
                      </select>
                    </div>
                    <div className="modal-calc-field">
                      <label htmlFor="modal-length-input">Довжина відрізу (м)</label>
                      <input 
                        id="modal-length-input"
                        type="number" 
                        min={0.5} 
                        step={0.1} 
                        value={modalLength}
                        onChange={(e) => setModalLength(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="modal-calc-result">
                    <span>Розрахункова площа: {(modalWidth * modalLength).toFixed(1)} м²</span>
                    <strong>{formatTotal(Math.round(modalWidth * modalLength * selectedProductForModal.price))}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button 
                    className="button primary full"
                    onClick={() => {
                      addToCart(selectedProductForModal, modalWidth, modalLength)
                      setSelectedProductForModal(null)
                    }}
                  >
                    <ShoppingCart size={18} />
                    <span>Додати в кошик</span>
                  </button>
                  <a 
                    className="button secondary" 
                    href={selectedProductForModal.sourceUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    title="Дивитися оригінал на старому сайті"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3>Ваш кошик</h3>
              <button className="cart-close-btn" onClick={() => setIsCartOpen(false)} aria-label="Закрити">
                <X size={20} />
              </button>
            </div>

            <div className="cart-drawer-content">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingCart size={48} />
                  <p>У кошику поки немає товарів</p>
                  <button 
                    className="button primary" 
                    onClick={() => {
                      setIsCartOpen(false)
                      navigateTo('catalog')
                    }}
                  >
                    Перейти до каталогу
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const area = item.width * item.length
                  const price = Math.round(area * item.product.price)
                  return (
                    <div className="cart-item-row" key={item.id}>
                      <img className="cart-item-img" src={item.product.image} alt={cleanTitle(item.product.title)} />
                      <div className="cart-item-details">
                        <h4>{cleanTitle(item.product.title)}</h4>
                        <span className="cart-item-spec">
                          Ширина: {item.width}м • Довжина: {item.length}м
                        </span>
                        <div className="cart-item-price-calc">
                          <strong>{area.toFixed(1)} м²</strong> x {item.product.price} грн = <strong>{formatTotal(price)}</strong>
                        </div>
                        
                        {/* Inline controls to edit dimensions directly in the cart drawer */}
                        <div className="cart-item-qty-control">
                          <select 
                            value={item.width}
                            onChange={(e) => updateCartItem(item.id, { width: Number(e.target.value) })}
                            style={{ padding: '2px 4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--line)', borderRadius: '4px' }}
                            aria-label="Оберіть ширину рулону"
                          >
                            <option value={1.5}>1.5 м</option>
                            <option value={2}>2.0 м</option>
                            <option value={2.5}>2.5 м</option>
                            <option value={3}>3.0 м</option>
                            <option value={3.5}>3.5 м</option>
                            <option value={4}>4.0 м</option>
                          </select>
                          <input 
                            type="number"
                            step={0.1}
                            min={0.5}
                            value={item.length}
                            onChange={(e) => updateCartItem(item.id, { length: Number(e.target.value) })}
                            className="cart-qty-input"
                            style={{ height: '20px', fontSize: '11px', width: '45px' }}
                            aria-label="Введіть довжину"
                          />
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>м</span>
                        </div>
                      </div>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} aria-label="Видалити позицію">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-summary-row">
                  <span>Всього ({cartTotalArea.toFixed(1)} м²):</span>
                  <strong>{formatTotal(cartTotalPrice)}</strong>
                </div>

                <form className="checkout-form" onSubmit={handleCartSubmit}>
                  <input 
                    className="checkout-input" 
                    type="text" 
                    placeholder="Ваше ім'я" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <input 
                    className="checkout-input" 
                    type="tel" 
                    placeholder="380XXXXXXXXX" 
                    required 
                    value={clientPhone}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val.startsWith('380') || val.length < 3) {
                        setClientPhone(val.length < 3 ? '380' : val)
                      }
                    }}
                  />
                  <select 
                    className="checkout-select" 
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    aria-label="Оберіть спосіб доставки"
                  >
                    <option value="Самовивіз з пр-т Свободи, 85 (0 грн)">Самовивіз (Кременчук, Свободи, 85) - 0 грн</option>
                    <option value="Доставка по м. Кременчук (250 грн)">Кур'єром по Кременчуку - 250 грн (від 15 тис. безкоштовно)</option>
                    <option value="Нова Пошта по Україні (за тарифами)">Нова Пошта - за тарифами</option>
                    <option value="Делівері / САТ по Україні (за тарифами)">Делівері / САТ - за тарифами</option>
                  </select>

                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', padding: '0 4px' }}>
                    * Орієнтовна вага вашого лінолеуму: <strong>{cartTotalWeight.toFixed(1)} кг</strong>
                  </div>

                  <button className="button primary full" type="submit" style={{ marginTop: '4px' }}>
                    <ShoppingCart size={18} />
                    <span>Уточнити наявність у Viber</span>
                  </button>
                </form>

                <div>
                  <div className="express-pay-title">Швидка симуляція оплати</div>
                  <div className="express-pay-grid">
                    <button className="express-btn apple-pay" onClick={() => handleDummyPayment('Apple Pay')}>
                      <span>Apple Pay</span>
                    </button>
                    <button className="express-btn google-pay" onClick={() => handleDummyPayment('Google Pay')}>
                      <span>Google Pay</span>
                    </button>
                    <button className="express-btn monobank" onClick={() => handleDummyPayment('Monobank')}>
                      <span>Сплатити через mono</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Site Header */}
      <header className="site-header">
        <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} aria-label="Європол">
          <Logo />
          <span>
            <strong>Європол</strong>
            <small>склад-магазин підлогового покриття</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="Головна навігація">
          <button className={`nav-btn ${currentPage === 'home' ? 'is-active' : ''}`} onClick={() => navigateTo('home')}>Головна</button>
          <button className={`nav-btn ${currentPage === 'catalog' ? 'is-active' : ''}`} onClick={() => navigateTo('catalog')}>Каталог</button>
          <button className={`nav-btn ${currentPage === 'why-us' ? 'is-active' : ''}`} onClick={() => navigateTo('why-us')}>Чому дешевше</button>
          <button className={`nav-btn ${currentPage === 'delivery' ? 'is-active' : ''}`} onClick={() => navigateTo('delivery')}>Доставка</button>
          <button className={`nav-btn ${currentPage === 'contacts' ? 'is-active' : ''}`} onClick={() => navigateTo('contacts')}>Контакти</button>
        </nav>

        <div className="header-actions-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="cart-trigger" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={18} />
            <span className="cart-text">Кошик</span>
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </button>
          <a className="header-call" href={phoneHref}>
            <Phone size={18} aria-hidden="true" />
            <span>{phoneDisplay}</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {currentPage === 'home' && (
          <>
            {/* HERO SECTION */}
            <section className="hero section-pad">
              <div className="hero-copy">
                <h1>Оригінальний лінолеум без шоурумної націнки</h1>
                <p>
                  Європол у Кременчуці працює у форматі «розумного складу». Ми імпортуємо та зберігаємо 
                  покриття безпосередньо на нашому складі на Свободи, 85. Відсутність витрат на дорогі вітрини 
                  дозволяє продавати лінолеум на 100-150 грн нижче за середні ціни роздрібних магазинів.
                </p>
                <div className="hero-actions">
                  <button className="button primary" onClick={() => navigateTo('catalog')}>
                    <span>Перейти до каталогу</span>
                    <ArrowRight size={19} aria-hidden="true" />
                  </button>
                  <a className="button secondary" href={phoneHref}>
                    <Phone size={18} aria-hidden="true" />
                    <span>Зателефонувати</span>
                  </a>
                </div>
                <div className="hero-proof" aria-label="Переваги Європол">
                  <span>
                    <BadgeCheck size={18} aria-hidden="true" />
                    {catalogMeta.total} моделей в наявності
                  </span>
                  <span>
                    <Truck size={18} aria-hidden="true" />
                    Швидка доставка по Україні
                  </span>
                  <span>
                    <Ruler size={18} aria-hidden="true" />
                    Безкоштовний поріз під розмір
                  </span>
                </div>
              </div>

              <div className="hero-visual" aria-label="Зразки покриттів Європол">
                <div className="sample-board">
                  {heroProducts.map((product, index) => (
                    <figure 
                      className={`sample-tile tile-${index + 1}`} 
                      key={product.id}
                      onClick={() => openProductDetail(product)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={product.image} alt={cleanTitle(product.title)} />
                      <figcaption>{product.collection}</figcaption>
                    </figure>
                  ))}
                </div>
                <div className="saving-panel" onClick={() => navigateTo('why-us')} style={{ cursor: 'pointer' }}>
                  <strong>від {formatPrice(catalogMeta.minPrice)}</strong>
                  <span>пряма ціна від офіційного дистриб'ютора</span>
                </div>
              </div>
            </section>

            {/* FEATURED CAROUSEL */}
            <section className="featured-strip" aria-label="Популярні моделі">
              <div className="strip-track" ref={trackRef}>
                {carouselItems.map((product, index) => (
                  <div 
                    className="strip-item" 
                    key={`${product.id}-${index}`}
                    onClick={() => openProductDetail(product)}
                  >
                    <img src={product.image} alt={cleanTitle(product.title)} />
                    <span>{cleanTitle(product.title)}</span>
                    <strong>{formatPrice(product.price)}</strong>
                  </div>
                ))}
              </div>
              <div className="strip-scrollbar" ref={trackBarRef}>
                <div className="strip-scrollbar-thumb" ref={thumbRef}></div>
              </div>
            </section>

            {/* MULTI-ITEM ROOM CALCULATOR */}
            <section className="section-pad" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
              <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div className="calc-widget">
                  <div className="calc-title-box">
                    <h3>Професійний калькулятор кімнат</h3>
                    <p>
                      Додавайте кімнати, обирайте покриття зі списку з автопошуком та задавайте індивідуальні розміри. 
                      Ми автоматично розрахуємо загальну квадратуру та суму, щоб ви могли уточнити наявність у Viber.
                    </p>
                  </div>

                  <form onSubmit={handleCalcViberExport}>
                    <div className="calc-table-header">
                      <div>Покриття підлоги (почніть вводити назву)</div>
                      <div style={{ textAlign: 'center' }}>Ширина рулону (м)</div>
                      <div style={{ textAlign: 'center' }}>Довжина (м)</div>
                      <div style={{ textAlign: 'right', paddingRight: '12px' }}>Площа (м²)</div>
                      <div style={{ textAlign: 'right', paddingRight: '12px' }}>Ціна (грн)</div>
                      <div></div>
                    </div>

                    <div className="calc-rows">
                      {rooms.map((room, idx) => {
                        const area = room.width * room.length
                        const product = products.find((p) => p.id === room.productId)
                        const cost = product ? Math.round(area * product.price) : 0

                        return (
                          <div className="calc-row" key={room.id}>
                            <div className="calc-cell">
                              <input 
                                list={`products-datalist-${room.id}`}
                                value={room.productName}
                                onChange={(e) => handleRoomProductSelect(room.id, e.target.value)}
                                placeholder="Оберіть лінолеум або введіть назву..."
                                required
                                aria-label={`Покриття для кімнати ${idx + 1}`}
                              />
                              <datalist id={`products-datalist-${room.id}`}>
                                {products.map((p) => (
                                  <option key={p.id} value={`${cleanTitle(p.title)} (${p.price} грн/м²)`} />
                                ))}
                              </datalist>
                            </div>

                            <div className="calc-cell">
                              <select 
                                value={room.width} 
                                onChange={(e) => handleRoomDimensionChange(room.id, 'width', Number(e.target.value))}
                                aria-label={`Ширина рулону для кімнати ${idx + 1}`}
                              >
                                <option value={1.5}>1.5 м</option>
                                <option value={2}>2.0 м</option>
                                <option value={2.5}>2.5 м</option>
                                <option value={3}>3.0 м</option>
                                <option value={3.5}>3.5 м</option>
                                <option value={4}>4.0 м</option>
                              </select>
                            </div>

                            <div className="calc-cell">
                              <input 
                                type="number" 
                                step={0.1}
                                min={0.5}
                                value={room.length} 
                                onChange={(e) => handleRoomDimensionChange(room.id, 'length', Number(e.target.value))}
                                placeholder="Довжина"
                                required
                                aria-label={`Довжина кімнати ${idx + 1}`}
                              />
                            </div>

                            <div className="calc-cell-text" data-label="Площа">
                              <span>{area.toFixed(1)} м²</span>
                            </div>

                            <div className="calc-cell-text" data-label="Вартість">
                              <strong>{cost > 0 ? formatTotal(cost) : '—'}</strong>
                            </div>

                            <div className="calc-cell calc-row-delete-mobile">
                              <button 
                                className="button secondary" 
                                type="button" 
                                onClick={() => removeCalcRoom(room.id)}
                                style={{ padding: '0', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', color: 'var(--red)', background: '#fff' }}
                                title="Видалити приміщення"
                                aria-label={`Видалити кімнату ${idx + 1}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <button className="calc-btn-add" type="button" onClick={addCalcRoom}>
                      <Plus size={16} />
                      <span>Додати кімнату</span>
                    </button>

                    <div className="calc-summary-section">
                      <div className="calc-total-box">
                        <span>Загальна площа: <strong>{calcTotalArea.toFixed(1)} м²</strong></span>
                        {calcTotalPrice > 0 && (
                          <span style={{ marginLeft: '12px' }}>Разом: <strong>{formatTotal(calcTotalPrice)}</strong></span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input 
                          type="tel" 
                          placeholder="Ваш телефон *" 
                          required 
                          value={calcPhone}
                          onChange={(e) => setCalcPhone(e.target.value)}
                          className="checkout-input" 
                          style={{ maxWidth: '220px', minHeight: '44px' }}
                        />
                        <button className="calc-viber-btn" type="submit">
                          <Phone size={18} />
                          <span>Перевірити наявність у Viber</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* PRICE STORY SECTION */}
            <section className="section-pad price-story" id="price">
              <div className="section-heading">
                <h2>Формат «Розумного складу»: Чому дешевше</h2>
                <p>
                  Ви купуєте те саме фірмове покриття бельгійських, французьких та українських виробників, 
                  але без націнок класичного торговельного центру.
                </p>
              </div>
              <div className="value-grid">
                <article>
                  <Warehouse size={28} aria-hidden="true" />
                  <h3>Пряма дистрибуція</h3>
                  <p>Усі товари відвантажуються безпосередньо з нашого складу, без додаткових ланок посередників.</p>
                </article>
                <article>
                  <ShieldCheck size={28} aria-hidden="true" />
                  <h3>Лише оригінальна якість</h3>
                  <p>Офіційні контракти з лідерами ринку: Tarkett, Ideal, Juteks, Beauflor та LG Hausys.</p>
                </article>
                <article>
                  <Calculator size={28} aria-hidden="true" />
                  <h3>Поріз з точністю до сантиметра</h3>
                  <p>Платіть лише за фактичну довжину вашої кімнати. Жодних переплат за зайві шматки чи округлення.</p>
                </article>
              </div>
            </section>

            {/* CONTACTS PREVIEW + ABOUT US SECTION */}
            <section className="section-pad contact-section" id="contact">
              <div className="contact-copy">
                <h2>Європол — склад-магазин підлогового покриття</h2>
                <p>
                  Ми спеціалізуємося на продажу лінолеуму, ПВХ-покриттів та кварц-вінілової плитки від провідних
                  європейських та українських виробників. Наш склад у Кременчуці за адресою проспект Свободи, 85 
                  працює щоденно для вашої зручності.
                </p>
                <div className="contact-actions">
                  <a className="button primary" href={phoneHref}>
                    <Phone size={18} aria-hidden="true" />
                    <span>{phoneDisplay}</span>
                  </a>
                  <a className="button secondary" href={`mailto:${email}`}>
                    <span>{email}</span>
                  </a>
                </div>
                <address>
                  <MapPin size={20} aria-hidden="true" />
                  <span>{address}</span>
                </address>
              </div>

              <div className="quote-panel">
                <h3>Швидкі дані</h3>
                <p>Все, що потрібно для швидкого зв'язку та планів.</p>
                <ul>
                  <li>
                    <span>Графік роботи</span>
                    <strong>Пн-Пт: 09-18, Сб: 09-15</strong>
                  </li>
                  <li>
                    <span>Доставка</span>
                    <strong>По Кременчуку від 250 грн</strong>
                  </li>
                  <li>
                    <span>Зв'язок</span>
                    <strong>
                      <span style={{ color: '#7360f2' }}>Viber</span>, <span style={{ color: '#229ed9' }}>Telegram</span>
                    </strong>
                  </li>
                </ul>
              </div>

              <div className="map-frame">
                <iframe
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=85%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%B8%2C%20%D0%9A%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D1%87%D1%83%D0%BA%2C%20%D0%A3%D0%BA%D1%80%D0%B0%D1%97%D0%BD%D0%B0&output=embed"
                  title="Європол на карті"
                />
                <a
                  className="map-link"
                  href="https://www.google.com/maps/search/?api=1&query=85%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%B8%2C%20%D0%9A%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D1%87%D1%83%D0%BA"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={17} aria-hidden="true" />
                  <span>Відкрити навігатор</span>
                </a>
              </div>
            </section>
          </>
        )}

        {currentPage === 'catalog' && (
          <section className="section-pad catalog-section" id="catalog">
            <div className="section-heading wide">
              <div>
                <h2>Каталог підлогових покриттів</h2>
                <p>Зручний пошук по всьому асортименту нашого складу. Поріз рулонів здійснюється під замовлення.</p>
              </div>
              <div className="catalog-count">
                <strong>{filteredProducts.length}</strong>
                <span>моделей знайдено</span>
              </div>
            </div>

            {/* CATALOG TOOLBAR */}
            <div className="catalog-toolbar" aria-label="Фільтрація та сортування">
              <label className="search-field">
                <Search size={18} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Шукати: Soho, Дуб, Tarkett, Ideal..."
                  type="search"
                />
              </label>

              <div className="segment" aria-label="Тип матеріалу">
                {(['Усі', 'Лінолеум', 'ПВХ покриття'] satisfies CategoryFilter[]).map((item) => (
                  <button
                    className={category === item ? 'is-active' : ''}
                    key={item}
                    onClick={() => setCategory(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <label className="select-field">
                <SlidersHorizontal size={18} aria-hidden="true" />
                <select value={collection} onChange={(event) => setCollection(event.target.value)}>
                  <option>Усі колекції</option>
                  {collections.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>

              <label className="select-field">
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                  <option value="popular">Рекомендовані</option>
                  <option value="price-asc">Спочатку дешевші</option>
                  <option value="price-desc">Спочатку дорожчі</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>

              <label className="range-field">
                <span>до {formatPrice(maxPrice)}</span>
                <input
                  max={catalogMeta.maxPrice}
                  min={catalogMeta.minPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  step="5"
                  type="range"
                  value={maxPrice}
                />
              </label>

              <button className="icon-reset" onClick={resetFilters} type="button" aria-label="Скинути всі фільтри">
                <RefreshCcw size={18} aria-hidden="true" />
              </button>
            </div>

            {/* PRODUCT GRID */}
            <div className="product-grid">
              {visibleProducts.map((product) => {
                const isAddedToCart = cart.some((item) => item.product.id === product.id)
                return (
                  <ProductCard
                    isSelected={isAddedToCart}
                    key={product.id}
                    onToggleQuote={() => {
                      if (isAddedToCart) {
                        setIsCartOpen(true)
                      } else {
                        openProductDetail(product)
                      }
                    }}
                    onOpenDetail={() => openProductDetail(product)}
                    product={product}
                  />
                )
              })}
            </div>

            {visibleProducts.length < filteredProducts.length && (
              <div className="load-more">
                <button className="button secondary" onClick={() => setVisibleCount((count) => count + 18)} type="button">
                  <span>Показати ще товари</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        )}

        {currentPage === 'why-us' && (
          <section className="section-pad container" style={{ maxWidth: '900px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '900', marginBottom: '16px' }}>Чому в нас дешевше? Концепція розумного складу</h1>
            <p style={{ fontSize: '18px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '32px' }}>
              Багато покупців звикли, що хороші товари продаються лише у скляних центрах з кондиціонерами та консультантами у краватках. 
              Проте красиве оформлення магазину не робить сам лінолеум кращим — воно лише робить його дорожчим. 
              Ми розповімо, на чому саме ми економимо, зберігаючи якість.
            </p>

            <div style={{ display: 'grid', gap: '24px', marginBottom: '40px' }}>
              <div style={{ background: 'var(--soft)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--green-dark)' }}>1. Складський формат замість вітрин</h3>
                <p style={{ lineHeight: '1.6', fontSize: '14px' }}>
                  Оренда виставкового залу площею 200 м² коштує в 5–7 разів дорожче, ніж оренда 
                  професійного логістичного приміщення аналогічної площі. 
                  Всі ці витрати конкуренти закладають у ціну кожного квадратного метра лінолеуму. Ми оптимізуємо 
                  витрати на приміщення, щоб ви платили менше за те саме покриття.
                </p>
              </div>

              <div style={{ background: 'var(--soft)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--green-dark)' }}>2. Ефективна команда спеціалістів</h3>
                <p style={{ lineHeight: '1.6', fontSize: '14px' }}>
                  У традиційних магазинах працює велика кількість персоналу: промоутери, адміністратори, касири, охоронці. 
                  В Європолі процеси оптимізовано. Ми залучаємо лише професійних менеджерів-технологів та операторів порізки. 
                  Ви спілкуєтеся безпосередньо з людьми, які знають різницю між ПВХ та напівкомерцією до найменших деталей.
                </p>
              </div>

              <div style={{ background: 'var(--soft)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--green-dark)' }}>3. Прямі дистриб'юторські контракти</h3>
                <p style={{ lineHeight: '1.6', fontSize: '14px' }}>
                  Ми не купуємо залишки у перекупників на оптових базах. Європол співпрацює безпосередньо з офіційними представництвами 
                  виробників лінолеуму. Це гарантує як оригінальність покриття (наявність сертифікатів), так і кращу вхідну ціну на ринку.
                </p>
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Порівняння витрат та націнок</h2>
            <div style={{ overflowX: 'auto', marginBottom: '40px', border: '1px solid var(--line)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--soft-green)', borderBottom: '2px solid var(--green)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--green-dark)' }}>Стаття витрат</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--muted)' }}>Звичайний бутік</th>
                    <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--green-dark)' }}>Європол</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>Вартість оренди приміщення</td>
                    <td style={{ padding: '12px 16px', color: 'var(--red)', fontWeight: '600' }}>Висока</td>
                    <td style={{ padding: '12px 16px', color: 'var(--green)', fontWeight: '700' }}>Оптимізована</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>Утримання виставкових стендів</td>
                    <td style={{ padding: '12px 16px' }}>Включено у вартість м²</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>Відсутнє</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>Штат працівників</td>
                    <td style={{ padding: '12px 16px' }}>Великий (до 10 осіб)</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>Компактна команда експертів</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>Середня націнка на м²</td>
                    <td style={{ padding: '12px 16px', color: 'var(--red)', fontWeight: '700' }}>30% – 50%</td>
                    <td style={{ padding: '12px 16px', color: 'var(--green)', fontWeight: '800' }}>10% – 20%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'center', background: 'var(--soft-green)', padding: '32px', borderRadius: '16px', border: '1px dashed var(--green)' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--green-dark)', marginBottom: '12px' }}>Бажаєте перевірити нашу ціну?</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                Оберіть будь-який товар у нашому каталозі або прорахуйте кімнати на головній сторінці. 
                Ви побачите реальну економію вже при першому порівнянні з роздрібними пропозиціями!
              </p>
              <button className="button primary" onClick={() => navigateTo('catalog')}>
                Перейти до каталогу покриттів
              </button>
            </div>
          </section>
        )}

        {currentPage === 'delivery' && (
          <section className="section-pad container" style={{ maxWidth: '900px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '900', marginBottom: '16px' }}>Доставка та отримання товарів</h1>
            <p style={{ fontSize: '18px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '32px' }}>
              Ми пропонуємо гнучкі умови доставки підлогового покриття як по Кременчуку та Кременчуцькому району, 
              так і транспортними службами по всій території України.
            </p>

            <div className="delivery-grid-cols" style={{ marginBottom: '40px' }}>
              <div style={{ border: '1px solid var(--line)', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--green-dark)' }}>
                  <Truck size={22} />
                  <span>По Кременчуку</span>
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.7', fontSize: '14px' }}>
                  <li><strong>Міська доставка:</strong> фіксовано 250 грн до під'їзду.</li>
                  <li><strong>Безкоштовно:</strong> при замовленні на суму від 15 000 грн.</li>
                  <li><strong>По області:</strong> 15 грн за кожен кілометр від межі міста.</li>
                  <li>Доставка здійснюється у зручний для вас узгоджений час.</li>
                </ul>
              </div>

              <div style={{ border: '1px solid var(--line)', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--green-dark)' }}>
                  <Navigation size={22} />
                  <span>Самовивіз із складу</span>
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.7', fontSize: '14px' }}>
                  <li><strong>Адреса складу:</strong> проспект Свободи, 85, Кременчук.</li>
                  <li><strong>Плата за видачу:</strong> 0 грн.</li>
                  <li><strong>Підготовка рулонів:</strong> ми безкоштовно поріжемо та допоможемо завантажити у ваше авто.</li>
                  <li>Будь ласка, узгоджуйте час приїзду заздалегідь, щоб товар було відрізано до вашого візиту.</li>
                </ul>
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Відправка по Україні</h2>
            <p style={{ lineHeight: '1.6', fontSize: '14px', marginBottom: '24px' }}>
              Ми щодня здійснюємо відвантаження рулонів та відрізів через провідні логістичні компанії: 
              <strong> Нова Пошта, Делівері та SAT</strong>. Завдяки партнерським договорам, вартість доставки великогабаритних рулонів 
              для наших клієнтів є мінімальною.
            </p>

            <div style={{ background: 'var(--soft)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>📦 Якісні стандарти пакування та транспортування</h3>
              <p style={{ lineHeight: '1.6', fontSize: '14px' }}>
                Ми розуміємо, що лінолеум — це чутливий до заломів матеріал. Тому Європол дотримується суворих стандартів пакування:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', lineHeight: '1.6', fontSize: '14px' }}>
                <li>Всі відрізи намотуються на жорсткі картонні шпулі (тубуси), що виключає деформацію при перевезенні.</li>
                <li>Рулони обертаються у кілька шарів щільної вологозахисної стрейч-плівки.</li>
                <li>На торці рулонів встановлюються захисні картонні ковпаки для запобігання пошкодженню країв під час навантаження.</li>
              </ul>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button className="button primary" onClick={() => navigateTo('contacts')}>
                Зв'язатися з логістом
              </button>
            </div>
          </section>
        )}

        {currentPage === 'contacts' && (
          <section className="section-pad container" style={{ maxWidth: '900px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '900', marginBottom: '16px' }}>Контакти Європол</h1>
            <p style={{ fontSize: '18px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '32px' }}>
              Наші двері завжди відкриті для відвідувачів. Зручний під'їзд як для легкових автомобілів, 
              так і для вантажівок. Завітайте до нас або зв'яжіться будь-яким зручним способом.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginBottom: '40px' }} className="contacts-grid-layout">
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: 'var(--green-dark)' }}>Інформація для зв'язку</h3>
                
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <MapPin style={{ color: 'var(--green)', marginTop: '3px' }} size={20} />
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block' }}>Адреса складу та магазину:</strong>
                      <span style={{ fontSize: '14px', color: 'var(--muted)' }}>{address}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <Phone style={{ color: 'var(--green)', marginTop: '3px' }} size={20} />
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block' }}>Телефони відділу продажів:</strong>
                      <a href={phoneHref} style={{ fontSize: '16px', fontWeight: '800', color: 'var(--green-dark)', display: 'block', textDecoration: 'none' }}>
                        {phoneDisplay}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <Truck style={{ color: 'var(--green)', marginTop: '3px' }} size={20} />
                    <div>
                      <strong style={{ fontSize: '14px', display: 'block' }}>Графік роботи складу:</strong>
                      <span style={{ fontSize: '14px', color: 'var(--muted)', display: 'block' }}>Понеділок – П'ятниця: 09:00 – 18:00</span>
                      <span style={{ fontSize: '14px', color: 'var(--muted)', display: 'block' }}>Субота: 09:00 – 15:00</span>
                      <span style={{ fontSize: '14px', color: 'var(--muted)', display: 'block' }}>Неділя: Вихідний</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '28px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Зв'язатися безпосередньо у месенджерах:</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a 
                      className="button primary" 
                      href={`viber://chat?number=%2B380503089909`}
                      style={{ background: '#7360f2', borderColor: '#7360f2' }}
                    >
                      <span>Viber</span>
                    </a>
                    <a 
                      className="button primary" 
                      href="https://t.me/europolua" 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ background: '#229ed9', borderColor: '#229ed9' }}
                    >
                      <span>Telegram</span>
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: 'var(--green-dark)' }}>Форма зворотного зв'язку</h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    showToast('Повідомлення надіслано! Ми зв\'яжемося з вами найближчим часом.')
                    const form = e.target as HTMLFormElement
                    form.reset()
                  }} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <input className="checkout-input" type="text" placeholder="Ваше ім'я" required />
                  <input className="checkout-input" type="tel" placeholder="Номер телефону для дзвінка" required />
                  <textarea 
                    className="checkout-input" 
                    placeholder="Ваше запитання щодо наявності чи доставки..." 
                    style={{ minHeight: '100px', paddingTop: '10px', paddingBottom: '10px', resize: 'vertical' }}
                    required
                  />
                  <button className="button primary full" type="submit">
                    Надіслати запит
                  </button>
                </form>
              </div>
            </div>

            <div className="map-frame" style={{ height: '400px', borderRadius: '16px', overflow: 'hidden' }}>
              <iframe
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=85%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%B8%2C%20%D0%9A%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D1%87%D1%83%D0%BA%2C%20%D0%A3%D0%BA%D1%80%D0%B0%D1%97%D0%BD%D0%B0&output=embed"
                title="Європол на карті детально"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
              <a
                className="map-link"
                href="https://www.google.com/maps/search/?api=1&query=85%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%B8%2C%20%D0%9A%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D1%87%D1%83%D0%BA"
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={17} aria-hidden="true" />
                <span>Відкрити навігацію на Google Картах</span>
              </a>
            </div>
          </section>
        )}
      </main>

      {/* Site Footer */}
      <footer className="site-footer">
        <span>&copy; {new Date().getFullYear()} Європол — склад-магазин підлогового покриття. Кременчук, проспект Свободи, 85</span>
        <span>Каталог оновлено з офіційного джерела europolua.com</span>
      </footer>

      {/* Floating Cart Button for Mobile Screens */}
      {cart.length > 0 && !isCartOpen && (
        <button 
          className="mobile-floating-cart-btn" 
          onClick={() => setIsCartOpen(true)}
          aria-label="Відкрити кошик"
        >
          <ShoppingCart size={22} />
          <span className="floating-badge">{cart.length}</span>
        </button>
      )}

      {/* Sticky Bottom Bar for Mobile Layout */}
      <div className="mobile-nav-bar" aria-label="Мобільне меню">
        <button 
          className={`mobile-nav-btn ${currentPage === 'home' ? 'is-active' : ''}`} 
          onClick={() => navigateTo('home')}
        >
          <Warehouse size={18} />
          <span>Головна</span>
        </button>
        <button 
          className={`mobile-nav-btn ${currentPage === 'catalog' ? 'is-active' : ''}`} 
          onClick={() => navigateTo('catalog')}
        >
          <Search size={18} />
          <span>Каталог</span>
        </button>
        <button 
          className={`mobile-nav-btn ${currentPage === 'delivery' ? 'is-active' : ''}`} 
          onClick={() => navigateTo('delivery')}
        >
          <Truck size={18} />
          <span>Доставка</span>
        </button>
        <button 
          className={`mobile-nav-btn ${currentPage === 'contacts' ? 'is-active' : ''}`} 
          onClick={() => navigateTo('contacts')}
        >
          <MapPin size={18} />
          <span>Контакти</span>
        </button>
        <button 
          className="mobile-nav-btn" 
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart size={18} />
          <span>Кошик</span>
          {cart.length > 0 && <span className="badge">{cart.length}</span>}
        </button>
      </div>
    </div>
  )
}

type ProductCardProps = {
  product: Product
  isSelected: boolean
  onToggleQuote: () => void
  onOpenDetail: () => void
}

function ProductCard({ product, isSelected, onToggleQuote, onOpenDetail }: ProductCardProps) {
  return (
    <article className="product-card">
      <div 
        className="product-image" 
        onClick={onOpenDetail} 
        style={{ 
          cursor: 'pointer',
          backgroundImage: `url(${product.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="product-body">
        <div>
          <span className="product-category">{product.category}</span>
          <h3 onClick={onOpenDetail} style={{ cursor: 'pointer', transition: 'color 150ms ease' }} className="product-title-h3">
            {cleanTitle(product.title)}
          </h3>
          <p>{shortSummary(product)}</p>
        </div>
        <div className="product-facts">
          {productFacts(product).map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
        <div className="product-bottom">
          <strong>{formatPrice(product.price)}</strong>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={isSelected ? 'quote-button is-selected' : 'quote-button'} 
              onClick={onToggleQuote} 
              type="button"
            >
              {isSelected ? <Check size={17} aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}
              <span>{isSelected ? 'У кошику' : 'Обрати'}</span>
            </button>
            <button 
              className="button secondary" 
              onClick={onOpenDetail} 
              style={{ padding: '0 10px', height: '38px', minWidth: 'auto' }}
              title="Характеристики та калькулятор"
              aria-label={`Детальніше про ${cleanTitle(product.title)}`}
            >
              <Info size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default App
