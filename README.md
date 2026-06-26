# SWAIS Full-Stack Platform Integration

## 🔷 Project Overview
SWAIS (Saraf Worldsphere AI Services) is a sophisticated Enterprise gateway platform. This integration phase established a scalable, fully modular custom full-stack web environment replacing static UI structure with a robust Google OAuth 2.0 authentication architecture secured dynamically via JWT-based identification logic. 

## 🔷 Tech Stack
- Node.js
- Express.js
- Google OAuth 2.0 (via Passport.js)
- JWT (JSON Web Tokens)
- React / Next.js (Frontend configuration mapping layer)
- (Optional / Incoming) PostgreSQL explicitly built and structurally prepared. 

## 🔷 Environment Setup
Sensitive deployment variables must be strictly structured directly inside a local `.env` configuration mounted onto your root executing backend directory.

Example configuration logic mapping `.env`:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_encryption_string
GOOGLE_CLIENT_ID=your_custom_google_client_id_here
GOOGLE_CLIENT_SECRET=your_custom_google_client_secret_here
NODE_ENV=development
```

## 🔷 How to Get Google OAuth Credentials
In order to run and operate the login systems natively, valid internal Google Cloud authorizations are necessary. Follow these step-by-step operations specifically to retrieve functional keys. 
1. Go directly to your Google Cloud Console.
2. Formulate and Create a structured project.
3. Configure the specific OAuth Consent Screen logic.
4. Choose "External" assigning open development validation.
5. In development bounds, specifically add manually any test user accounts (Email targets).
6. Create your precise Web Application OAuth Client identifier.
7. Add explicit verification redirect URI tracking referencing exactly: `http://localhost:5000/auth/google/callback`

## 🔷 Installation Steps
To compile and instantiate operational frameworks seamlessly, execute these basic commands initializing your dependencies securely.

```bash
# Instantiate frontend protocols natively
npm install
npm run dev

# (Concurrently open a secondary terminal navigating towards /backend)
npm install
node src/index.js
# Or utilize your initialized nodemon mapping executing 'npm run dev' inside backend.
```

## 🔷 Running the Project
Once the corresponding environments execute normally on (`localhost:3000` / `localhost:5000`):
- Open frontend application at (localhost:3000)
- Process strictly to login instances mapped across your navigation menu or `/login`.
- Click "Sign in with Google" securely.
- Complete Registration inputs capturing operational variables. 
- Access the completed core analytical Dashboard validating logic flows directly.

## 🔷 API Endpoints
All system navigation targets resolve explicitly alongside standard mapped configurations bridging cross-domain actions natively across these structured points:
- `GET /auth/google` (Initial Google OAuth Gateway instance trigger)
- `GET /auth/google/callback` (Auth payload and redirect proxy handler issuing valid core cookies)
- `GET /user/me` (Profile integrity verification reading the valid browser token session logic)
- `POST /user/register` (Registration endpoint pushing form-based fields safely to memory mappings)
- `GET /functions` (Structured modular payload list generator evaluating locked UI state logic rendering variables)
- `GET /warehouse/menu` (Constructs static payload data returning links configured towards operational GUIs)

## 🔷 Current Limitations
- Direct database integration is aggressively restricted (System operates explicitly utilizing simulated in-memory storage arrays clearing all active caching layers during hard initialization resets).
- Extended Warehouse feature parameters restrict access deploying global "Coming Soon" notification structures deferring internal logic mappings. 

## 🔷 Future Improvements
- Connect static logical mapping schemas aggressively utilizing native Prisma ORM structure driving standard PostgreSQL query systems.
- Implement explicit full-range module designs expanding upon static warehouse functionality loops efficiently linking operations. 
- Add strict CI/CD configuration routing deployment variables securely over explicit production instances resolving AWS/Docker environments efficiently.
- Initiate OAuth domain verifications escalating Google limitations outside general testing pools exclusively generating robust external permissions sets.
