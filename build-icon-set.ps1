param(
    [string]$Source,
    [string]$AppName,
    [string]$Slug,
    [string]$OutDir,
    [string]$BackgroundColor = '#F2F4F4',
    [string]$ThemeColor = '#FFD117',
    [switch]$KeepWhiteCorners,
    [switch]$Help
)

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function Show-Usage {
    $scriptName = Split-Path -Leaf $PSCommandPath
    @"
Icon set generator

Creates a project-local icon pack from any PNG/JPEG/BMP/GIF/TIFF source image.
Outputs web, desktop, Linux, iOS, and Android icon assets.

Usage:
  .\$scriptName -Source <image-path> [options]

Required:
  -Source <path>              Source image to convert into an icon set.

Options:
  -AppName <name>             Human-readable app name for manifests and README.
                              Defaults to the source filename.
  -Slug <slug>                Filename/output slug. Defaults to a safe version of AppName.
  -OutDir <path>              Output folder. Defaults to <script-folder>\<slug>-icon-set.
  -BackgroundColor <#RRGGBB>  Background for platform icons that disallow alpha.
                              Default: #F2F4F4.
  -ThemeColor <#RRGGBB>       Web manifest theme color. Default: #FFD117.
  -KeepWhiteCorners           Keep near-white source corners instead of making them transparent.
  -Help                       Show this help.

Validation:
  The script checks that the source exists, is a file, uses a supported extension,
  can be decoded as an image, and has valid dimensions before generating assets.

Examples:
  .\$scriptName -Source .\assets\logo.png
  .\$scriptName -Source .\brand\app-icon.png -AppName "My App"
  .\$scriptName -Source .\logo.png -Slug myapp -BackgroundColor "#101820" -ThemeColor "#FFD117"

Output:
  The icon set is written inside the folder where this script lives by default.
  If that folder is protected or read-only, pass -OutDir with a writable folder.
"@ | Write-Host
}

if ($Help) {
    Show-Usage
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Source)) {
    Show-Usage
    throw "Missing required -Source parameter."
}

