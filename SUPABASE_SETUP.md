# Supabase setup для Europol redesign

Цель: сайт остается static/Vite без своего backend-сервера, а заявки, товары в заказах, запросы калькулятора и CRM читаются из Supabase.

## 1. Создать проект

1. Открой Supabase Dashboard.
2. Создай новый проект.
3. Сохрани database password в менеджере паролей. В код сайта его вставлять нельзя.
4. Дождись, пока проект поднимется.

## 2. Создать таблицы и RLS policies

1. В Supabase открой `SQL Editor`.
2. Скопируй весь файл [`supabase/schema.sql`](./supabase/schema.sql).
3. Выполни SQL один раз.

Будут созданы таблицы:

- `orders`
- `order_items`
- `calculator_requests`
- `admin_users`

`admin_users` нужен только для безопасной админки: публичный ключ сайта сможет создавать заявки, но читать CRM смогут только пользователи, которых ты добавишь как админов.

## 3. Создать админа

1. В Supabase открой `Authentication -> Users`.
2. Нажми `Add user`.
3. Создай пользователя с email и паролем для входа в `/admin`.
4. Открой `SQL Editor` и выполни:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do nothing;
```

Замени `admin@example.com` на email созданного пользователя.

Проверить, что админ добавился:

```sql
select u.email, a.created_at
from public.admin_users a
join auth.users u on u.id = a.user_id
order by a.created_at desc;
```

Рекомендация: отключи публичную регистрацию пользователей, если она не нужна. Тогда любой `authenticated` пользователь не сможет попасть в CRM без записи в `admin_users`.

## 4. Env переменные

Для локальной разработки значения кладутся в файл `.env.local` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

В этом проекте файл `.env.local` уже добавлен локально и игнорируется git через `*.local`.

Для деплоя эти же переменные нужно добавить в настройки хостинга:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Если деплой идет через текущий GitHub Pages workflow, добавь их в GitHub:

1. `Settings -> Secrets and variables -> Actions -> Variables`.
2. `New repository variable`.
3. Создай `VITE_SUPABASE_URL`.
4. Создай `VITE_SUPABASE_PUBLISHABLE_KEY`.

Альтернативно workflow умеет прочитать одну многострочную variable `ENV_LOCAL` с содержимым:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Но две отдельные variables проще проверять и меньше путают.

Важно: database password, service role key и любые секретные ключи платежек нельзя класть в Vite env, потому что фронтенд-переменные попадают в браузер.

## 5. Запуск

```bash
npm install
npm run dev
```

Сайт:

```text
http://localhost:5173/
```

Админка:

```text
http://localhost:5173/admin
```

## 6. Что уже сохраняется

При оформлении корзины:

- создается запись в `orders`
- создаются связанные записи в `order_items`
- сохраняется сумма заказа
- сохраняется способ доставки, способ оплаты, комментарий и флаг обратного звонка
- корзина очищается после успешной записи в БД

При отправке калькулятора:

- создается запись в `calculator_requests`
- сохраняется список комнат/товаров в `selected_products`
- сохраняется рассчитанная сумма
- телефон сохраняется, если пользователь его ввел

## 7. Будущие платежи

Поле `payment_method` уже есть в `orders`, поэтому позже можно добавить:

- LiqPay
- Monobank acquiring
- Google Pay
- Apple Pay

Сейчас платежи не подключены. Кнопки онлайн-оплаты в интерфейсе только показывают будущий путь и не создают платеж.
