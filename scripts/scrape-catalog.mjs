import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const BASE_URL = 'https://europolua.com'
const CATEGORIES = [
  { path: '/лінолеум', label: 'Лінолеум' },
  { path: '/пвх-покриття', label: 'ПВХ покриття' },
]

const OUT_DIR = join(process.cwd(), 'public', 'products')
const DATA_FILE = join(process.cwd(), 'src', 'data', 'catalog.ts')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeWhitespace = (value) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const decodeEntities = (value) =>
  normalizeWhitespace(
    value
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>'),
  )

const stripTags = (value) =>
  decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<\/(p|tr|li|td|th|h\d)>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )

const cleanText = (value) =>
  value
    .replace(/LG Hausysy/g, 'LG Hausys')
    .replace(/Элиот/g, 'Еліот')
    .replace(/Дублин/g, 'Дублін')
    .replace(/Класс/g, 'Клас')
    .replace(/Размір/g, 'Розмір')
    .replace(/высокою/g, 'високою')
    .replace(/дошкольні/g, 'дошкільні')
    .replace(/іноваційне/g, 'інноваційне')
    .replace(/найширочайша/g, 'широка')

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '')

const fileSlug = (value) => slugify(value).slice(0, 90)

const absoluteUrl = (path) => {
  if (path.startsWith('http')) return path
  return `${BASE_URL}${path}`
}

const fetchText = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
  return response.text()
}

const fetchImage = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch image ${url}: ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  const buffer = Buffer.from(await response.arrayBuffer())
  return { buffer, contentType }
}

const getMatch = (html, pattern) => {
  const match = html.match(pattern)
  return match ? decodeEntities(match[1]) : ''
}

const getSummary = (html) => {
  const summary =
    html.match(/(<span style="display:\s*inline-block"[\s\S]*?)\s*<div class="footer_menu">/i) ??
    html.match(/(<div class="summary entry-summary"[\s\S]*?)\s*<div class="footer_menu">/i)

  if (!summary) return ''
  return stripTags(summary[1]).slice(0, 520)
}

const getCollection = (title, category) => {
  if (category === 'ПВХ покриття') return 'LG Hausys Decotile'

  const known = [
    'Ідилія Нова',
    'Спрінт Про',
    'Абсолют',
    'Преміум',
    'Енерджі',
    'Форс',
    'Актіва',
    'Адмірал',
    'Бонус',
    'Каприз',
    'Комфорт',
    'Дельта',
    'Еволюшн',
    'Фреш',
    'Олімпік',
    'Смарт',
    'Європа',
    'Форум',
    'Ультра',
    'Супрім',
    'Квінтекс',
    'Піетро',
  ]

  return known.find((name) => title.startsWith(name)) ?? title.split(' ')[0]
}

const getSpecs = (text) => {
  const specs = []
  const candidates = [
    /Загальна товщина[^0-9]*(\d+[,.]?\d*)\s*мм/i,
    /Товщина[^0-9]*(\d+[,.]?\d*)\s*мм/i,
    /Захисний шар[^0-9]*(\d+[,.]?\d*)\s*мм/i,
    /Класс зносостійкості[:\s]*(\d+)/i,
    /Клас зносостійкості[:\s]*(\d+)/i,
    /Размір упаковки[:\s]*(\d+[,.]?\d*)\s*м\.?кв/i,
    /Розмір упаковки[:\s]*(\d+[,.]?\d*)\s*м\.?кв/i,
    /Ширина[:\s]*(\d+[,.]?\d*)\s*мм/i,
  ]

  for (const pattern of candidates) {
    const match = text.match(pattern)
    if (match) specs.push(normalizeWhitespace(match[0]))
  }

  return [...new Set(specs)].slice(0, 3)
}

const collectLinks = async () => {
  const links = new Map()

  for (const category of CATEGORIES) {
    const html = await fetchText(absoluteUrl(encodeURI(category.path)))
    const linkPattern = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    let match

    while ((match = linkPattern.exec(html))) {
      const href = decodeEntities(match[1])
      if (!href.startsWith(category.path + '/')) continue

      const label = stripTags(match[2])
      links.set(href, {
        category: category.label,
        href,
        label,
      })
    }
  }

  return [...links.values()]
}

const parseProduct = async (link, index) => {
  const pageUrl = absoluteUrl(encodeURI(link.href))
  const html = await fetchText(pageUrl)
  const title = cleanText(getMatch(html, /<h2 class="title">\s*([^<]+)/i) || link.label)
  const price = Number(getMatch(html, /<div class="price">\s*Цена:\s*([0-9]+)/i) || 0)
  const imagePath = getMatch(html, /<a href="([^"]+)"[^>]*class="highslide"/i)
  const thumbnailPath = getMatch(html, /<img src="([^"]+)" class="main"/i)
  const summary = cleanText(getSummary(html))
  const specs = getSpecs(summary)
  const collection = getCollection(title, link.category)

  let image = ''
  if (imagePath || thumbnailPath) {
    const candidateUrls = [imagePath, thumbnailPath].filter(Boolean).map(absoluteUrl)
    let imageUrl = candidateUrls[0]
    let imageResponse = await fetchImage(imageUrl)

    if (!imageResponse.contentType.startsWith('image/') || imageResponse.buffer.length === 0) {
      imageUrl = candidateUrls[1] ?? imageUrl
      imageResponse = await fetchImage(imageUrl)
    }

    const extension = extname(new URL(imageUrl).pathname) || '.jpg'
    const filename = `${String(index + 1).padStart(2, '0')}-${fileSlug(title)}${extension}`
    await writeFile(join(OUT_DIR, filename), imageResponse.buffer)
    image = `/products/${filename}`
  }

  return {
    id: slugify(title),
    title,
    category: link.category,
    collection,
    price,
    image,
    specs,
    summary,
    sourceUrl: pageUrl,
  }
}

await mkdir(OUT_DIR, { recursive: true })

const links = await collectLinks()
const products = []

for (const [index, link] of links.entries()) {
  products.push(await parseProduct(link, index))
  await sleep(80)
}

products.sort((a, b) => a.category.localeCompare(b.category, 'uk') || a.title.localeCompare(b.title, 'uk'))

const collections = [...new Set(products.map((product) => product.collection))].sort((a, b) =>
  a.localeCompare(b, 'uk'),
)

const content = `export type ProductCategory = 'Лінолеум' | 'ПВХ покриття'

export type Product = {
  id: string
  title: string
  category: ProductCategory
  collection: string
  price: number
  image: string
  specs: string[]
  summary: string
  sourceUrl: string
}

export const products = ${JSON.stringify(products, null, 2)} satisfies Product[]

export const collections = ${JSON.stringify(collections, null, 2)}

export const catalogMeta = {
  total: products.length,
  minPrice: Math.min(...products.map((product) => product.price)),
  maxPrice: Math.max(...products.map((product) => product.price)),
  source: '${BASE_URL}',
}
`

await mkdir(join(process.cwd(), 'src', 'data'), { recursive: true })
await writeFile(DATA_FILE, content)

console.log(`Saved ${products.length} products to ${DATA_FILE}`)
