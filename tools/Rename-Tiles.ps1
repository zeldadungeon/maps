param(
    [Parameter(Mandatory)]
    [string]$Source,

    [Parameter(Mandatory)]
    [string]$Dest
)

# TODO fix A/B
Get-ChildItem $Source | Where-Object { $_.Name -notlike "*_B.png" } | ForEach-Object {
    # ex G_02-03_02_TT_A.png
    $Parts = $_.Name.Split("_")
    $Coords = $Parts[1].Split("-")
    $X = $Coords[0]
    $Y = $Coords[1]
    $Zoom = $Parts[2]
    $Filename = '{0}_{1}.png' -f $Y, $X

    if(-not(Test-Path "$Dest"))
    {
        New-Item "$Dest" -ItemType Directory -Force
    }

    if(-not(Test-Path "$Dest\$Zoom"))
    {
        New-Item "$Dest\$Zoom" -ItemType Directory -Force
    }

    Copy-Item -Path $_.FullName -Destination $Dest\$Zoom\$Filename
}