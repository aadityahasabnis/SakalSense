# GitHub Actions Secrets Setup Guide

## Required Secrets for CI/CD

GitHub secrets are **NOT stored in files** - they must be configured in your repository settings.

### 📍 Where to Add Secrets

Go to: `https://github.com/YOUR_USERNAME/SakalSense/settings/secrets/actions`

Or navigate: **Repository → Settings → Secrets and variables → Actions → New repository secret**

---

## 🔐 Secrets You Need to Configure

### 1. Vercel Deployment Secrets

| Secret Name         | How to Get It                                                        | Example Value        |
| ------------------- | -------------------------------------------------------------------- | -------------------- |
| `VERCEL_TOKEN`      | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token | `v1_abc123...`       |
| `VERCEL_ORG_ID`     | Run `npx vercel link` in frontend, check `.vercel/project.json`      | `team_xxxxxxxxxxxxx` |
| `VERCEL_PROJECT_ID` | Same as above                                                        | `prj_xxxxxxxxxxxxx`  |

### 2. GitHub Token

- `GITHUB_TOKEN` - **Automatically provided by GitHub Actions**
- Do NOT manually create this secret

---

## 📝 Step-by-Step Setup

### Frontend (Vercel)

1. **Get Vercel Token:**

   ```bash
   # Go to: https://vercel.com/account/tokens
   # Click "Create Token" → Copy token
   ```

2. **Link Vercel Project:**

   ```bash
   cd apps/frontend
   npx vercel link
   # Follow prompts to link to your Vercel project
   # This creates .vercel/project.json with org/project IDs
   ```

3. **Add Secrets to GitHub:**
   - Go to repo settings → Secrets → Actions
   - Add `VERCEL_TOKEN` (from step 1)
   - Add `VERCEL_ORG_ID` (from `.vercel/project.json`)
   - Add `VERCEL_PROJECT_ID` (from `.vercel/project.json`)

### Backend (Future AWS Setup)

When ready to deploy backend to AWS, add:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- Other AWS-specific secrets

---

## ✅ Verify Setup

Once secrets are added, push to `main` branch and check:

- **Actions tab** in GitHub to see workflow run
- Vercel dashboard to confirm deployment

---

## 🔒 Security Notes

- **Never commit** `.env.local` or real secret values
- **Always use** `.env.example` for templates
- GitHub secrets are encrypted and only exposed to workflows
- Vercel environment variables should also be set in Vercel dashboard for runtime
