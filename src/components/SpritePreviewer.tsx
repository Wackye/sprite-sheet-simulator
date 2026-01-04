import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Plus } from 'lucide-react';
import SpriteSheetGuide from './SpriteSheetGuide';

interface UploadedImage {
    id: string;
    url: string;
    name: string;
    dimensions: { width: number; height: number };
}

export default function SpritePreviewer() {
    const [image, setImage] = useState<string | null>(null);
    const [duration, setDuration] = useState(2);
    const [flipHorizontal, setFlipHorizontal] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [columns, setColumns] = useState(4);
    const [rows, setRows] = useState(4);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

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
            const startTime = Date.now() - currentFrame * frameDelay;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const frame = Math.floor(elapsed / frameDelay) % totalFrames;
                setCurrentFrame(frame);
                animationRef.current = requestAnimationFrame(animate);
            };

            animationRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }
    }, [isPlaying, image, frameDelay, totalFrames]);

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

    return (
        <div className="min-h-screen bg-[#F8F9F9] flex flex-col font-sans text-[#1F2937]">
            <section className="min-h-screen flex flex-col p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
                <header className="mb-6 flex-none flex justify-center">
                    <h1 className="text-3xl font-bold text-[#243179] tracking-tight text-center">
                        Sprite Sheet (Sequence Sheet) 動畫預覽器
                    </h1>
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
                                <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#3B82F6] hover:bg-blue-50/50 transition-all group">
                                    <div className="flex flex-col items-center gap-4 p-4">
                                        <div className="p-4 rounded-full bg-gray-50 group-hover:bg-[#3B82F6]/10 transition-colors scale-125">
                                            <Upload className="text-gray-400 group-hover:text-[#3B82F6] transition-colors" size={40} />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-base font-semibold text-gray-700 group-hover:text-[#3B82F6] transition-colors">
                                                點擊上傳或拖曳 Sprite Sheet (Sequence Sheet)
                                            </span>
                                            <span className="text-sm text-gray-400 mt-1">支援 PNG, JPG</span>
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
                                        <h2 className="text-xl font-bold text-[#243179]">預覽</h2>
                                        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600">
                                            FRAME: {currentFrame + 1} / {totalFrames}
                                        </div>
                                    </div>

                                    {/* Canvas Area */}
                                    <div
                                        className="relative bg-[#F1F5F9] rounded-xl overflow-hidden cursor-pointer group select-none flex items-center justify-center border border-gray-100/50 min-h-[300px] lg:min-h-[400px]"
                                        onClick={togglePlayPause}
                                    >
                                        {/* Pattern Background */}
                                        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC44dhoLrQAAAB1JREFUOE9jTKs9/5+BgYHx////DAwMTH///gMAgV0GAf/PzukAAAAASUVORK5CYII=')] bg-repeat"></div>

                                        <canvas
                                            ref={canvasRef}
                                            className="relative max-w-full max-h-full object-contain drop-shadow-xl"
                                            style={{ imageRendering: 'pixelated' }}
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
                                                <span className="font-medium">原始尺寸:</span>
                                                <span>{imageDimensions.width}x{imageDimensions.height}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-medium">單格:</span>
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
                                            className="h-full aspect-square flex flex-col items-center justify-center gap-1 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#3B82F6] hover:text-[#3B82F6] hover:bg-blue-50/50 transition-all flex-none"
                                            title="Upload new image"
                                        >
                                            <Plus size={24} />
                                            <span className="text-xs font-bold">Upload</span>
                                        </button>

                                        {/* History Items */}
                                        {history.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectImage(item)}
                                                className={`h-full aspect-[4/3] relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group flex-none bg-white ${activeImageId === item.id
                                                    ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20'
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
                            <div className="p-6 border-b border-gray-100 flex-none bg-gray-50/30">
                                <h2 className="text-lg font-bold text-[#243179]">參數設定</h2>
                            </div>

                            <div className="p-6 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            列數 (Columns)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={columns}
                                            onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                                            disabled={!image}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent focus:bg-white transition-all text-gray-800 font-bold text-lg text-center"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            行數 (Rows)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={rows}
                                            onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                                            disabled={!image}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent focus:bg-white transition-all text-gray-800 font-bold text-lg text-center"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">動畫週期</span>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-[#243179] font-mono leading-none tracking-tight">
                                                {duration}
                                                <span className="text-sm text-gray-400 ml-1 font-sans font-normal">秒</span>
                                            </div>
                                            <div className="text-xs text-[#3B82F6] font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                                                1 Frame ≈ {Math.round((duration * 1000) / totalFrames)} ms
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
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#243179] hover:accent-[#3B82F6] transition-colors"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
                                            <span>0.1 s</span>
                                            <span>5.0 s</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-[#243179] transition-colors">水平翻轉預覽</span>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={flipHorizontal}
                                                onChange={(e) => setFlipHorizontal(e.target.checked)}
                                                disabled={!image}
                                                className="hidden"
                                            />
                                            <div className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 ease-in-out ${flipHorizontal ? 'bg-[#3B82F6]' : 'bg-gray-300'}`}>
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
                                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-[0.98] ${isPlaying
                                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200/50'
                                        : 'bg-[#243179] hover:bg-[#1e2a69] shadow-blue-900/20'
                                        } disabled:bg-gray-300 disabled:shadow-none disabled:transform-none disabled:translate-y-0 disabled:cursor-not-allowed`}
                                >
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    {isPlaying ? '暫停播放' : '開始播放'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <SpriteSheetGuide />

            <footer className="w-full py-6 text-center text-sm text-gray-400 bg-white border-t border-gray-100">
                <p>
                    Made by{' '}
                    <a
                        href="https://goldentseng.com/about/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3B82F6] hover:text-[#243179] transition-colors underline decoration-blue-200 hover:decoration-[#243179] underline-offset-2"
                    >
                        Golden
                    </a>
                </p>
            </footer>
        </div>
    );
}
