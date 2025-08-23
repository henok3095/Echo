import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, cropPixels, outputSize = 512, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas to output size (square)
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Calculate scale to map crop area to output size
  const scaleX = outputSize / cropPixels.width;
  const scaleY = outputSize / cropPixels.height;

  // Optional rotation
  if (rotation) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // Draw the cropped area scaled into the canvas
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}

export default function AvatarCropModal({
  src,
  onCancel,
  onConfirm,
  aspect = 1,
  outputSize = 512,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef(null);
  const doneRef = useRef(null);

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!src || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImg(src, croppedAreaPixels, outputSize, 0);
      onConfirm?.(blob);
    } finally {
      setBusy(false);
    }
  }, [src, croppedAreaPixels, outputSize, onConfirm]);

  // Focus management and keyboard support
  useEffect(() => {
    // Focus the Done button when modal opens
    doneRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        onCancel?.();
        return;
      }
      if (e.key === 'Tab') {
        // Simple focus trap among focusable elements inside panel
        const container = panelRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Crop avatar">
      {/* Dark full-screen backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={!busy ? onCancel : undefined} />

      {/* Crop area fills screen, round mask like Telegram */}
      <div className="absolute inset-0 flex flex-col" ref={panelRef}>
        <div className="relative flex-1">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="round"
            showGrid={false}
            restrictPosition
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            classes={{ containerClassName: 'bg-black', mediaClassName: 'select-none' }}
            zoomWithScroll
          />

          {/* Corner guides to suggest draggable/resize feel (visual only) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: '62vmin', height: '62vmin' }}>
              {/* top-left */}
              <div className="absolute -top-4 -left-4 w-3 h-3 bg-white/90 rounded-sm shadow" />
              {/* top-right */}
              <div className="absolute -top-4 -right-4 w-3 h-3 bg-white/90 rounded-sm shadow" />
              {/* bottom-left */}
              <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-white/90 rounded-sm shadow" />
              {/* bottom-right */}
              <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-white/90 rounded-sm shadow" />
            </div>
          </div>
        </div>

        {/* Bottom controls: actions only. Zoom via pinch/scroll; drag to move. */}
        <div className="relative px-4 pt-3 pb-6 bg-gradient-to-t from-black/80 to-black/20">
          <p className="text-center text-xs text-white/70 mb-3 select-none">
            Drag to move. Pinch or scroll to resize.
          </p>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2 text-sm rounded-full text-white/90 hover:text-white disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className="px-4 py-2 text-sm rounded-full bg-white text-gray-900 font-medium hover:opacity-90 disabled:opacity-60"
              ref={doneRef}
            >
              {busy ? 'Processing…' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
