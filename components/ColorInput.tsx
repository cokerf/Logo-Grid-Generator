import React, { useState, useEffect, useCallback } from 'react';

interface ColorInputProps {
  value: string;
  onChange: (newValue: string) => void;
}

const hexToAlphaPercent = (hex: string): number => {
  return Math.round((parseInt(hex, 16) / 255) * 100);
};

const alphaPercentToHex = (percent: number): string => {
  return Math.round((percent / 100) * 255).toString(16).padStart(2, '0');
};

const checkerboardBg = 'url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI2VjZWZlZiIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlY2VjZWYiLz48L3N2Zz4=\')';

export const ColorInput: React.FC<ColorInputProps> = ({ value, onChange }) => {
  const [hexColor, setHexColor] = useState('#000000');
  const [alpha, setAlpha] = useState(100);
  const [textValue, setTextValue] = useState('#000000');

  useEffect(() => {
    const validHex = /^#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?$/.exec(value);
    if (validHex) {
      const color = `#${validHex[1]}`;
      const alphaHex = validHex[2] || 'FF';
      setHexColor(color);
      setTextValue(color.toUpperCase());
      setAlpha(hexToAlphaPercent(alphaHex));
    }
  }, [value]);

  const triggerChange = useCallback((hex: string, newAlpha: number) => {
    onChange(`${hex.toLowerCase()}${alphaPercentToHex(newAlpha)}`);
  }, [onChange]);

  const handleHexChange = useCallback((newHex: string) => {
    setHexColor(newHex);
    setTextValue(newHex.toUpperCase());
    triggerChange(newHex, alpha);
  }, [alpha, triggerChange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setTextValue(newText.toUpperCase());
    if (/^#[0-9a-fA-F]{6}$/.test(newText)) {
      setHexColor(newText);
      triggerChange(newText, alpha);
    }
  };

  const handleAlphaChange = useCallback((newAlpha: number) => {
    setAlpha(newAlpha);
    triggerChange(hexColor, newAlpha);
  }, [hexColor, triggerChange]);

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative w-8 h-8 rounded shrink-0">
        <div className="absolute inset-0 rounded border border-gray-300" style={{ backgroundImage: checkerboardBg, backgroundSize: '8px 8px' }}></div>
        <div className="absolute inset-0 rounded border border-gray-300" style={{ backgroundColor: value }}></div>
        <input
          type="color"
          value={hexColor}
          onChange={(e) => handleHexChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Color Picker"
        />
      </div>
      <input
        type="text"
        value={textValue}
        onChange={handleTextChange}
        onBlur={() => setTextValue(hexColor.toUpperCase())} // Revert if invalid
        className="w-20 bg-gray-200 p-1 rounded text-xs font-mono"
        aria-label="Hex Color Code"
        maxLength={7}
      />
      <div className="flex-1 flex items-center gap-1">
        <input
          type="range"
          min="0"
          max="100"
          value={alpha}
          onChange={(e) => handleAlphaChange(parseInt(e.target.value, 10))}
          className="flex-1"
          aria-label="Opacity"
        />
        <span className="text-xs text-gray-500 w-8 text-right">{alpha}%</span>
      </div>
    </div>
  );
};
