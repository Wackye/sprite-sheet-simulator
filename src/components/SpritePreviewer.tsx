import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Plus, Globe, Download, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import GIF from 'gif.js';

interface UploadedImage {
    id: string;
    url: string;
    name: string;
    dimensions: { width: number; height: number };
}

export default function SpritePreviewer() {
    const { t, i18n } = useTranslation();
    const [image, setImage] = useState<string | null>(null);
    const [duration, setDuration] = useState(2);
    const [flipHorizontal, setFlipHorizontal] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [columns, setColumns] = useState(4);
    const [rows, setRows] = useState(4);
    const [playbackMode, setPlaybackMode] = useState<'forward' | 'reverse' | 'pingpong'>('forward');

    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
    const [zoomInput, setZoomInput] = useState('100');
    const [isExporting, setIsExporting] = useState(false);
    const [isExportSuccess, setIsExportSuccess] = useState(false);

    // History state
    const [history, setHistory] = useState<UploadedImage[]>([]);
    const [activeImageId, setActiveImageId] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const animationRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalFrames = columns * rows;
    const frameDelay = (duration * 1000) / totalFrames;

    const activeImage = history.find(img => img.id === activeImageId);

    useEffect(() => {
        if (isPlaying && image) {
            const startTime = Date.now();
            const startFrame = currentFrame;

            const animate = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const framesPassed = Math.floor(elapsed / frameDelay);

                let nextFrame = 0;

                if (playbackMode === 'forward') {
                    nextFrame = (startFrame + framesPassed) % totalFrames;
                } else if (playbackMode === 'reverse') {
                    // Reversing logic: start from current, go backwards.
                    // We can model this as: totalFrames - (framesPassed % totalFrames)
                    // But we need to account for startFrame.
                    // Easiest is to subtract framesPassed from startFrame and wrap around.
                    const wrapped = (startFrame - framesPassed) % totalFrames;
                    nextFrame = wrapped >= 0 ? wrapped : totalFrames + wrapped;
                } else if (playbackMode === 'pingpong') {
                    // PingPong: 0 -> totalFrames-1 -> 0
                    // Cycle length is (totalFrames - 1) * 2
                    // Only if totalFrames > 1
                    if (totalFrames > 1) {
                        const cycleLength = (totalFrames - 1) * 2;
                        const cyclePos = (startFrame + framesPassed) % cycleLength;
                        if (cyclePos < totalFrames) {
                            nextFrame = cyclePos;
                        } else {
                            nextFrame = cycleLength - cyclePos;
                        }
                    } else {
                        nextFrame = 0;
                    }

                }

                setCurrentFrame(nextFrame);
                animationRef.current = requestAnimationFrame(animate);
            };

            animationRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }
    }, [isPlaying, image, frameDelay, totalFrames, playbackMode]); // Removed currentFrame from deps to avoid re-triggering loop on every frame set

    useEffect(() => {
        if (image && canvasRef.current && imageRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = imageRef.current;

            if (!ctx) return;

            const frameWidth = img.naturalWidth / columns;
            const frameHeight = img.naturalHeight / rows;

            canvas.width = frameWidth;
            canvas.height = frameHeight;

            const col = currentFrame % columns;
            const row = Math.floor(currentFrame / columns);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (flipHorizontal) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(
                    img,
                    col * frameWidth,
                    row * frameHeight,
                    frameWidth,
                    frameHeight,
                    -frameWidth,
                    0,
                    frameWidth,
                    frameHeight
                );
                ctx.restore();
            } else {
                ctx.drawImage(
                    img,
                    col * frameWidth,
                    row * frameHeight,
                    frameWidth,
                    frameHeight,
                    0,
                    0,
                    frameWidth,
                    frameHeight
                );
            }
        }
    }, [currentFrame, image, flipHorizontal, columns, rows]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                const img = new Image();
                img.onload = () => {
                    const newDimensions = { width: img.naturalWidth, height: img.naturalHeight };
                    const newId = Date.now().toString();

                    const newImageEntry: UploadedImage = {
                        id: newId,
                        url: result,
                        name: file.name,
                        dimensions: newDimensions
                    };

                    setHistory(prev => [newImageEntry, ...prev]);
                    setActiveImageId(newId);

                    // Update current view
                    setImage(result);
                    setImageDimensions(newDimensions);
                    setCurrentFrame(0);
                    setIsPlaying(false);
                };
                img.src = result;
            };
            reader.readAsDataURL(file);
        }
        // Reset file input so same file can be uploaded again if needed (though unlikely in this flow)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSelectImage = (imgEntry: UploadedImage) => {
        if (imgEntry.id === activeImageId) return;

        setActiveImageId(imgEntry.id);
        setImage(imgEntry.url);
        setImageDimensions(imgEntry.dimensions);
        setCurrentFrame(0);
        setIsPlaying(false);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'zh-TW' ? 'en' : 'zh-TW';
        i18n.changeLanguage(newLang);
    };

    const handleExportGif = () => {
        if (!image || !imageRef.current) {
            console.error('Export failed: Image or imageRef missing');
            return;
        }

        console.log('Starting GIF Export', {
            columns,
            rows,
            totalFrames,
            duration,
            playbackMode,
            frameDelay,
            flipHorizontal,
            imageDimensions
        });

        setIsExporting(true);
        const img = imageRef.current;
        const frameWidth = img.naturalWidth / columns;
        const frameHeight = img.naturalHeight / rows;

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: frameWidth,
            height: frameHeight,
            workerScript: `${import.meta.env.BASE_URL}gif.worker.js`,
            background: '#000000', // Background color to be made transparent
            transparent: 0x000000 as any // Make black transparent
        });

        // Create a temporary canvas to draw each frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frameWidth;
        tempCanvas.height = frameHeight;
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
            console.error('Export failed: Could not get 2D context for temp canvas');
            setIsExporting(false);
            return;
        }

        // Generate frame indices based on Playback Mode
        let frameIndices: number[] = [];
        const allFrames = Array.from({ length: totalFrames }, (_, i) => i);

        if (playbackMode === 'forward') {
            frameIndices = allFrames;
        } else if (playbackMode === 'reverse') {
            frameIndices = [...allFrames].reverse();
        } else if (playbackMode === 'pingpong') {
            if (totalFrames > 1) {
                // 0, 1, 2 -> 0, 1, 2, 1
                frameIndices = [...allFrames, ...allFrames.slice(1, -1).reverse()];
            } else {
                frameIndices = allFrames;
            }
        }

        console.log(`Generated ${frameIndices.length} frames for export (Mode: ${playbackMode})`, frameIndices);

        // Add frames to GIF
        frameIndices.forEach((frameIndex, idx) => {
            const col = frameIndex % columns;
            const row = Math.floor(frameIndex / columns);

            try {
                ctx.clearRect(0, 0, frameWidth, frameHeight);

                if (flipHorizontal) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(
                        img,
                        col * frameWidth,
                        row * frameHeight,
                        frameWidth,
                        frameHeight,
                        -frameWidth,
                        0,
                        frameWidth,
                        frameHeight
                    );
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        img,
                        col * frameWidth,
                        row * frameHeight,
                        frameWidth,
                        frameHeight,
                        0,
                        0,
                        frameWidth,
                        frameHeight
                    );
                }

                gif.addFrame(ctx, { copy: true, delay: frameDelay });
            } catch (err) {
                console.error(`Error adding frame ${idx} (source index: ${frameIndex}):`, err);
            }
        });

        gif.on('finished', (blob) => {
            console.log('GIF Finished. Blob size:', blob.size);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeImage?.name.split('.')[0] || 'sprite'}.gif`;
            a.click();
            URL.revokeObjectURL(url);
            setIsExporting(false);
            setIsExportSuccess(true);
            setTimeout(() => setIsExportSuccess(false), 3000);
        });

        gif.render();
        console.log('GIF render started');
    };


    const handleLoadExample = async () => {
        try {
            const response = await fetch(`${import.meta.env.BASE_URL}example.png`);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onload = (event) => {
                const result = event.target?.result as string;
                const img = new Image();
                img.onload = () => {
                    const newDimensions = { width: img.naturalWidth, height: img.naturalHeight };
                    const newId = Date.now().toString();

                    const newImageEntry: UploadedImage = {
                        id: newId,
                        url: result,
                        name: 'example.png',
                        dimensions: newDimensions
                    };

                    setHistory(prev => [newImageEntry, ...prev]);
                    setActiveImageId(newId);

                    // Update current view with presets for example
                    setImage(result);
                    setImageDimensions(newDimensions);
                    setCurrentFrame(0);
                    setIsPlaying(true); // Auto play

                    // Specific settings for example.png
                    setColumns(2);
                    setRows(2);
                    setDuration(1.0);
                    setPlaybackMode('forward');
                };
                img.src = result;
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Failed to load example image', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9F9] flex flex-col font-sans text-[#1F2937]">
            <section className="min-h-screen flex flex-col p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
                <header className="mb-6 flex-none flex justify-center relative items-center">
                    <h1 className="text-3xl font-bold text-[#243179] tracking-tight text-center">
                        {t('app.title')}
                    </h1>
                    <button
                        onClick={toggleLanguage}
                        className="absolute right-0 flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm font-medium text-gray-600 hover:text-[#1957BC] hover:border-blue-100 transition-all active:scale-95"
                    >
                        <Globe size={18} />
                        {i18n.language === 'en' ? '繁體中文' : 'English'}
                    </button>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6">
                    {/* Left Column: Upload and Preview (70%) */}
                    <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">

                        {/* Hidden Input for programmatic access */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        {/* If no history, show large upload area. Else show Preview + Content List */}
                        {history.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-all duration-500 ease-spring min-h-[400px]">
                                <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1957BC] hover:bg-blue-50/50 transition-all group">
                                    <div className="flex flex-col items-center gap-4 p-4">
                                        <div className="p-4 rounded-full bg-gray-50 group-hover:bg-[#1957BC]/10 transition-colors scale-125">
                                            <Upload className="text-gray-600 group-hover:text-[#1957BC] transition-colors" size={40} />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-base font-semibold text-gray-700 group-hover:text-[#1957BC] transition-colors">
                                                {t('app.upload_prompt')}
                                            </span>
                                            <small className="text-xs text-gray-600">{t('app.upload_subtext')}</small>
                                            <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs z-10">
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="h-px bg-gray-200 flex-1"></div>
                                                    <span className="text-gray-400 text-sm font-medium">{t('app.or', 'or')}</span>
                                                    <div className="h-px bg-gray-200 flex-1"></div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleLoadExample();
                                                    }}
                                                    className="w-full py-2.5 px-4 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:text-[#1957BC] hover:border-[#1957BC] transition-all hover:shadow-sm active:scale-95 flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <div className="p-1 bg-gray-100 rounded-md group-hover/btn:bg-blue-50 transition-colors">
                                                        <Upload size={14} className="text-gray-500 group-hover/btn:text-[#1957BC]" />
                                                    </div>
                                                    {t('app.load_example', 'Load Example')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col animate-fade-in-up overflow-hidden">
                                {/* Preview Section */}
                                <div className="p-6 flex flex-col gap-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h2 className="text-xl font-bold text-[#243179]">{t('app.preview')}</h2>
                                        <div className="flex items-center gap-3">
                                            <div className="relative group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="text"
                                                        value={zoomInput}
                                                        onChange={(e) => {
                                                            setZoomInput(e.target.value);
                                                        }}
                                                        onBlur={() => {
                                                            let val = parseInt(zoomInput);
                                                            if (isNaN(val)) val = 100;
                                                            val = Math.max(10, Math.min(500, val));
                                                            setZoomLevel(val);
                                                            setZoomInput(val.toString());
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.currentTarget.blur();
                                                            }
                                                        }}
                                                        onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                                                        className="w-20 pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-[#1957BC]/20 focus:border-[#1957BC]"
                                                    />
                                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">%</span>
                                                    <ChevronDown
                                                        size={14}
                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${isZoomMenuOpen ? 'rotate-180' : ''}`}
                                                    />
                                                </div>

                                                {isZoomMenuOpen && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setIsZoomMenuOpen(false)}
                                                        ></div>
                                                        <div className="absolute right-0 top-full mt-2 w-24 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 flex flex-col overflow-hidden animate-fade-in-up">
                                                            {[50, 75, 100, 125, 150, 200].map((zoom) => (
                                                                <button
                                                                    key={zoom}
                                                                    onClick={() => {
                                                                        setZoomLevel(zoom);
                                                                        setZoomInput(zoom.toString());
                                                                        setIsZoomMenuOpen(false);
                                                                    }}
                                                                    className={`w-full px-4 py-2 text-sm font-medium text-left hover:bg-gray-50 transition-colors ${zoomLevel === zoom ? 'text-[#1957BC] bg-blue-50/50' : 'text-gray-700'
                                                                        }`}
                                                                >
                                                                    {zoom}%
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600">
                                                {t('app.frame_label')} {currentFrame + 1} / {totalFrames}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Canvas Area */}
                                    {/* Canvas Area */}
                                    <div
                                        className="relative bg-[#F1F5F9] rounded-xl overflow-auto custom-scrollbar cursor-pointer group select-none flex items-center justify-center border border-gray-100/50 min-h-[300px] lg:min-h-[400px]"
                                        onClick={togglePlayPause}
                                    >
                                        {/* Pattern Background */}
                                        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC44dhoLrQAAAB1JREFUOE9jTKs9/5+BgYHx////DAwMTH///gMAgV0GAf/PzukAAAAASUVORK5CYII=')] bg-repeat"></div>

                                        <canvas
                                            ref={canvasRef}
                                            className="relative object-contain drop-shadow-xl transition-[width,height] duration-200 ease-out"
                                            style={{
                                                imageRendering: 'pixelated',
                                                width: imageDimensions ? `${(imageDimensions.width / columns) * (zoomLevel / 100)}px` : undefined,
                                                height: imageDimensions ? `${(imageDimensions.height / rows) * (zoomLevel / 100)}px` : undefined
                                            }}
                                        />

                                        {/* Play Overlay */}
                                        {!isPlaying && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <div className="bg-white p-6 rounded-full shadow-2xl transform transition-transform scale-100 ring-4 ring-white/30">
                                                    <Play size={40} className="text-[#243179] ml-1" fill="currentColor" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Bar with Filename */}
                                    <div className="text-center">
                                        {imageDimensions ? (
                                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                                                {activeImage && (
                                                    <>
                                                        <span className="font-medium text-gray-900">{activeImage.name}</span>
                                                        <span className="text-gray-300">|</span>
                                                    </>
                                                )}
                                                <span className="font-medium">{t('app.original_size')}</span>
                                                <span>{imageDimensions.width}x{imageDimensions.height}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-medium">{t('app.single_frame')}</span>
                                                <span>{Math.round(imageDimensions.width / columns)}x{Math.round(imageDimensions.height / rows)}</span>
                                            </div>
                                        ) : '-'}
                                    </div>

                                    <img
                                        ref={imageRef}
                                        src={image || ''}
                                        alt="sprite sheet"
                                        className="hidden"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gray-100 w-full"></div>

                                {/* Content List (History) */}
                                <div className="p-6 bg-gray-50/30">
                                    <div className="h-24 flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                                        {/* Upload Button in List */}
                                        <button
                                            onClick={triggerUpload}
                                            className="h-full aspect-square flex flex-col items-center justify-center gap-1 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#1957BC] hover:text-[#1957BC] hover:bg-blue-50/50 transition-all flex-none"
                                            title="Upload new image"
                                        >
                                            <Plus size={24} />
                                            <span className="text-xs font-bold">{t('app.upload_button')}</span>
                                        </button>

                                        {/* History Items */}
                                        {history.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectImage(item)}
                                                className={`h-full aspect-[4/3] relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group flex-none bg-white ${activeImageId === item.id
                                                    ? 'border-[#1957BC] ring-2 ring-[#1957BC]/20'
                                                    : 'border-transparent hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="w-full h-full p-2 flex flex-col items-center justify-center">
                                                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={item.url}
                                                            alt={item.name}
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                    <div className="w-full text-center mt-1">
                                                        <p className="text-[10px] text-gray-600 font-medium truncate w-full px-1">
                                                            {item.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Controls (30%) */}
                    <div className={`col-span-1 lg:col-span-3 flex flex-col h-full ${!image ? 'opacity-50 pointer-events-none grayscale-[0.8] blur-[1px] transition-all duration-500' : 'transition-all duration-500'}`}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden sticky top-6">
                            <div className="p-4 border-b border-gray-100 flex-none bg-gray-50/30">
                                <h2 className="text-lg font-bold text-[#243179]">{t('app.settings')}</h2>
                            </div>

                            <div className="p-4 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('app.columns')}
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={columns}
                                            onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                                            disabled={!image}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1957BC] focus:border-transparent focus:bg-white transition-all text-gray-800 font-bold text-lg text-center"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('app.rows')}
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={rows}
                                            onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                                            disabled={!image}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1957BC] focus:border-transparent focus:bg-white transition-all text-gray-800 font-bold text-lg text-center"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('app.animation_duration')}</span>
                                        <div className="flex justify-between items-center">
                                            <div className="text-xs text-[#1957BC] font-medium bg-blue-50 px-2 py-1 rounded-md">
                                                1 Frame ≈ {Math.round((duration * 1000) / totalFrames)} ms
                                            </div>
                                            <div className="text-2xl font-bold text-[#243179] font-mono leading-none tracking-tight">
                                                {duration.toFixed(2)}
                                                <span className="text-sm text-gray-600 ml-1 font-sans font-normal">{t('app.seconds')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="5"
                                            step="0.1"
                                            value={duration}
                                            onChange={(e) => setDuration(parseFloat(e.target.value))}
                                            disabled={!image}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#243179] hover:accent-[#1957BC] transition-colors"
                                        />
                                        <div className="flex justify-between text-xs text-gray-600 font-medium mt-2">
                                            <span>0.1 s</span>
                                            <span>5.0 s</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('app.playback_mode')}</span>
                                    <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-xl">
                                        {(['forward', 'reverse', 'pingpong'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setPlaybackMode(mode)}
                                                disabled={!image}
                                                title={t(`app.mode_${mode}`)}
                                                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all text-center flex items-center justify-center ${playbackMode === mode
                                                    ? 'bg-white text-[#1957BC] shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                                    }`}
                                            >
                                                {mode === 'forward' && '→'}
                                                {mode === 'reverse' && '←'}
                                                {mode === 'pingpong' && '↔'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-center text-xs font-medium text-gray-500 mt-1">
                                        {t(`app.mode_${playbackMode}`)}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-[#243179] transition-colors">{t('app.flip_horizontal')}</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={flipHorizontal}
                                                onChange={(e) => setFlipHorizontal(e.target.checked)}
                                                disabled={!image}
                                                className="hidden"
                                            />
                                            <div className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 ease-in-out ${flipHorizontal ? 'bg-[#1957BC]' : 'bg-gray-300'}`}>
                                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${flipHorizontal ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex-none mt-auto">
                                <button
                                    onClick={togglePlayPause}
                                    disabled={!image}
                                    className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-white font-bold text-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-[0.98] ${isPlaying
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : 'bg-[#243179] hover:bg-[#1e2a69]'
                                        } disabled:bg-gray-300 disabled:shadow-none disabled:transform-none disabled:translate-y-0 disabled:cursor-not-allowed`}
                                >
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    {isPlaying ? t('app.pause') : t('app.play')}
                                </button>

                                <button
                                    onClick={handleExportGif}
                                    disabled={!image || isExporting}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 mt-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-lg hover:bg-gray-50 hover:border-gray-300 hover:text-[#243179] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                >
                                    <Download size={20} />
                                    {isExporting ? t('app.exporting') : t('app.save_gif')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Success Popup */}
            {isExportSuccess && (
                <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
                    <div className="bg-white rounded-xl shadow-xl border border-green-100 p-4 flex items-center gap-3 pr-8">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                            <Check size={20} className="stroke-[3px]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">{t('app.export_success')}</h4>
                            <p className="text-sm text-gray-500">{t('app.download_started')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