function New-Directory([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Assert-WritableOutputDirectory([string]$Path) {
    try {
        New-Directory $Path

        $probePath = Join-Path $Path ".icon-set-write-test-$([System.Guid]::NewGuid().ToString('N')).tmp"
        Set-Content -LiteralPath $probePath -Value 'write-test' -Encoding ASCII
        Remove-Item -LiteralPath $probePath -Force
    }
    catch {
        $message = @"
Cannot write to the output folder:
  $Path

This usually means the script is running from a protected, read-only, synced, or network-controlled folder.
Choose a writable location with -OutDir, for example:
  .\$(Split-Path -Leaf $PSCommandPath) -Source ".\assets\logo.png" -OutDir ".\generated-icons"

Original error:
  $($_.Exception.Message)
"@

        throw $message
    }
}

function ConvertTo-Slug([string]$Value) {
    $slugValue = $Value.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $slugValue = $slugValue.Trim('-')

    if ([string]::IsNullOrWhiteSpace($slugValue)) {
        return 'app'
    }

    return $slugValue
}

function ConvertFrom-HexColor([string]$Value) {
    if ($Value -notmatch '^#?([0-9a-fA-F]{6})$') {
        throw "Invalid color '$Value'. Use #RRGGBB format."
    }

    $hex = $Matches[1]
    $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)

    return [System.Drawing.Color]::FromArgb(255, $r, $g, $b)
}

function Normalize-HexColor([string]$Value) {
    if ($Value -notmatch '^#?([0-9a-fA-F]{6})$') {
        throw "Invalid color '$Value'. Use #RRGGBB format."
    }

    return "#$($Matches[1].ToUpperInvariant())"
}

function Test-SupportedImageExtension([string]$Path) {
    $extension = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
    return @('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tif', '.tiff') -contains $extension
}

function Test-ImageHasContent([System.Drawing.Bitmap]$Bitmap) {
    $sampleX = @(0, [int][Math]::Floor($Bitmap.Width / 2), ($Bitmap.Width - 1)) | Sort-Object -Unique
    $sampleY = @(0, [int][Math]::Floor($Bitmap.Height / 2), ($Bitmap.Height - 1)) | Sort-Object -Unique

    foreach ($x in $sampleX) {
        foreach ($y in $sampleY) {
            if ($Bitmap.GetPixel($x, $y).A -gt 0) {
                return $true
            }
        }
    }

    return $false
}

function Get-ValidatedSourceBitmap([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Source image not found: $Path"
    }

    $item = Get-Item -LiteralPath $Path
    if ($item.PSIsContainer) {
        throw "Source must be an image file, but this path is a folder: $Path"
    }

    if ($item.Length -le 0) {
        throw "Source image is empty: $Path"
    }

    if (-not (Test-SupportedImageExtension $Path)) {
        throw "Unsupported source image type '$($item.Extension)'. Use PNG, JPG, JPEG, BMP, GIF, TIF, or TIFF."
    }

    try {
        $bitmap = [System.Drawing.Bitmap]::FromFile($Path)
    }
    catch {
        throw "Source image could not be decoded. It may be corrupt, incomplete, or not a real image file. Original error: $($_.Exception.Message)"
    }

    if ($bitmap.Width -lt 1 -or $bitmap.Height -lt 1) {
        $bitmap.Dispose()
        throw "Source image has invalid dimensions."
    }

    if ($bitmap.Width -lt 16 -or $bitmap.Height -lt 16) {
        $bitmap.Dispose()
        throw "Source image is too small. Use an image that is at least 16x16 pixels; 1024x1024 or larger is recommended."
    }

    if ($bitmap.Width -lt 512 -or $bitmap.Height -lt 512) {
        Write-Warning "Source image is $($bitmap.Width)x$($bitmap.Height). Icons will be generated, but 1024x1024 or larger is recommended for crisp app-store and desktop assets."
    }

    if (($bitmap.Width * $bitmap.Height) -gt 100000000) {
        Write-Warning "Source image is very large ($($bitmap.Width)x$($bitmap.Height)); generation may be slow or memory-intensive."
    }

    if (-not (Test-ImageHasContent $bitmap)) {
        $bitmap.Dispose()
        throw "Source image appears to be fully transparent or blank."
    }

    return $bitmap
}

function Save-Png([System.Drawing.Bitmap]$Bitmap, [string]$Path) {
    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-TransparentBitmap([int]$Size) {
    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.Dispose()
    return $bitmap
}

function Copy-With-White-Corner-Alpha([System.Drawing.Bitmap]$SourceBitmap) {
    $result = New-Object System.Drawing.Bitmap $SourceBitmap.Width, $SourceBitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($y = 0; $y -lt $SourceBitmap.Height; $y++) {
        for ($x = 0; $x -lt $SourceBitmap.Width; $x++) {
            $color = $SourceBitmap.GetPixel($x, $y)
            $nearWhite = ($color.R -ge 248 -and $color.G -ge 248 -and $color.B -ge 248)

            if ($nearWhite) {
                $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
            }
            else {
                $result.SetPixel($x, $y, $color)
            }
        }
    }

    return $result
}

function New-SquareIcon([System.Drawing.Bitmap]$SourceBitmap, [int]$Size, [double]$Fill = 0.92) {
    $canvas = New-TransparentBitmap $Size
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $maxW = [int][Math]::Round($Size * $Fill)
    $maxH = [int][Math]::Round($Size * $Fill)
    $scale = [Math]::Min($maxW / $SourceBitmap.Width, $maxH / $SourceBitmap.Height)
    $drawW = [int][Math]::Round($SourceBitmap.Width * $scale)
    $drawH = [int][Math]::Round($SourceBitmap.Height * $scale)
    $x = [int][Math]::Round(($Size - $drawW) / 2)
    $y = [int][Math]::Round(($Size - $drawH) / 2)

    $graphics.DrawImage($SourceBitmap, $x, $y, $drawW, $drawH)
    $graphics.Dispose()

    return $canvas
}

function New-SolidBackgroundIcon([System.Drawing.Bitmap]$SourceBitmap, [int]$Size, [System.Drawing.Color]$Background, [double]$Fill = 0.82) {
    $canvas = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.Clear($Background)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $maxW = [int][Math]::Round($Size * $Fill)
    $maxH = [int][Math]::Round($Size * $Fill)
    $scale = [Math]::Min($maxW / $SourceBitmap.Width, $maxH / $SourceBitmap.Height)
    $drawW = [int][Math]::Round($SourceBitmap.Width * $scale)
    $drawH = [int][Math]::Round($SourceBitmap.Height * $scale)
    $x = [int][Math]::Round(($Size - $drawW) / 2)
    $y = [int][Math]::Round(($Size - $drawH) / 2)

    $graphics.DrawImage($SourceBitmap, $x, $y, $drawW, $drawH)
    $graphics.Dispose()

    return $canvas
}

function Write-Ico([System.Drawing.Bitmap[]]$Bitmaps, [string]$Path) {
    $pngPayloads = @()

    foreach ($bitmap in $Bitmaps) {
        $stream = New-Object System.IO.MemoryStream
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngPayloads += ,$stream.ToArray()
        $stream.Dispose()
    }

    $file = [System.IO.File]::Create($Path)
    $writer = New-Object System.IO.BinaryWriter $file
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$Bitmaps.Length)

    $offset = 6 + (16 * $Bitmaps.Length)
    for ($i = 0; $i -lt $Bitmaps.Length; $i++) {
        $bitmap = $Bitmaps[$i]
        $payload = $pngPayloads[$i]
        $writer.Write([byte]$(if ($bitmap.Width -ge 256) { 0 } else { $bitmap.Width }))
        $writer.Write([byte]$(if ($bitmap.Height -ge 256) { 0 } else { $bitmap.Height }))
        $writer.Write([byte]0)
        $writer.Write([byte]0)
        $writer.Write([UInt16]1)
        $writer.Write([UInt16]32)
        $writer.Write([UInt32]$payload.Length)
        $writer.Write([UInt32]$offset)
        $offset += $payload.Length
    }

    foreach ($payload in $pngPayloads) {
        $writer.Write($payload)
    }

    $writer.Dispose()
    $file.Dispose()
}

$sourcePath = [System.IO.Path]::GetFullPath($Source)

$raw = Get-ValidatedSourceBitmap $sourcePath

if ([string]::IsNullOrWhiteSpace($AppName)) {
    $AppName = [System.IO.Path]::GetFileNameWithoutExtension($sourcePath)
}

if ([string]::IsNullOrWhiteSpace($Slug)) {
    $Slug = ConvertTo-Slug $AppName
}
else {
    $Slug = ConvertTo-Slug $Slug
}

if ([string]::IsNullOrWhiteSpace($OutDir)) {
    $OutDir = Join-Path $PSScriptRoot "$Slug-icon-set"
}

$outPath = [System.IO.Path]::GetFullPath($OutDir)
$backgroundHex = Normalize-HexColor $BackgroundColor
$themeHex = Normalize-HexColor $ThemeColor
$background = ConvertFrom-HexColor $backgroundHex
$theme = ConvertFrom-HexColor $themeHex

Assert-WritableOutputDirectory $outPath
foreach ($dir in @(
        'png',
        'web',
        'desktop',
        "macos/$Slug.iconset",
        'linux',
        'mobile/ios/AppIcon.appiconset',
        'mobile/android/mipmap-anydpi-v26',
        'mobile/android/mipmap-mdpi',
        'mobile/android/mipmap-hdpi',
        'mobile/android/mipmap-xhdpi',
        'mobile/android/mipmap-xxhdpi',
        'mobile/android/mipmap-xxxhdpi',
        'mobile/android/drawable',
        'mobile/android/drawable-mdpi',
        'mobile/android/drawable-hdpi',
        'mobile/android/drawable-xhdpi',
        'mobile/android/drawable-xxhdpi',
        'mobile/android/drawable-xxxhdpi',
        'source'
    )) {
    New-Directory (Join-Path $outPath $dir)
}

$sourceCopyName = "$Slug-source$([System.IO.Path]::GetExtension($sourcePath).ToLowerInvariant())"
Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $outPath "source/$sourceCopyName") -Force

