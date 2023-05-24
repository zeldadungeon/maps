param(
    [Parameter(Mandatory)]
    [string]$Source,

    [Parameter(Mandatory)]
    [string]$Dest,

    [Parameter(Mandatory)]
    [string]$TileSize
)

if(-not(Test-Path "$Dest"))
{
    New-Item "$Dest" -ItemType Directory -Force
}

cmd.exe /c "magick $Source -crop $($TileSize)x$TileSize -set filename:tile ""%[fx:page.x/$TileSize]_%[fx:page.y/$TileSize]"" +repage +adjoin ""$Dest/%[filename:tile].jpg"""