# Workflows for extracting files/data

This documentation mainly applies to TotK

## Tiles

Starting from romfs/UI/Map/MainField, this is the process for generating the map tiles:

1. Filter-Tiles.ps1 <path-to-MainField> <dest>
2. Bulk export in SwitchToolbox
3. Split out the three layers into different directories
4. Rename-Tiles.ps1 <sourcedir> <destdir>
5. Merge-Tiles.ps1 <sourcedir> <destfile>
6. Split-Tiles.ps1 <sourcefile> <destdir> <tilesize>

## Pins

- Pins are located in a compressed archive. First, get the zs dictionary from /Pack/ZsDic.pack.zs (open in SwitchToolbox, extract all three items).
- SwitchToolbox doesn't handle TotK zs compression. Get the zs tool from https://github.com/facebook/zstd/releases
- Pins are found here: UI/LayoutArchive/Common.Product.100.Nin_NX_NVN.blarc.zs
- zstd.exe -d Common.Product.100.Nin_NX_NVN.blarc.zs -o Common.Product.100.Nin_NX_NVN.blarc -D zs.zsdic
- Open the .blarc in STB
- Texture files are under timg/\_\_Combined.bntx (double-click to open). Extract the ones starting with MapIcon.
- Layout files are under blyt. Use the ones starting with PaMapIcon to find the right colors, transforms, etc. for the icons.
- I don't see a way to just extract the whole icon as an image, so for now I'm doing:
- - Open the individual textures in GIMP
- - For each layer under RootPane, go to Colors in the bottom-left window and set those as FG and BG colors in GIMP
- - GIMP: Select "FG to BG (RGB)" gradient, then Color -> Map -> Gradient Map
- - GIMP: Scale any layers that need to be scaled, referring to the Pane window in the bottomleft of STB
