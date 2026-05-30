import { useEffect, useMemo, useState } from 'react'
import {
  Calculator,
  CheckCircle2,
  Eye,
  LogOut,
  PackageCheck,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import {
  fetchCalculatorRequests,
  fetchOrders,
  updateOrderStatus,
  type CalculatorRequestRecord,
  type OrderRecord,
  type OrderStatus,
} from './lib/crm'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type StatusFilter = OrderStatus | 'all'

const statusLabels: Record<OrderStatus, string> = {
  new: 'Нова',
  in_progress: 'В роботі',
  completed: 'Завершена',
  cancelled: 'Скасована',
}

const statusOptions: StatusFilter[] = ['all', 'new', 'in_progress', 'completed', 'cancelled']

const money = new Intl.NumberFormat('uk-UA')

const formatMoney = (value: number) => `${money.format(value)} грн`
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export default function AdminPage() {
  const [isReady, setIsReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [calculatorRequests, setCalculatorRequests] = useState<CalculatorRequestRecord[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stats = useMemo(() => {
    const newOrders = orders.filter((order) => order.status === 'new').length
    const completed = orders.filter((order) => order.status === 'completed').length
    const total = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)

    return { newOrders, completed, total }
  }, [orders])

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [ordersData, calcData] = await Promise.all([
        fetchOrders(statusFilter, phoneSearch),
        fetchCalculatorRequests(phoneSearch),
      ])
      setOrders(ordersData)
      setCalculatorRequests(calcData)
      setSelectedOrder((current) => {
        if (!current) return ordersData[0] ?? null
        return ordersData.find((order) => order.id === current.id) ?? ordersData[0] ?? null
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не вдалося завантажити CRM.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(Boolean(data.session))
      setIsReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session))
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isAuthed) void loadData()
  }, [isAuthed, statusFilter])

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorMessage('Неправильно введено пароль або емейл.')
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setOrders([])
    setCalculatorRequests([])
    setSelectedOrder(null)
  }

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setErrorMessage(null)
    try {
      await updateOrderStatus(orderId, status)
      await loadData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не вдалося змінити статус.')
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="admin-shell">
        <section className="admin-login-card">
          <ShieldCheck size={30} />
          <h1>Supabase ще не налаштований</h1>
          <p>Додай `VITE_SUPABASE_URL` і `VITE_SUPABASE_PUBLISHABLE_KEY` в `.env.local`, після цього перезапусти dev server.</p>
        </section>
      </main>
    )
  }

  if (!isReady) {
    return (
      <main className="admin-shell">
        <section className="admin-login-card">
          <RefreshCcw className="admin-spin" size={28} />
          <h1>Завантажуємо CRM</h1>
        </section>
      </main>
    )
  }

  if (!isAuthed) {
    return (
      <main className="admin-shell">
        <form className="admin-login-card" onSubmit={handleSignIn}>
          <ShieldCheck size={32} />
          <h1>Адмінка Європол</h1>
          <p>Увійдіть під креденціалами адміна.</p>
          <input
            className="checkout-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@email.com"
            type="email"
            value={email}
            required
          />
          <input
            className="checkout-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            type="password"
            value={password}
            required
          />
          {errorMessage && <div className="admin-error">{errorMessage}</div>}
          <button className="button primary full" disabled={isLoading} type="submit">
            {isLoading ? 'Перевіряємо...' : 'Увійти'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <span>CRM</span>
          <h1>Заявки Європол</h1>
        </div>
        <div className="admin-actions">
          <a className="button secondary" href="/">
            На сайт
          </a>
          <button className="button secondary" onClick={handleSignOut} type="button">
            <LogOut size={17} />
            <span>Вийти</span>
          </button>
        </div>
      </header>

      <section className="admin-stats">
        <article>
          <Phone size={24} />
          <span>Нових заявок</span>
          <strong>{stats.newOrders}</strong>
        </article>
        <article>
          <CheckCircle2 size={24} />
          <span>Завершених</span>
          <strong>{stats.completed}</strong>
        </article>
        <article>
          <PackageCheck size={24} />
          <span>Сума заявок</span>
          <strong>{formatMoney(stats.total)}</strong>
        </article>
        <article>
          <Calculator size={24} />
          <span>Калькулятор</span>
          <strong>{calculatorRequests.length}</strong>
        </article>
      </section>

      <section className="admin-filters">
        <label className="select-field">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'Усі статуси' : statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="search-field">
          <Search size={18} />
          <input
            onChange={(event) => setPhoneSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadData()
            }}
            placeholder="Пошук за телефоном"
            type="search"
            value={phoneSearch}
          />
        </label>
        <button className="button primary" disabled={isLoading} onClick={loadData} type="button">
          <RefreshCcw className={isLoading ? 'admin-spin' : ''} size={17} />
          <span>Оновити</span>
        </button>
      </section>

      {errorMessage && <div className="admin-error">{errorMessage}</div>}

      <section className="admin-workbench">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Замовлення</h2>
            <span>{orders.length}</span>
          </div>

          <div className="admin-table-wrap">
            {orders.length === 0 ? (
              <p className="admin-empty">Заявок поки немає.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Клієнт</th>
                    <th>Телефон</th>
                    <th>Статус</th>
                    <th>Сума</th>
                    <th>Джерело</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      className={selectedOrder?.id === order.id ? 'is-selected' : ''}
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td>{formatDate(order.created_at)}</td>
                      <td>
                        <strong>{order.customer_name || 'Без імені'}</strong>
                      </td>
                      <td>{order.phone}</td>
                      <td>
                        <select
                          aria-label="Статус заявки"
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => void handleStatusChange(order.id, event.target.value as OrderStatus)}
                          value={order.status}
                        >
                          {(['new', 'in_progress', 'completed', 'cancelled'] satisfies OrderStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <b>{formatMoney(Number(order.total_price || 0))}</b>
                      </td>
                      <td>{order.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Товари заявки</h2>
            {selectedOrder && <span>{selectedOrder.order_items?.length ?? 0}</span>}
          </div>

          <div className="admin-table-wrap">
            {selectedOrder ? (
            <div className="admin-detail-table">
              <div className="admin-detail-meta">
                <span>Джерело: {selectedOrder.source}</span>
                <span>Оплата: {selectedOrder.payment_method}</span>
                <span>{selectedOrder.needs_callback ? 'Потрібен дзвінок' : 'Без дзвінка'}</span>
              </div>
              {selectedOrder.comment && <p>{selectedOrder.comment}</p>}
              <table className="admin-table admin-items-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Розмір</th>
                    <th>Площа</th>
                    <th>Ціна</th>
                    <th>Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.order_items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.product_name}</strong>
                      </td>
                      <td>
                        {item.width}м x {item.length}м
                      </td>
                      <td>{item.area.toFixed(1)} м²</td>
                      <td>{formatMoney(Number(item.product_price))}</td>
                      <td>
                        <b>{formatMoney(Math.round(item.area * item.product_price * item.quantity))}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">Обери заявку для перегляду товарів.</p>
          )}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>Запити калькулятора</h2>
          <span>{calculatorRequests.length}</span>
        </div>
        <div className="admin-table-wrap">
          {calculatorRequests.length === 0 ? (
            <p className="admin-empty">Запитів калькулятора поки немає.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Телефон</th>
                  <th>Сума</th>
                  <th>Коментар</th>
                  <th>Товари</th>
                </tr>
              </thead>
              <tbody>
                {calculatorRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{formatDate(request.created_at)}</td>
                    <td>
                      <strong>{request.phone || 'Телефон не вказано'}</strong>
                    </td>
                    <td>
                      <b>{formatMoney(Number(request.calculated_price || 0))}</b>
                    </td>
                    <td>{request.comment || '—'}</td>
                    <td>
                      <details>
                        <summary>
                          <Eye size={16} />
                          <span>Товари</span>
                        </summary>
                        <ul>
                          {(request.selected_products ?? []).map((product, index) => (
                            <li key={`${request.id}-${index}`}>
                              {product.product_name || 'Покриття не обрано'} — {product.area.toFixed(1)} м²
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  )
}
