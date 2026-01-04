# Asset Preloading System

## Overview

This document describes the asset preloading system implemented for the Asteroids game. The system ensures all assets (audio files and fonts) are loaded before the game starts, providing a smooth user experience with a loading screen showing progress.

## Architecture

### Components

1. **AssetLoader Resource** (`game/resources/asset-loader.ts`)
   - Core resource that handles loading and managing game assets
   - Supports audio files and custom fonts
   - Provides progress tracking and callbacks
   - Stores loaded assets for runtime access

2. **LoadingScreen Component** (`ui/components/loading-screen/`)
   - React component that displays loading progress
   - Shows percentage complete and current asset being loaded
   - Uses the Hyperspace font for consistency with game style

3. **Modified GameUI Component** (`ui/components/game-ui/GameUI.tsx`)
   - Updated to accept loading state props
   - Conditionally renders LoadingScreen while assets load
   - Transitions to game views after loading completes

4. **Modified main.tsx**
   - Restructured to support async initialization
   - Creates AssetLoader and registers all game assets
   - Initializes game world only after assets are loaded
   - Manages loading state through React hooks

## Asset Types Supported

### Audio Files
- `background.mp3` - Background music
- `explosion.mp3` - Explosion sound effect
- `missile.mp3` - Missile fire sound effect
- `warp.mp3` - Hyperspace warp sound effect

### Fonts
- `hyperspace.ttf` - Custom game font (Hyperspace)

## Implementation Details

### Asset Registration

Assets are registered in `main.tsx` during initialization:

```typescript
const assetLoader = new AssetLoader();

assetLoader.registerAssets([
  { id: 'background', type: 'audio', url: '/background.mp3' },
  { id: 'explosion', type: 'audio', url: '/explosion.mp3' },
  { id: 'missile', type: 'audio', url: '/missile.mp3' },
  { id: 'warp', type: 'audio', url: '/warp.mp3' },
  { id: 'Hyperspace', type: 'font', url: '/hyperspace.ttf' },
]);
```

### Loading Process

1. **Initialize**: App component creates World and starts loading
2. **Register**: All assets are registered with AssetLoader
3. **Load**: Assets load in parallel with progress updates
4. **Display**: Loading screen shows progress percentage
5. **Complete**: Once loaded, AssetLoader is added to World resources
6. **Start**: Game world is initialized and game loop begins

### Progress Tracking

The AssetLoader provides real-time progress updates:

```typescript
assetLoader.onProgress((progress) => {
  // progress.loaded: number of assets loaded
  // progress.total: total number of assets
  // progress.percentage: completion percentage (0-100)
  // progress.currentAsset: name of asset being loaded
});
```

### Asset Access at Runtime

Game systems can access loaded assets through the World:

```typescript
const assetLoader = world.getResource<AssetLoader>("assetLoader");

// Get audio element
const explosionAudio = assetLoader?.getAudio('explosion');
if (explosionAudio) {
  const sfx = explosionAudio.cloneNode(true) as HTMLAudioElement;
  sfx.play();
}

// Check if font is loaded
if (assetLoader?.isLoaded('Hyperspace')) {
  // Font is ready to use
}
```

## Loading Screen Design

The loading screen features:
- Large "ASTEROIDS" title in Hyperspace font
- Progress bar with fill animation
- Percentage indicator
- Current asset name display
- Consistent styling with game aesthetics (black background, white text)
- Responsive design for different screen sizes

## Benefits

1. **No Loading Stutters**: All assets loaded before gameplay begins
2. **User Feedback**: Visual progress indicator keeps user informed
3. **Better UX**: Smooth transition from loading to gameplay
4. **Error Handling**: Catches and logs loading failures
5. **Centralized Management**: Single source of truth for all assets
6. **Runtime Access**: Easy asset retrieval during gameplay

## Future Enhancements

Potential improvements to the system:

1. **Asset Groups**: Load assets in priority groups (critical first, optional later)
2. **Retry Logic**: Automatically retry failed asset loads
3. **Caching**: Use service workers for offline asset caching
4. **Lazy Loading**: Load some assets on-demand during gameplay
5. **Compression**: Use compressed audio formats with fallbacks
6. **Loading Screen Animations**: Add particle effects or animations to loading screen
7. **Error UI**: Dedicated error screen for failed asset loads

## Usage Example

To add a new asset to the preloader:

1. Add the asset file to the `public/` directory
2. Register it in `main.tsx`:
   ```typescript
   assetLoader.registerAsset('newSound', 'audio', '/newsound.mp3');
   ```
3. Access it at runtime:
   ```typescript
   const audio = assetLoader?.getAudio('newSound');
   ```

## Technical Notes

- **Font Loading**: Uses the CSS Font Loading API for reliable font preloading
- **Audio Loading**: Uses `canplaythrough` event to ensure audio is fully buffered
- **Parallel Loading**: All assets load simultaneously for faster startup
- **TypeScript**: Fully typed for compile-time safety
- **React Integration**: Seamless integration with React component lifecycle

## File Structure

```
games/asteroids/
  src/
    game/
      resources/
        asset-loader.ts          # Core AssetLoader resource
    ui/
      components/
        loading-screen/
          LoadingScreen.tsx      # Loading screen component
          LoadingScreen.css      # Loading screen styles
        game-ui/
          GameUI.tsx             # Updated to handle loading state
    main.tsx                     # Updated with async initialization
  public/
    background.mp3               # Background music
    explosion.mp3                # Explosion sound
    missile.mp3                  # Missile sound
    warp.mp3                     # Warp sound
    hyperspace.ttf               # Custom font
```

## Testing Checklist

- [ ] All assets load successfully
- [ ] Progress bar updates smoothly
- [ ] Loading screen displays correctly
- [ ] Game starts after loading completes
- [ ] Assets are accessible at runtime
- [ ] Error handling works for failed loads
- [ ] Responsive design works on different screen sizes
- [ ] Font renders correctly after loading
- [ ] Audio plays correctly after loading
