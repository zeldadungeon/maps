param(
    [Parameter(Mandatory)]
    [string]$Source,

    [Parameter(Mandatory)]
    [string]$Dest
)

Get-ChildItem $Source | where {
    $_.Name -notlike "*F*"
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $Dest
}