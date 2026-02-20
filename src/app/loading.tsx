export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="relative w-24 h-24">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary font-bold text-xs uppercase tracking-widest">
                    Cargando
                </div>
            </div>
        </div>
    );
}
