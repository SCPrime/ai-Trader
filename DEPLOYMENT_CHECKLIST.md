# ✅ Deployment Readiness Checklist

## Pre-Deployment Verification

### Code Verification
- [x] Backend split into `backend/` directory
- [x] Frontend split into `frontend/` directory
- [x] Hardening commit (53c90a2) includes:
  - [x] Strict CORS configuration
  - [x] CSP + security headers
  - [x] Dual-token auth capability
  - [x] Enhanced health endpoint
  - [x] Redis idempotency
  - [x] Kill-switch functionality
- [x] Branch `feat/option-a-cloud-backend` is up to date

### Deployment Artifacts
- [x] `backend/render.yaml` - Render configuration
- [x] `frontend/vercel.json` - Vercel configuration
- [x] `DEPLOY_INSTRUCTIONS.md` - Step-by-step deployment guide
- [x] `test-deployment.sh` - Acceptance test script
- [x] `GITHUB_PAGES_UPDATE.md` - Documentation update guide

### Documentation
- [x] Deployment instructions complete
- [x] Acceptance criteria documented
- [x] GitHub Pages update instructions created
- [x] Production deployment guide updated

## Deployment Steps

### 1. Backend (Render)
- [ ] Connect GitHub repo to Render
- [ ] Configure from branch: `feat/option-a-cloud-backend`
- [ ] Set root directory: `backend/`
- [ ] Configure environment variables:
  - [ ] `API_TOKEN` (auto-generated or manual)
  - [ ] `LIVE_TRADING=false`
  - [ ] `ALLOW_ORIGIN=<vercel-url>` (add after Vercel deploy)
  - [ ] `REDIS_URL=redis://localhost:6379` (or managed Redis)
- [ ] Deploy service
- [ ] Copy backend URL: `https://______.onrender.com`
- [ ] Test: `curl https://______.onrender.com/api/health | jq .`

### 2. Frontend (Vercel)
- [ ] Import GitHub repo to Vercel
- [ ] Configure framework preset: `Next.js`
- [ ] Set root directory: `frontend/`
- [ ] Set production branch: `feat/option-a-cloud-backend`
- [ ] Configure environment variables (Server-only):
  - [ ] `BACKEND_API_BASE_URL=<render-url>`
  - [ ] `API_TOKEN=<same-as-render>`
- [ ] Deploy project
- [ ] Copy frontend URL: `https://______.vercel.app`

### 3. Update CORS
- [ ] Go back to Render
- [ ] Update `ALLOW_ORIGIN` env var with Vercel URL
- [ ] Save (triggers redeploy)

### 4. Acceptance Testing

#### Browser Testing
- [ ] Open Vercel URL in browser
- [ ] Open DevTools → Network tab
- [ ] Click **Health** button → JSON appears
- [ ] Click **Settings** button → JSON appears
- [ ] Click **Positions** button → JSON appears
- [ ] Click **Execute (Dry)** button → JSON appears
- [ ] Verify in Network tab:
  - [ ] All requests go to `/api/proxy/...`
  - [ ] No CORS errors
  - [ ] No 404/500 errors
  - [ ] No localhost URLs
  - [ ] Response headers include `x-request-id`

#### Terminal Testing
Replace `<vercel-url>` with your actual Vercel URL:

```bash
# Test health
curl -s https://<vercel-url>/api/proxy/api/health | jq .

# Test idempotency
RID="test-$(date +%s)"
curl -s -X POST -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://<vercel-url>/api/proxy/api/trading/execute | jq .

# Second request - should return duplicate:true
curl -s -X POST -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://<vercel-url>/api/proxy/api/trading/execute | jq .
```

Or use the automated test script:
- [ ] Run: `./test-deployment.sh https://<vercel-url>`
- [ ] All tests pass

### 5. Documentation Update
- [ ] Update GitHub Pages (see GITHUB_PAGES_UPDATE.md)
  - Option A: Replace localhost with cloud URLs
  - Option B: Disable GitHub Pages
- [ ] Update README if needed
- [ ] Commit documentation changes

### 6. Create Pull Request
- [ ] Create PR from `feat/option-a-cloud-backend` to `main`
- [ ] Use PR template from `PR_DESCRIPTION.md`
- [ ] Verify all acceptance checkboxes are checked
- [ ] Add Vercel preview URL to PR
- [ ] Add Render backend URL to PR
- [ ] Request review

## Post-Deployment

### Monitoring
- [ ] Check Render logs for errors
- [ ] Check Vercel function logs
- [ ] Monitor first few real requests
- [ ] Verify Redis connection in health endpoint

### Optional Enhancements
- [ ] Set up custom domain
- [ ] Configure managed Redis (for production)
- [ ] Set up monitoring/alerts
- [ ] Configure auto-scaling (if needed)
- [ ] Add rate limit reset headers
- [ ] Tune worker concurrency

## Troubleshooting

### Backend Issues
- **503 Service Unavailable**: Render service may be cold-starting (wait 30s)
- **Build failed**: Check `backend/requirements.txt` exists and is valid
- **Import errors**: Verify `app.main:app` path is correct

### Frontend Issues
- **404 on proxy routes**: Verify `BACKEND_API_BASE_URL` env var is set
- **CORS errors**: Check `ALLOW_ORIGIN` on Render matches Vercel URL exactly
- **Build failed**: Ensure `frontend/package.json` exists

### General
- **Idempotency not working**: Verify Redis connection in health endpoint
- **Kill-switch not blocking**: Check `LIVE_TRADING` env var is `"false"`

## Success Criteria

All checkboxes above must be checked before merging to `main`:
- ✅ Backend deployed and health check passes
- ✅ Frontend deployed with all 4 buttons working
- ✅ Proxy routes return JSON (no 404s)
- ✅ No CORS errors in browser console
- ✅ Idempotency test passes (duplicate detection)
- ✅ Kill-switch test passes (blocks live trading)
- ✅ x-request-id header present in responses
- ✅ Documentation updated (no localhost references)

## Timeline Estimate
- Backend setup: 10-15 minutes
- Frontend setup: 5-10 minutes
- CORS update: 2 minutes
- Testing: 10-15 minutes
- Documentation: 5-10 minutes

**Total**: ~40-60 minutes for first-time deployment