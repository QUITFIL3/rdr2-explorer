# Generates small grid thumbnails for the model screenshots so the gallery does
# not download 2560x1440 JPEGs to render 150px tiles.
#   public/images/models/<name>.jpg  ->  public/images/models/thumbs/<name>.jpg (320px wide)
# Usage: npm run make-thumbnails   (re-runnable; skips thumbs that already exist)
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'public\images\models'
$out = Join-Path $src 'thumbs'
New-Item -ItemType Directory -Force $out | Out-Null

$targetW = 320
$files = Get-ChildItem $src -Filter *.jpg -File
$total = $files.Count
$made = 0
$skipped = 0
$errors = 0
$i = 0

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]72)

foreach ($f in $files) {
    $i++
    $dest = Join-Path $out $f.Name
    if (Test-Path $dest) { $skipped++; continue }
    try {
        $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
        $ms = New-Object System.IO.MemoryStream(,$bytes)
        $img = [System.Drawing.Image]::FromStream($ms)
        $w = $targetW
        $h = [int][Math]::Max(1, [Math]::Round($img.Height * $targetW / $img.Width))
        if ($img.Width -le $targetW) { $w = $img.Width; $h = $img.Height }
        $bmp = New-Object System.Drawing.Bitmap($w, $h)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $w, $h)
        $g.Dispose()
        $bmp.Save($dest, $encoder, $params)
        $bmp.Dispose(); $img.Dispose(); $ms.Dispose()
        $made++
    } catch {
        $errors++
        Write-Output ("ERROR {0}: {1}" -f $f.Name, $_.Exception.Message)
    }
    if ($i % 500 -eq 0) { Write-Output ("{0}/{1} processed, {2} made" -f $i, $total, $made) }
}
Write-Output ("done: {0} files, {1} thumbs made, {2} already present, {3} errors" -f $total, $made, $skipped, $errors)
