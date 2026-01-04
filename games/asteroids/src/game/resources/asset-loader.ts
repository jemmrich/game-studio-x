/**
 * AssetLoader Resource
 * Manages preloading of game assets (audio, fonts, etc.) before gameplay begins.
 * Provides progress tracking and callbacks for UI feedback.
 */

export type AssetType = 'audio' | 'font';

export interface Asset {
  id: string;
  type: AssetType;
  url: string;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset: string | null;
}

export class AssetLoader {
  private assets: Asset[] = [];
  private loadedAssets: Map<string, HTMLAudioElement | FontFace> = new Map();
  private loadProgress: LoadProgress = {
    loaded: 0,
    total: 0,
    percentage: 0,
    currentAsset: null,
  };
  private onProgressCallback?: (progress: LoadProgress) => void;
  private onCompleteCallback?: () => void;

  /**
   * Register an asset to be loaded
   */
  registerAsset(id: string, type: AssetType, url: string): void {
    this.assets.push({ id, type, url });
    this.loadProgress.total = this.assets.length;
  }

  /**
   * Register multiple assets at once
   */
  registerAssets(assets: Array<{ id: string; type: AssetType; url: string }>): void {
    for (const asset of assets) {
      this.registerAsset(asset.id, asset.type, asset.url);
    }
  }

  /**
   * Set callback for progress updates
   */
  onProgress(callback: (progress: LoadProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Set callback for completion
   */
  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }

  /**
   * Start loading all registered assets
   */
  async loadAll(): Promise<void> {
    console.log(`[AssetLoader] Starting to load ${this.assets.length} assets...`);

    const promises = this.assets.map((asset) => this.loadAsset(asset));
    
    try {
      await Promise.all(promises);
      console.log('[AssetLoader] All assets loaded successfully');
      this.onCompleteCallback?.();
    } catch (error) {
      console.error('[AssetLoader] Error loading assets:', error);
      throw error;
    }
  }

  /**
   * Load a single asset based on its type
   */
  private async loadAsset(asset: Asset): Promise<void> {
    this.loadProgress.currentAsset = asset.id;
    
    try {
      let loadedAsset: HTMLAudioElement | FontFace;

      switch (asset.type) {
        case 'audio':
          loadedAsset = await this.loadAudio(asset.url);
          break;
        case 'font':
          loadedAsset = await this.loadFont(asset.id, asset.url);
          break;
        default:
          throw new Error(`Unknown asset type: ${asset.type}`);
      }

      this.loadedAssets.set(asset.id, loadedAsset);
      this.updateProgress(asset.id);
    } catch (error) {
      console.error(`[AssetLoader] Failed to load ${asset.id}:`, error);
      throw error;
    }
  }

  /**
   * Load an audio file
   */
  private loadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.addEventListener('canplaythrough', () => {
        resolve(audio);
      }, { once: true });

      audio.addEventListener('error', (_e) => {
        reject(new Error(`Failed to load audio: ${url}`));
      }, { once: true });

      audio.preload = 'auto';
      audio.src = url;
      audio.load();
    });
  }

  /**
   * Load a font using CSS Font Loading API
   */
  private loadFont(fontFamily: string, url: string): Promise<FontFace> {
    return new Promise((resolve, reject) => {
      const fontFace = new FontFace(fontFamily, `url(${url})`);
      
      fontFace.load()
        .then((loadedFont) => {
          // Add font to document
          document.fonts.add(loadedFont);
          resolve(loadedFont);
        })
        .catch((_error) => {
          reject(new Error(`Failed to load font: ${fontFamily} from ${url}`));
        });
    });
  }

  /**
   * Update loading progress and trigger callback
   */
  private updateProgress(assetId: string): void {
    this.loadProgress.loaded++;
    this.loadProgress.percentage = (this.loadProgress.loaded / this.loadProgress.total) * 100;
    
    console.log(
      `[AssetLoader] Loaded ${assetId} (${this.loadProgress.loaded}/${this.loadProgress.total}) - ${this.loadProgress.percentage.toFixed(0)}%`
    );

    this.onProgressCallback?.(this.loadProgress);
  }

  /**
   * Get a loaded audio asset
   */
  getAudio(id: string): HTMLAudioElement | undefined {
    const asset = this.loadedAssets.get(id);
    return asset instanceof HTMLAudioElement ? asset : undefined;
  }

  /**
   * Get a loaded font asset
   */
  getFont(id: string): FontFace | undefined {
    const asset = this.loadedAssets.get(id);
    return asset instanceof FontFace ? asset : undefined;
  }

  /**
   * Check if an asset is loaded
   */
  isLoaded(id: string): boolean {
    return this.loadedAssets.has(id);
  }

  /**
   * Get current load progress
   */
  getProgress(): LoadProgress {
    return { ...this.loadProgress };
  }

  /**
   * Check if all assets are loaded
   */
  isComplete(): boolean {
    return this.loadProgress.loaded === this.loadProgress.total && this.loadProgress.total > 0;
  }
}
