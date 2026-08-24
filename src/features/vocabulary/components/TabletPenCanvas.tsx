'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  Highlighter,
  Eraser,
  RotateCcw,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TabletPenCanvasProps {
  id?: string;
  initialDataUrl?: string;
  onChange?: (dataUrl: string) => void;
  height?: number;
  placeholderText?: string;
  className?: string;
}

type PenMode = 'pen' | 'highlighter' | 'eraser';

export function TabletPenCanvas({
  id,
  initialDataUrl,
  onChange,
  height = 120,
  placeholderText = '애플펜슬이나 손으로 직접 한국어 해석이나 메모를 적어보세요...',
  className = '',
}: TabletPenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<PenMode>('pen');
  const [penColor, setPenColor] = useState<string>('#2563eb'); // 기본 블루
  const [penSize, setPenSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // 캔버스 크기 및 초기화
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const width = parent.clientWidth || 600;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (initialDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          setHasDrawn(true);
        };
        img.src = initialDataUrl;
      }
    }
  }, [height, initialDataUrl]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      // 윈도우 리사이즈 처리
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev.slice(-10), imgData]);
    } catch {}
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    saveHistory();
    setIsDrawing(true);
    setHasDrawn(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (mode === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.globalAlpha = 1.0;
    } else if (mode === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor === '#2563eb' ? '#facc15' : penColor;
      ctx.lineWidth = penSize * 4.5;
      ctx.globalAlpha = 0.35;
    } else if (mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penSize * 6;
      ctx.globalAlpha = 1.0;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}

    setIsDrawing(false);
    if (onChange) {
      onChange(canvas.toDataURL());
    }
  };

  // 실행 취소 (Undo)
  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const last = history[history.length - 1];
    ctx.putImageData(last, 0, 0);
    setHistory((prev) => prev.slice(0, -1));

    if (onChange) {
      onChange(canvas.toDataURL());
    }
  };

  // 전체 지우기
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);

    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`relative rounded-xl border border-primary/25 bg-background/80 overflow-hidden shadow-xs ${className}`}>
      {/* 태블릿 펜슬 툴바 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border text-xs flex-wrap gap-1">
        <div className="flex items-center gap-1">
          {/* 펜 모드 */}
          <Button
            type="button"
            size="sm"
            variant={mode === 'pen' ? 'default' : 'ghost'}
            className="h-7 px-2.5 gap-1 text-xs"
            onClick={() => setMode('pen')}
          >
            <PenTool className="h-3.5 w-3.5" />
            펜
          </Button>

          {/* 형광펜 모드 */}
          <Button
            type="button"
            size="sm"
            variant={mode === 'highlighter' ? 'default' : 'ghost'}
            className="h-7 px-2.5 gap-1 text-xs"
            onClick={() => {
              setMode('highlighter');
              setPenColor('#facc15');
            }}
          >
            <Highlighter className="h-3.5 w-3.5" />
            형광펜
          </Button>

          {/* 지우개 모드 */}
          <Button
            type="button"
            size="sm"
            variant={mode === 'eraser' ? 'default' : 'ghost'}
            className="h-7 px-2.5 gap-1 text-xs"
            onClick={() => setMode('eraser')}
          >
            <Eraser className="h-3.5 w-3.5" />
            지우개
          </Button>

          {/* 색상 팔레트 (펜/형광펜 모드 시) */}
          {mode !== 'eraser' && (
            <div className="flex items-center gap-1.5 ml-1.5 pl-1.5 border-l border-border">
              {[
                { color: '#2563eb', label: '블루' },
                { color: '#1e293b', label: '블랙' },
                { color: '#ef4444', label: '레드' },
                { color: '#facc15', label: '노랑' },
                { color: '#22c55e', label: '초록' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  aria-label={c.label}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    penColor === c.color ? 'scale-125 ring-2 ring-primary ring-offset-1' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  onClick={() => setPenColor(c.color)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 굵기 조절 및 컨트롤 */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setPenSize((s) => Math.max(1.5, s - 1))}
            title="굵기 감소"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-4 text-center font-mono">{penSize}</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setPenSize((s) => Math.min(8, s + 1))}
            title="굵기 증가"
          >
            <Plus className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="되돌리기"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={handleClear}
            title="전체 지우기"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 필기 캔버스 영역 */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 text-center">
            <span className="text-xs text-muted-foreground/50 select-none font-sans">
              ✍️ {placeholderText}
            </span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          id={id}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
}
