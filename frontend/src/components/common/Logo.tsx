

const Logo = () => {
    return (
        <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm group-hover:shadow-orange-200 transition-all duration-300">
                {/* 本と医療の十字を組み合わせたモダンなアイコン */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21V3M12 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H12M12 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H12" stroke="#FF9800" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12 8V16" stroke="#FF9800" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex flex-col leading-tight">
                <span className="text-xl font-black tracking-tight text-white">Medical Wiki</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-orange-200/80 uppercase">LMS Network</span>
            </div>
        </div>
    );
};

export default Logo;
