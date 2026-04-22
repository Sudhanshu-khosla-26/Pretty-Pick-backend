# BubbleBuy Frontend ↔ BubbleBuy Backend Connection

This document tells the BubbleBuy frontend (Vite + React) exactly which backend APIs to call (and what payload/response shapes to expect) so you can replace the current `localStorage` mock with real `fetch()` calls.

## Base URL

Frontend env:

- `.env`
  - `VITE_API_BASE_URL="http://localhost:5000/api"`

If you run the backend on a different port, update this value.

## Auth

All auth endpoints are under:

- `POST {BASE}/auth/register`
- `POST {BASE}/auth/login`
- `GET  {BASE}/auth/me`
- `POST {BASE}/auth/logout` (optional, stateless)

### Register

`POST /auth/register`

Body:
```json
{ "fullName": "Jane Doe", "email": "user@example.com", "password": "secret" }
```

Response:
```json
{ "token": "...", "user": { "id": "...", "email": "user@example.com", "fullName": "Jane Doe" } }
```

### Login

`POST /auth/login`

Body:
```json
{ "email": "user@example.com", "password": "secret" }
```

Response:
```json
{ "token": "...", "user": { "id": "...", "email": "user@example.com", "fullName": "Jane Doe" } }
```

### Me

`GET /auth/me`

Headers:
- `Authorization: Bearer <token>`

Response:
```json
{ "user": { "id": "...", "email": "user@example.com", "fullName": "Jane Doe" } }
```

## Products

Endpoints:
- `GET {BASE}/products`
- `GET {BASE}/products/:id`

### List products

`GET /products`

Query params (all optional):
- `search=<string>`
- `featured=true|false`
- `category=<string>`
- `limit=<number>` (default 20, max 100)
- `cursor=<string>` (ObjectId cursor; used for non-featured listing)

Response:
```json
{
  "items": [
    {
      "id": "...",
      "name": "Summer Dress",
      "slug": "summer-dress",
      "description": "...",
      "price": 34.99,
      "currency": "USD",
      "rating": 4.7,
      "images": ["https://..."],
      "primaryImage": "https://...",
      "category": "Dresses",
      "inventory": { "inStock": true, "quantity": 120 },
      "isFeatured": true,
      "sortOrder": 2,
      "createdAt": "2026-04-22T00:00:00.000Z",
      "updatedAt": "2026-04-22T00:00:00.000Z"
    }
  ],
  "nextCursor": "..." 
}
```

### Get product by id

`GET /products/:id`

Response:
```json
{ "product": { "id": "...", "name": "...", "price": 12.34, "images": [] } }
```

## Wishlist

All wishlist endpoints require auth.

Endpoints:
- `GET    {BASE}/wishlist`
- `POST   {BASE}/wishlist`
- `DELETE {BASE}/wishlist/:productId`

Headers:
- `Authorization: Bearer <token>`

### Get wishlist

`GET /wishlist`

Response:
```json
{
  "items": [
    {
      "productId": "...",
      "product": { "id": "...", "name": "Summer Dress", "price": 34.99, "image": "https://..." }
    }
  ]
}
```

### Add to wishlist

`POST /wishlist`

Body:
```json
{ "productId": "..." }
```

Response:
```json
{ "item": { "productId": "...", "product": { "id": "...", "name": "...", "price": 12.34, "image": "..." } } }
```

### Remove from wishlist

`DELETE /wishlist/:productId`

Response:
```json
{ "ok": true }
```

## Cart

All cart endpoints require auth.

Endpoints:
- `GET    {BASE}/cart`
- `POST   {BASE}/cart/items`
- `PATCH  {BASE}/cart/items/:itemId`
- `DELETE {BASE}/cart/items/:itemId`
- `DELETE {BASE}/cart` (clear)

Headers:
- `Authorization: Bearer <token>`

### Get cart

`GET /cart`

Response:
```json
{
  "items": [
    {
      "itemId": "...",
      "product": { "id": "...", "name": "Summer Dress", "price": 34.99, "image": "https://..." },
      "quantity": 2,
      "lineTotal": 69.98
    }
  ],
  "subtotal": 69.98,
  "currency": "USD"
}
```

### Add item to cart

`POST /cart/items`

Body:
```json
{ "productId": "...", "quantity": 1 }
```

Response:
```json
{ "item": { "itemId": "...", "product": { "id": "...", "name": "...", "price": 12.34, "image": "..." }, "quantity": 1, "lineTotal": 12.34 } }
```

### Update cart quantity

`PATCH /cart/items/:itemId`

Body:
```json
{ "quantity": 3 }
```

Response:
```json
{ "item": { "itemId": "...", "product": { "id": "...", "name": "...", "price": 12.34, "image": "..." }, "quantity": 3, "lineTotal": 37.02 } }
```

### Remove cart item

`DELETE /cart/items/:itemId`

Response:
```json
{ "ok": true }
```

### Clear cart

`DELETE /cart`

Response:
```json
{ "ok": true }
```

## Checkout + Orders (no Stripe)

The frontend shows a “Processing…” animation, then calls checkout.

Endpoints:
- `POST {BASE}/checkout`
- `GET  {BASE}/orders`
- `GET  {BASE}/orders/:id`

Headers:
- `Authorization: Bearer <token>`

### Checkout

`POST /checkout`

Body (shipping address is optional for now; you can add it when the UI exists):
```json
{ "shippingAddress": { "fullName": "Jane Doe", "address1": "...", "city": "..." } }
```

Server actions:
- reads user cart
- validates inventory
- creates order with `payment.provider="mock"` and `payment.status="paid"`
- clears cart

Response:
```json
{ "order": { "id": "...", "orderNumber": "BB-20260422-123456", "status": "placed", "total": 69.98 } }
```

### List orders

`GET /orders`

Response:
```json
{ "items": [ { "id": "...", "orderNumber": "...", "status": "placed", "total": 69.98 } ] }
```

### Get order

`GET /orders/:id`

Response:
```json
{ "order": { "id": "...", "orderNumber": "...", "status": "placed", "items": [] } }
```

## Implementation Notes (Frontend)

- Store the JWT after login/register.
- Send it on every authenticated call:
  - `Authorization: Bearer ${token}`
- Replace localStorage keys:
  - `bubblebuy_auth` → real `/auth/*`
  - `bubblebuy_cart` → real `/cart/*`
  - `bubblebuy_wishlist` → real `/wishlist/*`

## Backend Notes

- MongoDB connection must succeed before the server listens.
- If MongoDB Atlas blocks your connection, add your IP in Atlas **Network Access**.
