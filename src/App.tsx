import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import { catalogMeta, collections, products } from './data/catalog'
import type { Product, ProductCategory } from './data/catalog'

type CategoryFilter = 'Усі' | ProductCategory
type SortMode = 'popular' | 'price-asc' | 'price-desc'

const phoneDisplay = '+38 (050) 308-99-09'
const phoneHref = 'tel:+380503089909'
const address = 'проспект Свободи, 85, Кременчук'
const email = 'evropol2009@ukr.net'

const currency = new Intl.NumberFormat('uk-UA')

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

const titleFixes: Record<string, string> = {
  'Актіва Элиот 6': 'Актіва Еліот 6',
  'LG Hausysy Decotile GSW 5717': 'LG Hausys Decotile GSW 5717',
}

const formatPrice = (price: number) => `${currency.format(price)} грн/м²`

const cleanTitle = (title: string) => titleFixes[title] ?? title

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
]).slice(0, 6)

function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('Усі')
  const [collection, setCollection] = useState('Усі колекції')
  const [maxPrice, setMaxPrice] = useState(catalogMeta.maxPrice)
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const [visibleCount, setVisibleCount] = useState(18)
  const [quoteIds, setQuoteIds] = useState<string[]>([])

  const selectedProducts = useMemo(
    () => quoteIds.map((id) => products.find((product) => product.id === id)).filter((item): item is Product => Boolean(item)),
    [quoteIds],
  )

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

  const toggleQuote = (id: string) => {
    setQuoteIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const resetFilters = () => {
    setQuery('')
    setCategory('Усі')
    setCollection('Усі колекції')
    setMaxPrice(catalogMeta.maxPrice)
    setSortMode('popular')
    setVisibleCount(18)
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Європол">
          <span className="brand-mark">Є</span>
          <span>
            <strong>Європол</strong>
            <small>склад-магазин підлог</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="Головна навігація">
          <a href="#catalog">Каталог</a>
          <a href="#price">Чому дешевше</a>
          <a href="#delivery">Доставка</a>
          <a href="#contact">Контакти</a>
        </nav>
        <a className="header-call" href={phoneHref}>
          <Phone size={18} aria-hidden="true" />
          <span>{phoneDisplay}</span>
        </a>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <h1>Лінолеум без шоурумної націнки</h1>
            <p>
              Європол у Кременчуці тримає склад на Свободи, 85, платить менше за оренду і може давати ціну
              на 100-150 грн за погонний метр нижче типових міських пропозицій.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#catalog">
                <span>Переглянути каталог</span>
                <ArrowRight size={19} aria-hidden="true" />
              </a>
              <a className="button secondary" href={phoneHref}>
                <Phone size={18} aria-hidden="true" />
                <span>Подзвонити</span>
              </a>
            </div>
            <div className="hero-proof" aria-label="Короткі переваги">
              <span>
                <BadgeCheck size={18} aria-hidden="true" />
                {catalogMeta.total} позиція в каталозі
              </span>
              <span>
                <Truck size={18} aria-hidden="true" />
                Доставка по Україні
              </span>
              <span>
                <Ruler size={18} aria-hidden="true" />
                Прорахунок під розмір кімнати
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Зразки покриттів Європол">
            <div className="sample-board">
              {heroProducts.map((product, index) => (
                <figure className={`sample-tile tile-${index + 1}`} key={product.id}>
                  <img src={product.image} alt={cleanTitle(product.title)} />
                  <figcaption>{product.collection}</figcaption>
                </figure>
              ))}
            </div>
            <div className="saving-panel">
              <strong>від {formatPrice(catalogMeta.minPrice)}</strong>
              <span>стартові позиції в наявності</span>
            </div>
          </div>
        </section>

        <section className="featured-strip" aria-label="Популярні позиції">
          <div className="strip-track">
            {featuredProducts.map((product) => (
              <a className="strip-item" href="#catalog" key={product.id}>
                <img src={product.image} alt="" />
                <span>{cleanTitle(product.title)}</span>
                <strong>{formatPrice(product.price)}</strong>
              </a>
            ))}
          </div>
        </section>

        <section className="section-pad catalog-section" id="catalog">
          <div className="section-heading wide">
            <div>
              <h2>Каталог покриттів</h2>
              <p>Пошук по назві, колекції, типу покриття і ціні. Дані підтягнуті з поточного каталогу Європолу.</p>
            </div>
            <div className="catalog-count">
              <strong>{filteredProducts.length}</strong>
              <span>знайдено</span>
            </div>
          </div>

          <div className="catalog-toolbar" aria-label="Фільтри каталогу">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Пошук: Soho, Дуб, LG..."
                type="search"
              />
            </label>

            <div className="segment" aria-label="Тип покриття">
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

            <button className="icon-reset" onClick={resetFilters} type="button" aria-label="Скинути фільтри">
              <RefreshCcw size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                isSelected={quoteIds.includes(product.id)}
                key={product.id}
                onToggleQuote={() => toggleQuote(product.id)}
                product={product}
              />
            ))}
          </div>

          {visibleProducts.length < filteredProducts.length && (
            <div className="load-more">
              <button className="button secondary" onClick={() => setVisibleCount((count) => count + 18)} type="button">
                <span>Показати ще</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        <section className="section-pad price-story" id="price">
          <div className="section-heading">
            <h2>Ціна нижча не магією, а географією</h2>
            <p>
              Магазин не витрачає бюджет на парадний шоурум у центрі. Клієнт платить за покриття, а не за блискучу
              вітрину на дорогій оренді.
            </p>
          </div>
          <div className="value-grid">
            <article>
              <Warehouse size={28} aria-hidden="true" />
              <h3>Склад-магазин</h3>
              <p>Товар лежить там, де його зручно зберігати, різати і швидко відвантажувати.</p>
            </article>
            <article>
              <ShieldCheck size={28} aria-hidden="true" />
              <h3>Асортимент без театру</h3>
              <p>Фокус на ходових колекціях Tarkett, Ideal, Beauflor, Juteks і LG Decotile.</p>
            </article>
            <article>
              <Calculator size={28} aria-hidden="true" />
              <h3>Прорахунок до сантиметра</h3>
              <p>Можна швидко оцінити кімнату, коридор або весь об'єкт без поїздки по місту.</p>
            </article>
          </div>
        </section>

        <section className="section-pad delivery-section" id="delivery">
          <div className="delivery-media">
            {heroProducts.slice(0, 4).map((product) => (
              <img src={product.image} alt={cleanTitle(product.title)} key={product.id} />
            ))}
          </div>
          <div className="delivery-copy">
            <h2>Підібрати, відрізати, доставити</h2>
            <p>
              Покриття можна обрати по фото, уточнити залишки телефоном і забрати зі складу. Для великих замовлень
              варто одразу назвати ширину рулону, метраж і місто доставки.
            </p>
            <ul>
              <li>
                <Check size={18} aria-hidden="true" />
                доставка по Україні
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                консультація по зносостійкості і товщині
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                швидкий підбір дешевших аналогів
              </li>
            </ul>
          </div>
        </section>

        <section className="section-pad contact-section" id="contact">
          <div className="contact-copy">
            <h2>Європол на Свободи, 85</h2>
            <p>Так, це промзона. Зате ціна не робить вигляд, що вона з бутіка.</p>
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
            <h3>Прорахунок</h3>
            {selectedProducts.length === 0 ? (
              <p>Додай позиції з каталогу, і тут з'явиться короткий список для дзвінка.</p>
            ) : (
              <ul>
                {selectedProducts.map((product) => (
                  <li key={product.id}>
                    <span>{cleanTitle(product.title)}</span>
                    <strong>{formatPrice(product.price)}</strong>
                  </li>
                ))}
              </ul>
            )}
            <a className="button primary full" href={phoneHref}>
              <Calculator size={18} aria-hidden="true" />
              <span>Уточнити наявність</span>
            </a>
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
              <span>Відкрити маршрут</span>
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>Європол, Кременчук</span>
        <span>Каталог оновлено з публічного сайту europolua.com</span>
      </footer>
    </div>
  )
}

type ProductCardProps = {
  product: Product
  isSelected: boolean
  onToggleQuote: () => void
}

function ProductCard({ product, isSelected, onToggleQuote }: ProductCardProps) {
  return (
    <article className="product-card">
      <a className="product-image" href={product.sourceUrl} target="_blank" rel="noreferrer">
        <img src={product.image} alt={cleanTitle(product.title)} loading="lazy" />
      </a>
      <div className="product-body">
        <div>
          <span className="product-category">{product.category}</span>
          <h3>{cleanTitle(product.title)}</h3>
          <p>{shortSummary(product)}</p>
        </div>
        <div className="product-facts">
          {productFacts(product).map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
        <div className="product-bottom">
          <strong>{formatPrice(product.price)}</strong>
          <button className={isSelected ? 'quote-button is-selected' : 'quote-button'} onClick={onToggleQuote} type="button">
            {isSelected ? <Check size={17} aria-hidden="true" /> : <Calculator size={17} aria-hidden="true" />}
            <span>{isSelected ? 'Додано' : 'В прорахунок'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default App
