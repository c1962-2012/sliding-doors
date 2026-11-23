# Disegna l'immagine di copertina (1200x630) che WhatsApp, Instagram e Facebook mostrano quando si condivide il link dell'app.
# uso: powershell -File tools/make-og.ps1   (scrive tools/site-assets/og.png)
Add-Type -AssemblyName System.Drawing
$W = 1200; $H = 630
$out = Join-Path $PSScriptRoot "site-assets\og.png"
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "AntiAlias"; $g.TextRenderingHint = "AntiAliasGridFit"

# sfondo scuro con un alone rosso, come l'app
$rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(5,10,20)), ([System.Drawing.Color]::FromArgb(22,30,52)), 35
$g.FillRectangle($bg, $rect)
$glow = New-Object System.Drawing.Drawing2D.GraphicsPath
$glow.AddEllipse(700, -260, 760, 760)
$pg = New-Object System.Drawing.Drawing2D.PathGradientBrush $glow
$pg.CenterColor = [System.Drawing.Color]::FromArgb(110, 229, 40, 58); $pg.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 229, 40, 58))
$g.FillPath($pg, $glow)

# prato e podio stilizzati a destra
$grass = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 120, 200, 140))
$g.FillEllipse($grass, 720, 500, 560, 220)
$cols = @(@{x=800; h=120; c=[System.Drawing.Color]::FromArgb(160,30,60); n="2"}, @{x=925; h=175; c=[System.Drawing.Color]::FromArgb(205,225,240); n="1"}, @{x=1050; h=90; c=[System.Drawing.Color]::FromArgb(30,80,170); n="3"})
$numFont = New-Object System.Drawing.Font "Impact", 52
foreach ($c in $cols) {
  $b = New-Object System.Drawing.SolidBrush $c.c
  $g.FillRectangle($b, $c.x, 540 - $c.h, 115, $c.h)
  $tb = if ($c.n -eq "1") { [System.Drawing.Brushes]::Black } else { [System.Drawing.Brushes]::White }
  $g.DrawString($c.n, $numFont, $tb, $c.x + 32, 540 - $c.h + 8)
}

# titolo
$white = [System.Drawing.Brushes]::White
$red = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 77, 109))
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(190, 200, 220))
$big = New-Object System.Drawing.Font "Impact", 112
$g.DrawString("SLIDING", $big, $white, 60, 60)
$wSliding = $g.MeasureString("SLIDING ", $big).Width
$g.DrawString("DOORS", $big, $red, 60 + $wSliding - 20, 60)
$g.DrawString("SERIE A", $big, $white, 60, 190)
$sub = New-Object System.Drawing.Font "Segoe UI", 28
$g.DrawString("Cambia un risultato e riscrivi la storia.", $sub, $muted, 66, 345)
$g.DrawString("Risultati live, classifica e cannonieri.", $sub, $muted, 66, 392)
$by = New-Object System.Drawing.Font "Segoe UI Semibold", 26
$g.DrawString("un'app di", $by, $muted, 66, 520)
$wBy = $g.MeasureString("un'app di", $by).Width
$g.DrawString("ciuffa62", (New-Object System.Drawing.Font "Segoe UI Black", 30), $red, 66 + $wBy + 4, 515)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "scritto $out"
