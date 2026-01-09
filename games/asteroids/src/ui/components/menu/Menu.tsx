import React, { useState, useEffect, useCallback } from 'react';
import type { World } from '@engine/core/world.ts';
import type { SceneManager } from '@engine/resources/scene-manager.ts';
import { GameplayScene } from '../../../game/scenes/gameplay.ts';
import { HowToPlayScene } from '../../../game/scenes/how-to-play-scene.ts';
import './Menu.css';
import * as THREE from 'three';

type MenuItem = 'new-game' | 'high-scores' | 'how-to-play' | 'credits';

const MENU_ITEMS: MenuItem[] = ['new-game', 'high-scores', 'how-to-play', 'credits'];

const MENU_LABELS: Record<MenuItem, string> = {
  'new-game': 'NEW GAME',
  'high-scores': 'HIGH SCORES',
  'how-to-play': 'HOW TO PLAY',
  'credits': 'CREDITS',
};

interface MenuProps {
  world: World;
  sceneManager: SceneManager;
}

export const Menu: React.FC<MenuProps> = ({ world, sceneManager }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
        setHoveredIndex(null);
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % MENU_ITEMS.length);
        setHoveredIndex(null);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleMenuSelect(MENU_ITEMS[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const handleMenuSelect = useCallback((item: MenuItem) => {
    const threeScene = world.getResource<THREE.Scene>('threeScene');
    
    // Emit menu-item-selected event to world so MenuScene can handle reset logic
    world.emitEvent('menu-item-selected', { menuItem: item });
    
    if (item === 'new-game') {
      sceneManager.loadScene(new GameplayScene(threeScene));
    } else if (item === 'high-scores') {
      console.log('[Menu] High scores selected (not implemented)');
    } else if (item === 'how-to-play') {
      sceneManager.loadScene(new HowToPlayScene(threeScene));
    } else if (item === 'credits') {
      console.log('[Menu] Credits selected (not implemented)');
    }
  }, [sceneManager, world]);

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleMouseClick = (index: number) => {
    console.log('[Menu] Menu item clicked:', index, MENU_ITEMS[index]);
    handleMenuSelect(MENU_ITEMS[index]);
  };

  const isSelected = (index: number) => {
    return hoveredIndex !== null ? hoveredIndex === index : selectedIndex === index;
  };

  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1 className="menu-title">ASTEROIDS</h1>
        
        <ul className="menu-items">
          {MENU_ITEMS.map((item, index) => (
            <li
              key={item}
              className={`menu-item ${isSelected(index) ? 'selected' : ''}`}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => {
                console.log('[Menu] Click event fired on item:', item, 'event:', e);
                handleMouseClick(index);
              }}
            >
              {MENU_LABELS[item]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