if ($KeepWhiteCorners) {
    $sourceBitmap = New-Object System.Drawing.Bitmap $raw
}
else {
    $sourceBitmap = Copy-With-White-Corner-Alpha $raw
}
$raw.Dispose()

$pngSizes = @(16, 24, 32, 48, 64, 128, 256, 512, 1024)
$generated = @{}

foreach ($size in $pngSizes) {
    $icon = New-SquareIcon $sourceBitmap $size
    $generated[$size] = $icon
    Save-Png $icon (Join-Path $outPath "png/$Slug-icon-$size.png")
}

foreach ($size in @(16, 32, 48)) {
    Save-Png $generated[$size] (Join-Path $outPath "web/favicon-${size}x${size}.png")
}

$apple = New-SolidBackgroundIcon $sourceBitmap 180 $background 0.86
Save-Png $apple (Join-Path $outPath 'web/apple-touch-icon.png')
$apple.Dispose()

foreach ($size in @(192, 512)) {
    $android = New-SolidBackgroundIcon $sourceBitmap $size $background 0.78
    Save-Png $android (Join-Path $outPath "web/android-chrome-${size}x${size}.png")
    $android.Dispose()
}

$tile = New-SolidBackgroundIcon $sourceBitmap 150 $theme 0.78
Save-Png $tile (Join-Path $outPath 'web/mstile-150x150.png')
$tile.Dispose()

