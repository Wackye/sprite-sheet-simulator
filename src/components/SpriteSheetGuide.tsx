import React from 'react';
import { Clock, Zap, Layers, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

const SpriteSheetGuide = () => {
    return (
        <section className="bg-white py-24 px-6 lg:px-12 border-t border-gray-100">
            <div className="max-w-[1600px] mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#3B82F6] font-bold tracking-wider uppercase text-sm mb-2 block">Premium Guide</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-[#243179] mb-6 tracking-tight">
                        Sprite Sheet (Sequence Sheet) 動畫規格指南
                    </h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        在進行 2D 遊戲開發或網頁動效設計時，Sprite Sheet（精靈圖，或稱 Sequence Sheet）的格數與播放速度直接影響了視覺的流暢度與效能平衡。
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* 1. Frame Count Section */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden group h-full">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#3B82F6] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                    <Layers className="text-[#3B82F6]" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#243179]">1. 建議動作格數</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        建議使用 <span className="font-semibold text-[#3B82F6]">2 或 4 的倍數</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col divide-y divide-gray-100">
                            {[
                                { title: "待機 (Idle)", frames: "4 ~ 8 格", desc: "輕微的呼吸起伏或上下漂浮。", icon: <Clock size={20} /> },
                                { title: "走路 (Walk)", frames: "6 ~ 12 格", desc: "表現完整的邁步與重心轉移。", icon: <CheckCircle size={20} /> },
                                { title: "跑步 (Run)", frames: "6 ~ 8 格", desc: "較快的循環，格數少能營造速度感。", icon: <Zap size={20} /> },
                                { title: "攻擊 (Attack)", frames: "10 ~ 20+ 格", desc: "包含蓄力、揮擊與收招的細節。", icon: <AlertCircle size={20} /> },
                                { title: "特效 (FX)", frames: "12 ~ 24 格", desc: "爆炸、煙霧或閃光，需較多格數以確保平滑。", icon: <Layers size={20} /> },
                            ].map((item, idx) => (
                                <div key={idx} className="p-7 hover:bg-blue-50/30 transition-colors group/item flex gap-5 items-start">
                                    <div className="mt-1 text-gray-400 group-hover/item:text-[#3B82F6] transition-colors shrink-0">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h4 className="text-base font-semibold text-[#343435]">{item.title}</h4>
                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">{item.frames}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. FPS Section */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden group h-full">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#3B82F6] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                    <Clock className="text-[#3B82F6]" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#243179]">2. 播放速度 (FPS)</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        決定動畫的「節奏感」與「風格」
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col divide-y divide-gray-100">
                            {[
                                { fps: "8 ~ 12 FPS", type: "復古風格", desc: "具有強烈的跳格感，適合經典像素風。", color: "text-amber-500", bg: "bg-amber-50" },
                                { fps: "24 FPS", type: "電影標準", desc: "視覺感受最為自然，是大多數手繪動畫的選擇。", color: "text-emerald-600", bg: "bg-emerald-50" },
                                { fps: "30 FPS", type: "遊戲標準", desc: "提供極為流暢的視覺體驗，適合動作節奏明快。", color: "text-[#3B82F6]", bg: "bg-blue-50" },
                            ].map((item, idx) => (
                                <div key={idx} className="p-7 hover:bg-gray-50 transition-colors group/item relative overflow-hidden">
                                    <div className="flex items-baseline justify-between mb-3">
                                        <div className={`font-mono text-2xl font-bold ${item.color} tracking-tight`}>{item.fps}</div>
                                        <div className="font-semibold text-[#343435] text-base">
                                            {item.type}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed relative z-10">
                                        {item.desc}
                                    </p>
                                    <div className={`absolute top-0 right-0 w-20 h-20 ${item.bg} rounded-bl-full opacity-0 group-hover/item:opacity-50 transition-opacity duration-300 transform translate-x-4 -translate-y-4`}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Production Guidelines */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden group h-full">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#3B82F6] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                    <ImageIcon className="text-[#3B82F6]" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#243179]">3. 製作與優化</h3>
                                    <p className="text-gray-500 text-sm mt-1">確保動畫在任何裝置上的完美呈現</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col divide-y divide-gray-100">
                            {[
                                { title: "等寬設計", subtitle: "Equal Sizing", desc: "每格寬高必須一致。例：1024x1024 切 16 格，每格 256x256。" },
                                { title: "關鍵影優先", subtitle: "Keyframes First", desc: "優先畫出動作起點、最高點與擊中點，再補中間格。" },
                                { title: "循環無縫化", subtitle: "Looping", desc: "確保最後一格能流暢銜接回第一格，避免卡頓。" },
                                { title: "透明邊距", subtitle: "Padding", desc: "在角色邊緣預留 1~2px 空白，防止溢色或破圖。" }
                            ].map((item, idx) => (
                                <div key={idx} className="p-7 hover:bg-blue-50/30 transition-colors group/item relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full transform translate-x-6 -translate-y-6 group-hover/item:translate-x-2 group-hover/item:-translate-y-2 transition-transform duration-500"></div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="text-base font-semibold text-[#343435] group-hover/item:text-[#3B82F6] transition-colors">{item.title}</h4>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover/item:text-blue-300 transition-colors">{item.subtitle}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed pt-1">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SpriteSheetGuide;
