import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type NavSection = 'destinations' | 'dispatches' | 'itinerary' | 'toolkit';

interface HeaderProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onOpenNewTrip: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'destinations', label: 'Destinations' },
  { id: 'dispatches', label: 'Field Guides' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'toolkit', label: 'Budget & Gear' },
];

export function Header({ activeSection, onNavigate, onOpenNewTrip }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (section: NavSection) => {
    onNavigate(section);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E5E2DC]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-editorial text-2xl font-semibold tracking-tight text-[#161615] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] rounded"
        >
          Meridian
        </a>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] ${
                  isActive
                    ? 'text-[#0F4C5C] border-[#0F4C5C]'
                    : 'text-[#575550] border-transparent hover:text-[#161615] hover:border-[#C9C4BA]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenNewTrip}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F4C5C]"
          >
            Plan New Trip
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2.5 text-[#161615] hover:bg-[#EFECE6] rounded-lg transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5E2DC] bg-[#FAF9F6] px-6 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`text-left py-2.5 px-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeSection === item.id
                  ? 'text-[#0F4C5C] bg-[#EFECE6]'
                  : 'text-[#575550] hover:text-[#161615]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
