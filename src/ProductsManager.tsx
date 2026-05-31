import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Package, Plus, Edit, Trash2, Search, X, Check, AlertCircle } from 'lucide-react'
import type { Product, ProductCategory } from './data/catalog'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

type ProductFormData = {
  id?: string
  title: string
  category: ProductCategory
  collection: string
  price: number
  image: string
  specs: string[]
  summary: string
  sourceUrl: string
  available: boolean
}

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    category: 'Лінолеум',
    collection: '',
    price: 0,
    image: '',
    specs: [],
    summary: '',
    sourceUrl: '',
    available: true
  })
  const [specInput, setSpecInput] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('title')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      setErrorMessage('Не вдалося завантажити товари')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...formData,
            id: formData.title.toLowerCase().replace(/\s+/g, '-')
          }])
        if (error) throw error
      }
      setIsModalOpen(false)
      setEditingProduct(null)
      resetForm()
      loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      setErrorMessage('Не вдалося зберегти товар')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей товар?')) return
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      if (error) throw error
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      setErrorMessage('Не вдалося видалити товар')
    }
  }

  const handleToggleAvailable = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ available: !product.available })
        .eq('id', product.id)
      if (error) throw error
      loadProducts()
    } catch (error) {
      console.error('Error toggling availability:', error)
      setErrorMessage('Не вдалося змінити доступність')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      id: product.id,
      title: product.title,
      category: product.category,
      collection: product.collection,
      price: product.price,
      image: product.image,
      specs: product.specs,
      summary: product.summary,
      sourceUrl: product.sourceUrl,
      available: product.available ?? true
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    resetForm()
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Лінолеум',
      collection: '',
      price: 0,
      image: '',
      specs: [],
      summary: '',
      sourceUrl: '',
      available: true
    })
    setSpecInput('')
    setErrorMessage('')
  }

  const addSpec = () => {
    if (specInput.trim()) {
      setFormData({ ...formData, specs: [...formData.specs, specInput.trim()] })
      setSpecInput('')
    }
  }

  const removeSpec = (index: number) => {
    setFormData({
      ...formData,
      specs: formData.specs.filter((_, i) => i !== index)
    })
  }

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.collection.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <main className="admin-shell">
        <section className="admin-login-card">
          <Package className="admin-spin" size={28} />
          <h1>Завантажуємо товари</h1>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <span>CRM</span>
          <h1>Управління товарами</h1>
        </div>
        <div className="admin-actions">
          <button className="button primary" onClick={handleAdd}>
            <Plus size={17} />
            <span>Додати товар</span>
          </button>
          <button className="button secondary" onClick={() => window.location.hash = '#/admin'}>
            Назад до адмінки
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="admin-error" style={{ marginBottom: '20px' }}>
          {errorMessage}
        </div>
      )}

      <section className="admin-panel" style={{ padding: '20px', marginBottom: '22px' }}>
        <div className="admin-panel-head" style={{ border: 'none', padding: '0 0 16px 0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 850, margin: 0 }}>Список товарів</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '250px'
                }}
              />
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <p className="admin-empty">Товарів не знайдено.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '16px',
                  background: product.available === false ? '#f5f5f5' : '#ffffff',
                  opacity: product.available === false ? 0.6 : 1,
                  transition: 'all 200ms ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>{product.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{product.collection}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleAvailable(product)}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        background: product.available ? 'var(--soft-green)' : '#f5f5f5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={product.available ? 'Зробити недоступним' : 'Зробити доступним'}
                    >
                      {product.available ? <Check size={14} /> : <AlertCircle size={14} />}
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Редагувати"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Видалити"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <img
                    src={`/${product.image}`}
                    alt={product.title}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      background: '#f5f5f5'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Категорія:</span>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{product.category}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Ціна:</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>{product.price} грн/м²</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Статус:</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: product.available ? 'var(--green)' : 'var(--muted)'
                  }}>
                    {product.available ? 'Доступний' : 'Недоступний'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 850, margin: 0 }}>
                {editingProduct ? 'Редагувати товар' : 'Додати новий товар'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className="admin-error" style={{ marginBottom: '16px' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Назва товару *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Категорія *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Лінолеум">Лінолеум</option>
                  <option value="ПВХ покриття">ПВХ покриття</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Колекція *
                </label>
                <input
                  type="text"
                  value={formData.collection}
                  onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Ціна (грн/м²) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Шлях до зображення *
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="products/назва.jpg"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Характеристики
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSpec()}
                    placeholder="Додати характеристику"
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={addSpec}
                    style={{
                      padding: '10px 16px',
                      background: 'var(--green)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Додати
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.specs.map((spec, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'var(--soft-green)',
                        borderRadius: '20px',
                        fontSize: '12px'
                      }}
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpec(index)}
                        style={{
                          padding: '2px',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Опис
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Посилання на джерело
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Доступний на складі
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--green)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}
                >
                  {editingProduct ? 'Зберегти зміни' : 'Додати товар'}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#ffffff',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
