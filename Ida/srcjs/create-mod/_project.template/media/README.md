# Media Assets

This folder contains custom media assets for your mod.

## Directory Structure

You can create `images` and `sprites` folders here to have custom PNG files for your IdaJS mod:

```
media/
├── images/
│   ├── my-dialog-bg.png
│   ├── cutscene-01.png
│   └── ...
└── sprites/
    ├── item-icon.png
    ├── character-portrait.png
    └── ...
```

## Usage

- **`images/`** - Full-screen dialog backgrounds and standalone images
- **`sprites/`** - In-dialog pictures and smaller graphics used within dialogs

All PNG files will be automatically synced to your IdaJS installation when you run `npm start` or `npm run sync`.
