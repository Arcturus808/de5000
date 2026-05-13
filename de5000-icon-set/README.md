# Icon Set

## Contents

- `png/`: transparent square PNG icons from 16px through 1024px.
- `web/`: favicon PNGs, `favicon.ico`, Apple touch icon, Android Chrome icons, Microsoft tile, and `site.webmanifest`.
- `desktop/`: Windows multi-resolution `<slug>.ico`.
- `macos/<slug>.iconset/`: macOS iconset PNG source folder. On macOS, run `iconutil -c icns <slug>.iconset` from inside `macos/` to create `<slug>.icns`.
- `linux/`: freedesktop-style PNG sizes.
- `mobile/ios/AppIcon.appiconset/`: Xcode-ready iPhone/iPad app icon set with `Contents.json`.
- `mobile/android/`: Android launcher icons, adaptive icon XML, foreground/background resources, and Play Store icon.
- `source/`: copied original source image.

## Web HTML

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#FFD117">
```

## Mobile

### iOS

Drag `mobile/ios/AppIcon.appiconset` into an Xcode asset catalog, or replace an existing `AppIcon.appiconset` folder.

### Android

Copy the contents of `mobile/android` into `app/src/main/res/`. The density-specific launcher PNGs and `mipmap-anydpi-v26` adaptive icon XML are already arranged in Android resource folder names. Use `mobile/android/play-store-icon.png` for the Google Play listing icon.

## Source Images

Supported source formats are PNG, JPG, JPEG, BMP, GIF, TIF, and TIFF. The source must be a readable image file with non-empty content and valid dimensions.

Use an image that is at least `16x16` pixels. For crisp desktop, mobile, and app-store assets, `1024x1024` or larger is recommended.

By default, near-white source corners are made transparent for the transparent PNG outputs. Use `-KeepWhiteCorners` when the source image's white corners should remain visible.

## Regenerate

Run this from your project folder:

```powershell
./build-icon-set.ps1 -Source ".\path\to\source-image.png" -AppName "My App" -Slug "my-app"
```
