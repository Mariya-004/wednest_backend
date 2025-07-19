# 💍 WedNest-Backend

Welcome to the backend for **WedNest**, an all-in-one wedding planning platform!  
This Node.js REST API powers the WedNest experience, enabling couples to organize their big day and vendors to showcase and offer their services.

---

## ✨ Features

- **👩‍❤️‍👨 User System**
  - Register/login as **Couple** or **Vendor**
  - Secure authentication (JWT)
  - Profile management with photos

- **🤝 Vendor Management**
  - Detailed vendor profiles: business info, type, location, pricing, ratings, images
  - Search vendors by service type
  - Vendor dashboard: earnings, bookings, reviews

- **📦 Cart & Budget**
  - Couples can add vendor services to a cart
  - Dynamic budget calculation and cart management

- **📅 Booking & Requests**
  - Couples send service requests to vendors
  - Vendors accept/decline requests
  - Status tracking for every request

- **🖼️ Image Uploads**
  - Profile and service galleries via Cloudinary

- **🔗 API-First**
  - RESTful endpoints for all actions
  - CORS enabled for frontend integration

---

## 🛠️ Tech Stack

- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** for auth
- **Cloudinary** + **Multer** for images
- **dotenv** for configuration

---

## 🚀 Getting Started

```bash
git clone https://github.com/Mariya-004/wednest_backend.git
cd wednest_backend
npm install
```

Create a `.env` file in the root:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloud_api_key
CLOUDINARY_API_SECRET=your_cloud_api_secret
BACKEND_URL=http://localhost:3000
```

Then start the server:

```bash
npm start
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints (Examples)

| Endpoint                                      | Method | Description                       |
|------------------------------------------------|--------|-----------------------------------|
| `/api/register`                               | POST   | Register as couple or vendor      |
| `/api/login`                                  | POST   | User login                        |
| `/api/couple/profile`                         | PUT    | Update couple profile             |
| `/api/vendors/type/:vendorType`               | GET    | List vendors by service type      |
| `/api/cart/add`                               | POST   | Add service to couple's cart      |
| `/api/cart/:couple_id`                        | GET    | Retrieve couple's cart            |
| `/api/request/:request_id`                    | PUT    | Update request status (vendor)    |

> For full details, see `server.js` and `/models`.

---

## 📁 Project Structure

```
wednest_backend/
├── models/           # Mongoose schemas
├── cloudinaryConfig.js
├── db.js
├── server.js
└── README.md
```

---

## 🤝 License

_No license specified._

---

> **Frontend:** This API powers [WedNest Frontend](https://wednest-frontend-orcin.vercel.app)  
> _Happy Planning!_
