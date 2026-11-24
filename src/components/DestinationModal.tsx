import { useEffect } from 'react';
import { Bookmark, Check, MapPin, Train, X } from 'lucide-react';
import { Destination } from '../types/travel';
import { ResilientImage } from './ResilientImage';

interface DestinationModalProps {
  destination: Destination | null;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onClose: () => void;
  onLoadIntoPlanner: (destination: Destination) => void;
}

export function DestinationModal({
  destination,
  isSaved,
  onToggleSave,
  onClose,
  onLoadIntoPlanner,
}: DestinationModalProps) {
  useEffect(() => {
    if (!destination) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [destination, onClose]);

  if (!destination) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dest-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF9F6] border border-[#DFDBD2] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#EAE6DF]">
          <ResilientImage
            src={destination.imageUrl}
            alt={destination.imageAlt}
            fallbackTitle={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close destination guide"
            className="absolute top-4 right-4 p-2 rounded-lg bg-black/55 text-white hover:bg-black/75 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6 text-white">
            <p className="text-xs tracking-wide text-white/85 mb-1.5">
              {destination.country} <span aria-hidden="true">·</span> {destination.kicker}
            </p>
            <h2 id="dest-modal-title" className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight">
              {destination.name}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-7">
          {/* Unboxed Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E5E2DC] text-xs sm:text-sm text-[#575550]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-xs tabular-nums text-[#161615] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F4C5C]" />
                {destination.coordinates}
              </span>
              <span aria-hidden="true">·</span>
              <span>Best in {destination.bestSeasons.join(' & ')}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{destination.idealDays} days ideal</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-xs tabular-nums text-[#161615]">
                ~${destination.dailyEstimateUsd}/day
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleSave(destination.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSaved
                  ? 'bg-[#0F4C5C]/10 border-[#0F4C5C]/30 text-[#0F4C5C]'
                  : 'bg-white border-[#DFDBD2] text-[#3F3E3B] hover:border-[#161615]'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {isSaved ? 'Saved to Atlas' : 'Save Destination'}
            </button>
          </div>

          {/* Field Notes & Transit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-semibold text-[#161615]">Editorial Field Notes</h3>
              <p className="text-[15px] leading-relaxed text-[#3F3E3B]">{destination.editorialNote}</p>
            </div>

            <div className="bg-[#F2F0EC] border border-[#E5E2DC] rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#161615]">
                <Train className="w-4 h-4 text-[#0F4C5C]" />
                <span>Arrival & Transit</span>
              </div>
              <p className="text-xs leading-relaxed text-[#575550]">{destination.transitTip}</p>
            </div>
          </div>

          {/* Curated Stays */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#161615]">Recommended Stays</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {destination.recommendedStays.map((stay) => (
                <div
                  key={stay.name}
                  className="bg-white border border-[#E5E2DC] rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-[#161615]">{stay.name}</p>
                    <p className="text-xs text-[#575550] mt-0.5">{stay.area}</p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#161615] shrink-0">
                    {stay.nightlyRate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Route Preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#161615]">
              Included Route Outline ({destination.sampleDays.length} Days)
            </h3>
            <div className="divide-y divide-[#E5E2DC] border border-[#E5E2DC] rounded-lg bg-white">
              {destination.sampleDays.map((day) => (
                <div key={day.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-[#0F4C5C] mr-2">Day 0{day.dayNumber}</span>
                    <span className="text-sm font-medium text-[#161615]">{day.title}</span>
                  </div>
                  <span className="text-xs text-[#575550] tabular-nums">
                    {day.stops.length} curated stops
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-[#E5E2DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[#3F3E3B] hover:text-[#161615] transition-colors cursor-pointer"
            >
              Close Guide
            </button>
            <button
              type="button"
              onClick={() => onLoadIntoPlanner(destination)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Load Route into Trip Planner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
