

const Logo = () => {
    return (
        <div className="flex items-center gap-3 group cursor-pointer">
            {/* 視認性の高いアイコンコンテナ */}
            <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center shadow-md shadow-black/20 group-hover:scale-105 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            </div>
            <div className="flex flex-col leading-tight">
                <span className="text-xl font-black tracking-tight text-white leading-none">
                    Medical <span className="text-orange-400">Wiki</span>
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-orange-200/60 uppercase mt-0.5">
                    LMS NETWORK
                </span>
            </div>
        </div>
    );
};

export default Logo;
