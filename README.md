# Real-Time Chat Application

A real-time 1:1 chat app built with React Native and Node.js.

## Setup

### Backend

cd server
npm install

text

Create `server/.env`:
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_secret_key_here

text

Run:
npm run dev

text

### Frontend

cd mobile
npm install

text

Create `mobile/.env`:
API_URL=http://YOUR_LOCAL_IP:5000

text

Replace `YOUR_LOCAL_IP` with your computer's IP address (find with `ipconfig` or `ifconfig`).

Run:
npx expo start

text

Scan QR code with Expo Go app on your phone.

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

### Frontend (.env)
- `API_URL` - Backend URL (must use local IP, not localhost)

## Sample Users

- Email: saad19@gmail.com | Password: 12345678
- Email: zaid19@gmail.com | Password: 12345678
Save this as README.md in the root directory, then:

bash
git add README.md
git commit -m "Add README"
git push