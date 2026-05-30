import { supabase, isSupabaseConfigured } from './supabase'

export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'cancelled'

export type CrmOrderItemInput = {
  product_name: string
  product_price: number
  area: number
  width: number
  length: number
  quantity: number
}

export type CreateOrderInput = {
  customer_name: string
  phone: string
  comment: string
  status?: OrderStatus
  total_price: number
  source: string
  payment_method: string
  needs_callback: boolean
  items: CrmOrderItemInput[]
}

export type CalculatorProductPayload = {
  room: string
  product_id: string
  product_name: string
  product_price: number
  area: number
  width: number
  length: number
}

export type CreateCalculatorRequestInput = {
  selected_products: CalculatorProductPayload[]
  calculated_price: number
  phone: string
  comment: string
}

export type OrderItemRecord = {
  id: string
  order_id: string
  product_name: string
  product_price: number
  area: number
  width: number
  length: number
  quantity: number
}

export type OrderRecord = {
  id: string
  created_at: string
  customer_name: string
  phone: string
  comment: string | null
  status: OrderStatus
  total_price: number
  source: string
  payment_method: string
  needs_callback: boolean
  order_items?: OrderItemRecord[]
}

export type CalculatorRequestRecord = {
  id: string
  created_at: string
  selected_products: CalculatorProductPayload[]
  calculated_price: number
  phone: string | null
  comment: string | null
}

const assertConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.')
  }
}

export async function createOrder(input: CreateOrderInput) {
  assertConfigured()

  const orderId = crypto.randomUUID()
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      customer_name: input.customer_name,
      phone: input.phone,
      comment: input.comment,
      status: input.status ?? 'new',
      total_price: input.total_price,
      source: input.source,
      payment_method: input.payment_method,
      needs_callback: input.needs_callback,
    })

  if (orderError) throw orderError

  const items = input.items.map((item) => ({
    ...item,
    order_id: orderId,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(items)
  if (itemsError) throw itemsError

  return orderId
}

export async function createCalculatorRequest(input: CreateCalculatorRequestInput) {
  assertConfigured()

  const requestId = crypto.randomUUID()
  const { error } = await supabase
    .from('calculator_requests')
    .insert({
      id: requestId,
      selected_products: input.selected_products,
      calculated_price: input.calculated_price,
      phone: input.phone || null,
      comment: input.comment,
    })

  if (error) throw error
  return requestId
}

export async function fetchOrders(status: OrderStatus | 'all', phone: string) {
  assertConfigured()

  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)
  if (phone.trim()) query = query.ilike('phone', `%${phone.trim()}%`)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []) as OrderRecord[]
}

export async function fetchCalculatorRequests(phone: string) {
  assertConfigured()

  let query = supabase
    .from('calculator_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (phone.trim()) query = query.ilike('phone', `%${phone.trim()}%`)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []) as CalculatorRequestRecord[]
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  assertConfigured()

  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) throw error
}
