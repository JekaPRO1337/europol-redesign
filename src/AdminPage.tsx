import { useEffect, useMemo, useState } from 'react'
import {
  Calculator,
  CheckCircle2,
  Eye,
  LogOut,
  Package,
  PackageCheck,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import {
  fetchCalculatorRequests,
  fetchOrders,
  updateOrderStatus,
  deleteOrder,
  deleteCalculatorRequest,
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
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [hoveredDay, setHoveredDay] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'calculator'>('orders')
  const [showOrdersLine, setShowOrdersLine] = useState(true)
  const [showCalcsLine, setShowCalcsLine] = useState(true)

  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) return orders
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at)
      if (startDate && orderDate < new Date(startDate)) return false
      if (endDate && orderDate > new Date(endDate + 'T23:59:59')) return false
      return true
    })
  }, [orders, startDate, endDate])

  const filteredCalculatorRequests = useMemo(() => {
    if (!startDate && !endDate) return calculatorRequests
    return calculatorRequests.filter((c) => {
      const calcDate = new Date(c.created_at)
      if (startDate && calcDate < new Date(startDate)) return false
      if (endDate && calcDate > new Date(endDate + 'T23:59:59')) return false
      return true
    })
  }, [calculatorRequests, startDate, endDate])

  const stats = useMemo(() => {
    const newOrders = filteredOrders.filter((order) => order.status === 'new').length
    const completed = filteredOrders.filter((order) => order.status === 'completed').length
    const total = filteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)

    return { newOrders, completed, total }
  }, [filteredOrders])

  const chartData = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date()
    const result: { dateStr: string; label: string; orders: number; calcs: number; revenue: number }[] = []

    // Generate date range
    const currentDate = new Date(start)
    while (currentDate <= end) {
      const dateStr = currentDate.toLocaleDateString('en-CA')
      const label = currentDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
      result.push({ dateStr, label, orders: 0, calcs: 0, revenue: 0 })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    orders.forEach((o) => {
      const orderDate = new Date(o.created_at)
      const dStr = orderDate.toLocaleDateString('en-CA')
      const match = result.find((item) => item.dateStr === dStr)
      if (match) {
        match.orders++
        match.revenue += Number(o.total_price || 0)
      }
    })

    calculatorRequests.forEach((c) => {
      const calcDate = new Date(c.created_at)
      const dStr = calcDate.toLocaleDateString('en-CA')
      const match = result.find((item) => item.dateStr === dStr)
      if (match) {
        match.calcs++
      }
    })

    return result
  }, [orders, calculatorRequests, startDate, endDate])

  const maxVal = useMemo(() => {
    const val = Math.max(...chartData.map((d) => Math.max(d.orders, d.calcs)), 5)
    return val
  }, [chartData])

  const width = 800
  const height = 240
  const paddingX = 40
  const paddingY = 30

  const getX = (index: number) => {
    if (chartData.length <= 1) return width / 2
    return paddingX + (index / (chartData.length - 1)) * (width - 2 * paddingX)
  }

  const getY = (value: number) => {
    return height - paddingY - (value / maxVal) * (height - 2 * paddingY)
  }

  const ordersLinePath = useMemo(() => {
    if (chartData.length === 0) return ''
    return chartData.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(d.orders)}`).join(' ')
  }, [chartData, maxVal])

  const ordersAreaPath = useMemo(() => {
    if (chartData.length === 0 || !ordersLinePath) return ''
    return `${ordersLinePath} L ${getX(chartData.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
  }, [chartData, ordersLinePath])

  const calcsLinePath = useMemo(() => {
    if (chartData.length === 0) return ''
    return chartData.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(d.calcs)}`).join(' ')
  }, [chartData, maxVal])

  const calcsAreaPath = useMemo(() => {
    if (chartData.length === 0 || !calcsLinePath) return ''
    return `${calcsLinePath} L ${getX(chartData.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
  }, [chartData, calcsLinePath])

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

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити це замовлення?')) return
    setErrorMessage(null)
    try {
      await deleteOrder(orderId)
      await loadData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не вдалося видалити замовлення.')
    }
  }

  const handleDeleteCalculatorRequest = async (requestId: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей запит?')) return
    setErrorMessage(null)
    try {
      await deleteCalculatorRequest(requestId)
      await loadData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не вдалося видалити запит.')
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
          <div className="date-picker-container">
            <label className="date-picker-label">
              Від:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-picker-input"
              />
            </label>
            <label className="date-picker-label">
              До:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-picker-input"
              />
            </label>
          </div>
          <button className="button secondary" onClick={() => window.location.hash = '#/admin/products'}>
            <Package size={17} />
            <span>Товари</span>
          </button>
          <a className="button secondary" href="#/">
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
          <strong>{filteredCalculatorRequests.length}</strong>
        </article>
      </section>

      {/* Analytics Chart Section */}
      <section className="admin-panel" style={{ padding: '20px', marginBottom: '22px', minHeight: 'auto', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid var(--line)', borderRadius: '12px' }}>
        <div className="admin-panel-head" style={{ border: 'none', padding: '0 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 850, margin: 0 }}>Аналітика за період</h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0' }}>
              Активність замовлень та запитів калькулятора по днях
            </p>
          </div>
          <div className="chart-toggles">
            <label className="chart-toggle-label">
              <input
                type="checkbox"
                checked={showOrdersLine}
                onChange={() => setShowOrdersLine(!showOrdersLine)}
                className="chart-toggle-checkbox"
              />
              <span className="chart-toggle-text">Замовлення</span>
            </label>
            <label className="chart-toggle-label">
              <input
                type="checkbox"
                checked={showCalcsLine}
                onChange={() => setShowCalcsLine(!showCalcsLine)}
                className="chart-toggle-checkbox"
              />
              <span className="chart-toggle-text">Калькулятор</span>
            </label>
          </div>
        </div>

        {chartData.length === 0 ? (
          <p className="admin-empty" style={{ minHeight: '160px' }}>Немає даних за цей період.</p>
        ) : (
          <div style={{ position: 'relative', background: '#fcfdfb', borderRadius: '8px', padding: '16px 12px 8px 12px', border: '1px solid var(--line)' }}>
            <svg viewBox="0 0 800 240" width="100%" height="240" style={{ overflow: 'visible', display: 'block' }}>
              <defs>
                <linearGradient id="orders-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green)" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="var(--green)" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="calcs-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#68766a" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#68766a" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + ratio * (height - 2 * paddingY)
                const gridVal = Math.round(maxVal - ratio * maxVal)
                return (
                  <g key={idx}>
                    <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--line)" strokeDasharray="3 3" />
                    <text x={48} y={y + 4} textAnchor="end" fill="var(--muted)" fontSize="12" fontWeight="700">{gridVal}</text>
                  </g>
                )
              })}

              {/* Day Hover Overlay triggers */}
              {chartData.map((day, idx) => {
                const x = getX(idx)
                const colWidth = (width - 2 * paddingX) / chartData.length
                return (
                  <rect
                    key={idx}
                    x={x - colWidth / 2}
                    y={paddingY}
                    width={colWidth}
                    height={height - 2 * paddingY}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredDay({ ...day, idx })}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                )
              })}

              {/* Fill Gradient under lines */}
              {showOrdersLine && ordersAreaPath && <path d={ordersAreaPath} fill="url(#orders-grad)" pointerEvents="none" />}
              {showCalcsLine && calcsAreaPath && <path d={calcsAreaPath} fill="url(#calcs-grad)" pointerEvents="none" />}

              {/* Line Paths */}
              {showOrdersLine && ordersLinePath && (
                <path d={ordersLinePath} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
              )}
              {showCalcsLine && calcsLinePath && (
                <path d={calcsLinePath} fill="none" stroke="#68766a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
              )}

              {/* Circles on Nodes */}
              {chartData.length <= 30 && chartData.map((day, idx) => {
                const x = getX(idx)
                return (
                  <g key={idx} pointerEvents="none">
                    {showOrdersLine && day.orders > 0 && <circle cx={x} cy={getY(day.orders)} r="4" fill="var(--green)" stroke="#fff" strokeWidth="1.5" />}
                    {showCalcsLine && day.calcs > 0 && <circle cx={x} cy={getY(day.calcs)} r="4" fill="#68766a" stroke="#fff" strokeWidth="1.5" />}
                  </g>
                )
              })}

              {/* vertical tooltip line */}
              {hoveredDay && (
                <line
                  x1={getX(hoveredDay.idx)}
                  y1={paddingY}
                  x2={getX(hoveredDay.idx)}
                  y2={height - paddingY}
                  stroke="var(--green)"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  pointerEvents="none"
                />
              )}

              {/* X Axis Labels */}
              {chartData.map((day, idx) => {
                const interval = chartData.length > 30 ? 10 : chartData.length > 7 ? 5 : 1
                if (idx % interval !== 0 && idx !== chartData.length - 1) return null
                const x = getX(idx)
                return (
                  <text key={idx} x={x} y={height - paddingY + 18} textAnchor="middle" fill="var(--muted)" fontSize="11" fontWeight="700">
                    {day.label}
                  </text>
                )
              })}
            </svg>

            {/* Hover details overlay */}
            {hoveredDay && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                zIndex: 10,
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '180px'
              }}>
                <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{hoveredDay.label}</strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Замовлень:</span>
                  <span style={{ fontWeight: 800, color: 'var(--green-dark)' }}>{hoveredDay.orders} ({formatMoney(hoveredDay.revenue)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: 'var(--muted)' }}>Запитів:</span>
                  <span style={{ fontWeight: 800, color: '#68766a' }}>{hoveredDay.calcs}</span>
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Tab Navigation */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '18px', width: 'min(100%, 1680px)', marginInline: 'auto' }}>
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('orders')}
          type="button"
        >
          <PackageCheck size={18} />
          <span>Замовлення</span>
          <span className="tab-badge">{filteredOrders.length}</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'calculator' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('calculator')}
          type="button"
        >
          <Calculator size={18} />
          <span>Калькулятор</span>
          <span className="tab-badge">{filteredCalculatorRequests.length}</span>
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          <section className="admin-workbench">
            <div className="admin-panel">
              <div className="admin-panel-head">
                <h2>Замовлення</h2>
                <span>{filteredOrders.length}</span>
              </div>

          <div className="admin-table-wrap">
            {filteredOrders.length === 0 ? (
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
                  {filteredOrders.map((order) => (
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <button
                  className="button secondary"
                  style={{ borderColor: 'var(--red)', color: 'var(--red)', background: 'transparent', gap: '6px' }}
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  type="button"
                >
                  <Trash2 size={16} />
                  <span>Видалити замовлення</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="admin-empty">Обери заявку для перегляду товарів.</p>
          )}
          </div>
        </div>
      </section>
        </>
      ) : (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Запити калькулятора</h2>
            <span>{filteredCalculatorRequests.length}</span>
          </div>
        <div className="admin-table-wrap">
          {filteredCalculatorRequests.length === 0 ? (
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
                  <th>Дія</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalculatorRequests.map((request) => (
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
                    <td>
                      <button
                        className="button secondary"
                        style={{ padding: '6px 8px', minHeight: 'auto', borderColor: 'var(--red)', color: 'var(--red)', background: 'transparent' }}
                        onClick={() => handleDeleteCalculatorRequest(request.id)}
                        type="button"
                        title="Видалити запит"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      )}
    </main>
  )
}