foreach ($size in @(16, 32, 48, 64, 128, 256, 512, 1024)) {
    Save-Png $generated[$size] (Join-Path $outPath "linux/$Slug-$size.png")
}

$macPairs = @(
    @{ Name = 'icon_16x16.png'; Size = 16 },
    @{ Name = 'icon_16x16@2x.png'; Size = 32 },
    @{ Name = 'icon_32x32.png'; Size = 32 },
    @{ Name = 'icon_32x32@2x.png'; Size = 64 },
    @{ Name = 'icon_128x128.png'; Size = 128 },
    @{ Name = 'icon_128x128@2x.png'; Size = 256 },
    @{ Name = 'icon_256x256.png'; Size = 256 },
    @{ Name = 'icon_256x256@2x.png'; Size = 512 },
    @{ Name = 'icon_512x512.png'; Size = 512 },
    @{ Name = 'icon_512x512@2x.png'; Size = 1024 }
)

foreach ($pair in $macPairs) {
    Save-Png $generated[$pair.Size] (Join-Path $outPath "macos/$Slug.iconset/$($pair.Name)")
}

$iosIconDefinitions = @(
    @{ idiom = 'iphone'; size = '20x20'; scale = '2x'; pixels = 40; filename = 'Icon-App-20x20@2x.png' },
    @{ idiom = 'iphone'; size = '20x20'; scale = '3x'; pixels = 60; filename = 'Icon-App-20x20@3x.png' },
    @{ idiom = 'iphone'; size = '29x29'; scale = '2x'; pixels = 58; filename = 'Icon-App-29x29@2x.png' },
    @{ idiom = 'iphone'; size = '29x29'; scale = '3x'; pixels = 87; filename = 'Icon-App-29x29@3x.png' },
    @{ idiom = 'iphone'; size = '40x40'; scale = '2x'; pixels = 80; filename = 'Icon-App-40x40@2x.png' },
    @{ idiom = 'iphone'; size = '40x40'; scale = '3x'; pixels = 120; filename = 'Icon-App-40x40@3x.png' },
    @{ idiom = 'iphone'; size = '60x60'; scale = '2x'; pixels = 120; filename = 'Icon-App-60x60@2x.png' },
    @{ idiom = 'iphone'; size = '60x60'; scale = '3x'; pixels = 180; filename = 'Icon-App-60x60@3x.png' },
    @{ idiom = 'ipad'; size = '20x20'; scale = '1x'; pixels = 20; filename = 'Icon-App-20x20@1x~ipad.png' },
    @{ idiom = 'ipad'; size = '20x20'; scale = '2x'; pixels = 40; filename = 'Icon-App-20x20@2x~ipad.png' },
    @{ idiom = 'ipad'; size = '29x29'; scale = '1x'; pixels = 29; filename = 'Icon-App-29x29@1x~ipad.png' },
    @{ idiom = 'ipad'; size = '29x29'; scale = '2x'; pixels = 58; filename = 'Icon-App-29x29@2x~ipad.png' },
    @{ idiom = 'ipad'; size = '40x40'; scale = '1x'; pixels = 40; filename = 'Icon-App-40x40@1x~ipad.png' },
    @{ idiom = 'ipad'; size = '40x40'; scale = '2x'; pixels = 80; filename = 'Icon-App-40x40@2x~ipad.png' },
    @{ idiom = 'ipad'; size = '76x76'; scale = '1x'; pixels = 76; filename = 'Icon-App-76x76@1x~ipad.png' },
    @{ idiom = 'ipad'; size = '76x76'; scale = '2x'; pixels = 152; filename = 'Icon-App-76x76@2x~ipad.png' },
    @{ idiom = 'ipad'; size = '83.5x83.5'; scale = '2x'; pixels = 167; filename = 'Icon-App-83.5x83.5@2x~ipad.png' },
    @{ idiom = 'ios-marketing'; size = '1024x1024'; scale = '1x'; pixels = 1024; filename = 'Icon-App-1024x1024@1x.png' }
)

