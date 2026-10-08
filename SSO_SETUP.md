# SSO setup (OpenID Connect)

1. In your identity provider (Entra ID / Okta / Google Workspace) register a **Web** app.
   Redirect URI: `http://localhost:8000/auth/sso/callback` (use your real backend URL in production).
2. Copy `backend/.env.example` to `backend/.env` and fill `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`.
   - Entra ID issuer: `https://login.microsoftonline.com/<tenant-id>/v2.0`
3. Configure group-based role mapping using Entra group object IDs:
   - `SSO_EMPLOYEE_GROUP_IDS`
   - `SSO_HIRING_MANAGER_GROUP_IDS`
4. Keep `INTERNAL_SSO_ALLOWED_DOMAIN=cirruslabs.io` so only company mail is accepted after IdP verification.
5. Set `FRONTEND_URL=http://localhost:5174` for the Vite frontend and keep `CORS_ORIGINS=http://localhost:5174`.
6. Set a strong `JWT_SECRET_KEY`. Keep `SSO_DEV_MODE=false` outside local demos.
