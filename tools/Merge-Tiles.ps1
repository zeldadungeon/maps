# Get the tile width
add-type -AssemblyName System.Drawing
$OneTile = Get-Item "00_00.png"
$TileWidth = [System.Drawing.Image]::FromFile($OneTile.FullName).Width
$Square = $TileWidth*12
$BorderRatio = 96/36000
$SquareWithPadding = $Square * (1 + $BorderRatio)
$FinalSize = 36096
while ($FinalSize -gt $SquareWithPadding)
{
    $FinalSize /= 2
}

#$FinalSize = 564;
#$FinalSize = 4512;
#$FinalSize = 18048;
$Output = "full.jpg";

Write-Host $TileWidth, $SquareWithPadding, $FinalSize

cmd.exe /c "magick montage -mode concatenate -tile 12x10 *_*.png combined.png"

cmd.exe /c "magick combined.png -alpha set -virtual-pixel transparent -channel A -blur 0x$TileWidth -level 50%,100% -background black -alpha remove -flatten -alpha off -gravity center -extent $($SquareWithPadding)x$SquareWithPadding -resize $($FinalSize)x$FinalSize -strip -interlace Plane -gaussian-blur 0.05 -quality 85% +channel $Output"