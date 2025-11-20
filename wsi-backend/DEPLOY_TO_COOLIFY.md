# Deploy WSI Backend to Coolify - Beginner Guide

## What This Does
This backend service:
- Accepts .svs file uploads from your histopathology app
- Automatically converts them to web-viewable DZI format
- Gives you URLs to use in your frontend
- Stores converted slides accessible via HTTP

## Prerequisites
- Hetzner server with Coolify installed ✅ (you have this)
- Domain or subdomain (e.g., wsi.yourdomain.com)

## Step-by-Step Deployment

### Step 1: Upload Files to Server

1. **Copy the `wsi-backend` folder** to your Hetzner server:
   ```bash
   # On your local machine
   scp -r wsi-backend root@your-server-ip:/root/
   ```

   Or use FileZilla/WinSCP to upload via SFTP.

### Step 2: Deploy in Coolify

1. **Log into Coolify** (your-server-ip:3000 or coolify.yourdomain.com)

2. **Create New Resource** → **Docker Compose**

3. **Name it**: `wsi-backend`

4. **Set these settings**:
   - **Source**: Local
   - **Working Directory**: `/root/wsi-backend`
   - **Port**: `3001:3001`
   - **Domain**: `wsi.yourdomain.com` (or use IP:3001)

5. **Environment Variables** (Optional):
   - `PORT=3001`

6. **Deploy!** - Click Deploy button

### Step 3: Verify It's Working

1. Open your browser to: `http://your-backend-url/health`
2. You should see: `{"status":"ok","message":"WSI Backend is running"}`

### Step 4: Update Your Frontend

In your histopathology app, when uploading .svs files:

```javascript
// Instead of converting locally, upload to backend
const formData = new FormData();
formData.append('file', svs_file);

const response = await fetch('http://your-backend-url/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
// data.dziUrl is the URL to use in your app!
// Example: "http://wsi.yourdomain.com/slides/slide_1234567890.dzi"
```

## Usage Flow

1. **User uploads .svs file in your app**
2. **Your app sends it to this backend**
3. **Backend converts to DZI** (takes 1-5 minutes depending on file size)
4. **Backend returns DZI URL**
5. **Your app displays slide using the URL**

## Troubleshooting

**Problem**: Deploy fails
- Check Coolify logs
- Make sure port 3001 is not in use
- Verify all files are uploaded correctly

**Problem**: Conversion fails
- Check container logs in Coolify
- Verify .svs file is valid
- Check available disk space

**Problem**: Can't access slides
- Make sure domain/IP is correct
- Check firewall allows port 3001
- Verify CORS settings if accessing from different domain

## File Storage

- **Uploaded files**: Temporarily stored during conversion, then deleted
- **Converted DZI files**: Stored in `/app/public/slides/`
- **Location on server**: Inside Docker container
- **Backup**: You can mount a volume in Coolify to persist data

## Scaling for Production

Once working, you can:
1. Add volume mount for persistent storage
2. Use Hetzner Object Storage for slides
3. Add authentication/API keys
4. Set up automatic backups

## Need Help?

- Check Coolify logs: Click on service → Logs tab
- Test upload with curl:
  ```bash
  curl -X POST -F "file=@test.svs" http://your-backend-url/upload
  ```

---

**That's it! Your WSI backend is ready to use.**
