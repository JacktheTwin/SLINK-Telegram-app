import { BrandMark } from "@/components/brand-mark";

export default function HomeLoading() {
  return (
    <main className="telegram-safe-page app-shell" aria-label="Caricamento prodotti">
      <div className="app-topbar">
        <BrandMark linked={false} />
        <div className="skeleton h-11 w-11 rounded-full" />
      </div>
      <div className="skeleton mt-4 h-48 rounded-[1.75rem] sm:h-56" />
      <div className="mt-7 flex items-center justify-between">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="skeleton h-3 w-16 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item}>
            <div className="skeleton aspect-[4/5] rounded-[1.25rem]" />
            <div className="skeleton mt-3 h-4 w-4/5 rounded-full" />
            <div className="skeleton mt-2 h-3 w-2/5 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
