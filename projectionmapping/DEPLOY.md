# Deploying to Vercel

This guide will help you deploy your Projection Mapping Tool to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (free tier works great)
3. Git installed on your computer

## Step 1: Initialize Git Repository (if not already done)

```bash
cd /Users/dieterschoening/Developer/projectionmapping
git init
git add .
git commit -m "Initial commit - Projection Mapping Tool"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `projection-mapping` or `projection-tool`
3. **Don't** initialize with README, .gitignore, or license (we already have files)
4. Copy the repository URL (e.g., `https://github.com/yourusername/projection-mapping.git`)

## Step 3: Push to GitHub

```bash
git remote add origin https://github.com/yourusername/projection-mapping.git
git branch -M main
git push -u origin main
```

Replace `yourusername/projection-mapping` with your actual repository URL.

## Step 4: Deploy to Vercel

### Option A: Via Vercel Website (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a static site
5. Click "Deploy"
6. Wait for deployment to complete (usually 1-2 minutes)
7. Your site will be live at `https://your-project-name.vercel.app`

### Option B: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd /Users/dieterschoening/Developer/projectionmapping
   vercel
   ```

3. Follow the prompts:
   - Link to existing project? **No** (first time)
   - Project name? (press Enter for default)
   - Directory? (press Enter for current directory)
   - Override settings? **No**

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 5: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Important Notes

### HTTPS Required
- Vercel automatically provides HTTPS
- This is **required** for webcam and microphone access
- Your app will work perfectly on Vercel's HTTPS

### Browser Permissions
- Users will need to grant webcam/microphone permissions
- Modern browsers require HTTPS for these features (which Vercel provides)

### Projector Window
- The projector window will open in a new tab/window
- Cross-window communication works via `postMessage` API
- No special configuration needed

## Updating Your Deployment

After making changes:

```bash
git add .
git commit -m "Your commit message"
git push
```

Vercel will automatically detect the push and redeploy your site!

## Troubleshooting

### Build Errors
- Make sure all files are committed to Git
- Check that `vercel.json` is in the root directory
- Verify all HTML files reference correct paths

### Webcam/Microphone Not Working
- Ensure you're accessing via HTTPS (Vercel provides this automatically)
- Check browser permissions in browser settings
- Try a different browser (Chrome/Firefox recommended)

### Projector Window Issues
- Some browsers block pop-ups by default
- Users may need to allow pop-ups for your domain
- Consider adding a note in your UI about pop-up permissions

## Support

If you encounter issues:
1. Check Vercel deployment logs in the dashboard
2. Check browser console for errors
3. Verify all file paths are correct
4. Ensure all dependencies are included in the repository

