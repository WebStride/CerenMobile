# Store Assets

App Store & Play Store listing assets and metadata.

## Directory Structure

```
store-assets/
├── app-icon/              # High-resolution app icons
│   ├── play-store/        # 512x512 PNG (no transparency)
│   └── app-store/         # 1024x1024 PNG (no transparency)
├── play-store/            # Google Play Console assets
│   ├── feature-graphic/   # 1024x500 PNG
│   ├── screenshots/       # Phone & tablet screenshots
│   └── promo-graphic/     # Promotional graphics
├── app-store/             # App Store Connect assets
│   ├── screenshots/       # Device-specific screenshots
│   └── app-preview/       # App preview videos (MP4/MOV)
└── metadata/              # Text content for store listings
    ├── play-store/        # Title, descriptions, keywords
    └── app-store/         # Title, subtitle, description, keywords
```

## Google Play Store

### App Icon
- **File:** `app-icon/play-store/icon-512x512.png`
- **Size:** 512x512px, PNG, no transparency
- **Max file size:** 1 MB

### Feature Graphic
- **File:** `play-store/feature-graphic/feature-graphic-1024x500.png`
- **Size:** 1024x500px, PNG or JPEG
- **Max file size:** 1 MB

### Phone Screenshots
- **Dir:** `play-store/screenshots/phone/`
- **Min:** 2 screenshots, max 8
- **Size:** min 320px width, max 3840px on longest side
- **Aspect ratio:** 16:9 or 9:16
- **Format:** PNG or JPEG

### Tablet Screenshots
- **Dir:** `play-store/screenshots/tablet/`
- **Same specs as phone screenshots**

### Promo Graphic (optional)
- **Dir:** `play-store/promo-graphic/`
- **Size:** 180x120px, PNG or JPEG

## App Store

### App Icon
- **File:** `app-icon/app-store/icon-1024x1024.png`
- **Size:** 1024x1024px, PNG, no transparency
- **Max file size:** 1 MB

### Screenshots

Required: at least one screenshot for one device size.

| Device | Dir | Resolution |
|--------|-----|------------|
| iPhone 6.7" | `app-store/screenshots/iphone-6.7-inch/` | 1290x2796 |
| iPhone 6.5" | `app-store/screenshots/iphone-6.5-inch/` | 1242x2688 |
| iPhone 5.5" | `app-store/screenshots/iphone-5.5-inch/` | 1242x2208 |
| iPad Pro 12.9" | `app-store/screenshots/ipad/` | 2048x2732 |

- **Format:** PNG or JPEG
- **Max file size:** 10 MB per screenshot

### App Preview Video (optional)
- **Dir:** `app-store/app-preview/`
- **Length:** 15-30 seconds
- **Format:** MP4 or MOV
- **Max file size:** 500 MB

## Metadata

### Play Store
| File | Purpose | Limit |
|------|---------|-------|
| `title.txt` | App name | 30 chars |
| `short-description.txt` | Short blurb | 80 chars |
| `full-description.txt` | Full listing | 4,000 chars |
| `keywords.txt` | Search keywords (comma-separated) | — |

### App Store
| File | Purpose | Limit |
|------|---------|-------|
| `title.txt` | App name | 30 chars |
| `subtitle.txt` | Subtitle under app name | 30 chars |
| `description.txt` | Full listing | 4,000 chars |
| `keywords.txt` | Search keywords (comma-separated, no spaces) | 100 chars |
| `promotional-text.txt` | Promotional text | 170 chars |
