import './LoadingScreen.css';

interface LoadingScreenProps {
  progress: number;
  currentAsset: string | null;
}

export function LoadingScreen({ progress, currentAsset }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h1 className="loading-title">ASTEROIDS</h1>
        
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div 
              className="loading-bar-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="loading-text">
            {progress < 100 ? `Loading... ${Math.round(progress)}%` : 'Ready!'}
          </div>
        </div>

        {currentAsset && (
          <div className="loading-asset-name">
            {currentAsset}
          </div>
        )}
      </div>
    </div>
  );
}