$iosContents = [ordered]@{
    images = @()
    info = [ordered]@{
        author = 'codex'
        version = 1
    }
}

foreach ($definition in $iosIconDefinitions) {
    $icon = New-SolidBackgroundIcon $sourceBitmap $definition.pixels $background 0.82
    Save-Png $icon (Join-Path $outPath "mobile/ios/AppIcon.appiconset/$($definition.filename)")
    $icon.Dispose()

    $iosContents.images += [ordered]@{
        filename = $definition.filename
        idiom = $definition.idiom
        scale = $definition.scale
        size = $definition.size
    }
}

$iosContents | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $outPath 'mobile/ios/AppIcon.appiconset/Contents.json') -Encoding UTF8

$androidDensities = @(
    @{ density = 'mdpi'; launcher = 48; foreground = 108 },
    @{ density = 'hdpi'; launcher = 72; foreground = 162 },
    @{ density = 'xhdpi'; launcher = 96; foreground = 216 },
    @{ density = 'xxhdpi'; launcher = 144; foreground = 324 },
    @{ density = 'xxxhdpi'; launcher = 192; foreground = 432 }
)

foreach ($density in $androidDensities) {
    $launcher = New-SolidBackgroundIcon $sourceBitmap $density.launcher $background 0.78
    Save-Png $launcher (Join-Path $outPath "mobile/android/mipmap-$($density.density)/ic_launcher.png")
    Save-Png $launcher (Join-Path $outPath "mobile/android/mipmap-$($density.density)/ic_launcher_round.png")
    $launcher.Dispose()

    $foreground = New-SquareIcon $sourceBitmap $density.foreground 0.62
    Save-Png $foreground (Join-Path $outPath "mobile/android/drawable-$($density.density)/ic_launcher_foreground.png")
    $foreground.Dispose()
}

$playStore = New-SolidBackgroundIcon $sourceBitmap 512 $background 0.78
Save-Png $playStore (Join-Path $outPath 'mobile/android/play-store-icon.png')
$playStore.Dispose()

$androidBackgroundXml = @'
<?xml version="1.0" encoding="utf-8"?>
<color xmlns:android="http://schemas.android.com/apk/res/android">{{BACKGROUND_COLOR}}</color>
'@

$androidAdaptiveXml = @'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
'@

$androidBackgroundXml = $androidBackgroundXml.Replace('{{BACKGROUND_COLOR}}', $backgroundHex)

Set-Content -LiteralPath (Join-Path $outPath 'mobile/android/drawable/ic_launcher_background.xml') -Value $androidBackgroundXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $outPath 'mobile/android/mipmap-anydpi-v26/ic_launcher.xml') -Value $androidAdaptiveXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $outPath 'mobile/android/mipmap-anydpi-v26/ic_launcher_round.xml') -Value $androidAdaptiveXml -Encoding UTF8

Write-Ico @($generated[16], $generated[24], $generated[32], $generated[48], $generated[64], $generated[128], $generated[256]) (Join-Path $outPath "desktop/$Slug.ico")
Write-Ico @($generated[16], $generated[32], $generated[48]) (Join-Path $outPath 'web/favicon.ico')

$manifest = @{
    name = $AppName
    short_name = $AppName
    icons = @(
        @{ src = '/android-chrome-192x192.png'; sizes = '192x192'; type = 'image/png'; purpose = 'any maskable' },
        @{ src = '/android-chrome-512x512.png'; sizes = '512x512'; type = 'image/png'; purpose = 'any maskable' }
    )
    theme_color = $themeHex
    background_color = $backgroundHex
    display = 'standalone'
} | ConvertTo-Json -Depth 5

Set-Content -LiteralPath (Join-Path $outPath 'web/site.webmanifest') -Value $manifest -Encoding UTF8

$readme = @'
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
<meta name="theme-color" content="{{THEME_COLOR}}">
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
./{{SCRIPT_NAME}} -Source ".\path\to\source-image.png" -AppName "My App" -Slug "my-app"
```
'@

$readme = $readme.Replace('{{THEME_COLOR}}', $themeHex)
$readme = $readme.Replace('{{SCRIPT_NAME}}', (Split-Path -Leaf $PSCommandPath))

Set-Content -LiteralPath (Join-Path $outPath 'README.md') -Value $readme -Encoding UTF8

foreach ($bitmap in $generated.Values) {
    $bitmap.Dispose()
}
$sourceBitmap.Dispose()

Write-Host "Icon set written to $outPath"
