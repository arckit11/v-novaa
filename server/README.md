# V-Novaa Server

Node.js Express + TypeScript backend API.

## Setup

```bash
cd server
npm install
npm run dev     # hot-reload dev server on port 3001
```

## API Endpoints

| Method | Route               | Description                      |
|--------|---------------------|----------------------------------|
| GET    | /api/health         | Health check                     |
| GET    | /api/products       | All products (?category=Gym)     |
| GET    | /api/products/:id   | Single product                   |
| POST   | /api/orders         | Create order (see body below)    |
| GET    | /api/orders/:id     | Get order by ID                  |

### POST /api/orders body

```json
{
  "items": [{ "productId": "g1", "name": "...", "price": 349.99, "quantity": 1, "size": "M" }],
  "customer": { "firstName": "John", "lastName": "Doe", "email": "john@test.com", "address": "123 Main", "city": "NY", "zip": "10001" },
  "payment": { "last4": "4242", "brand": "Visa" }
}
```
