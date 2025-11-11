# AgriConnect Kenya — Step 1: Backend Setup & Model Tests ✅

This README documents how to verify Step 1: backend foundation, models and basic server health checks.

---

## What is included in Step 1
- Project skeleton (backend/src)
- MongoDB connection and graceful shutdown
- Redis client (optional)
- AES-256-GCM encryption utility for PII (National ID)
- User model (KYC fields, encrypted NID, hashing, roles)
- Profile model (GeoJSON location + geospatial index)
- KYCDoc model (S3 keys encrypted, admin verify/reject)
- Winston logger
- Express app with health and test endpoints
- Model test script: `src/tests/testModels.ts`

---

## Prerequisites
- Node.js v18+
- MongoDB running locally or accessible via URI
- (Optional) Redis for full feature set
- Git (recommended)

On Ubuntu 24.04 you can install quickly:
```bash
sudo apt update
sudo apt install -y nodejs npm mongodb redis-server
```

---

## Quick setup

1. Open a terminal in the dev container or your workspace and go to the backend folder:
```bash
cd /workspaces/Marketash-Agri-connect-kenya/agriconnect-kenya/backend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Create `.env` in `backend/` and populate values. Example values are provided in `backend/.env.example`. Required highlights:
- ENCRYPTION_KEY: 32-byte hex (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- MONGODB_URI: `mongodb://localhost:27017/agriconnect` (or your Atlas URI)
- JWT_* secrets (generate securely)

4. Ensure `logs/` directory exists:
```bash
mkdir -p logs
```

---

## Useful scripts (package.json)
Add or use the following scripts in `backend/package.json`:
```json
{
  "scripts": {
    "start": "node dist/app.js",
    "dev": "nodemon --watch src --exec ts-node src/app.ts",
    "test:models": "ts-node src/tests/testModels.ts"
  }
}
```
Run development server:
```bash
npm run dev
```

---

## Health & basic checks

1. Start MongoDB (if not running):
```bash
# Ubuntu (systemd)
sudo systemctl start mongodb
# or run mongod manually if using custom dbpath
```

2. (Optional) Start Redis:
```bash
sudo systemctl start redis-server
# verify
redis-cli ping   # -> PONG
```

3. Start backend:
```bash
npm run dev
```

4. Health endpoint:
```bash
curl http://localhost:5000/health
```
Expected JSON includes `database: "connected"` and `redis: "ready"` (if running).

5. Test endpoint:
```bash
curl http://localhost:5000/api/v1/test
```
Expect success JSON with version and timestamp.

---

## Run model tests (MOST IMPORTANT)

From `backend/` run:
```bash
npm run test:models
# or
npx ts-node src/tests/testModels.ts
```

What the test script does:
- Creates a farmer user (NID encrypted by pre-save hook)
- Creates a Profile with GeoJSON location
- Creates a KYCDoc (S3 key encrypted)
- Simulates admin verification (updates User.kycStatus)
- Verifies encryption/decryption of National ID
- Runs a geospatial `$near` query
- Cleans up test data at the end

Expected outcome: logs showing each of the 8 tests succeeding and a summary with counts.

---

## Verification checklist
- [ ] MongoDB connected
- [ ] Server starts without fatal errors
- [ ] /health returns OK
- [ ] /api/v1/test returns success
- [ ] `npm run test:models` completes with no errors
- [ ] National ID encryption/decryption works
- [ ] GeoJSON queries return nearby profiles
- [ ] KYCDoc verification flow updates user KYC status
- [ ] Virtual population (User -> Profile) works

---

## Troubleshooting

- "ENCRYPTION_KEY must be set as a 32-byte hex string"
  - Generate a valid key:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - Paste into `.env` for `ENCRYPTION_KEY`.

- "Cannot connect to MongoDB"
  - Ensure mongod is running and `MONGODB_URI` is correct:
    ```bash
    ps aux | grep mongod
    mongo --eval "db.serverStatus()"
    ```

- Redis not available
  - Redis is optional for Step 1. Either start it or skip/check Redis related logs.

- Invalid Safaricom phone number
  - Use format `2547XXXXXXXX` or `2541XXXXXXXX` (e.g. `254712345678`).

---

## Inspecting DB after tests
Open Mongo shell or MongoDB Compass and check:
```bash
# mongo shell
mongo
use agriconnect
db.users.find().pretty()
db.profiles.find().pretty()
db.kycdocs.find().pretty()
db.profiles.getIndexes()
```

Note: encrypted fields (National ID, S3 keys) are stored encrypted; hashes exist for safe search/comparison.

---

## Next steps
Once Step 1 is verified, proceed to Step 2:
- OTP generation/verification (Africa's Talking)
- JWT auth (access/refresh)
- Registration/login flows
- Token refresh and logout

---

If you want, I can:
- Add a root README in the repo root
- Scaffold CI job for running the model tests
- Create a Docker Compose dev stack (MongoDB + Redis + backend)

Choose next action.