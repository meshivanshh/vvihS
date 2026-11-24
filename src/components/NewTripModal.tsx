import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DESTINATIONS } from '../data/destinations';
import { ClimatePreset } from '../types/travel';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (payload: {
    title: string;
    destinationName: string;
    country: string;
    startDate: string;
    endDate: string;
    travelers: number;
    budgetCap: number;
    climate: ClimatePreset;
    templateDestinationId?: string;
  }) => void;
}

export function NewTripModal({ isOpen, onClose, onCreateTrip }: NewTripModalProps) {
  const [title, setTitle] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('2026-10-10');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [travelers, setTravelers] = useState(2);
  const [budgetCap, setBudgetCap] = useState(2400);
  const [climate, setClimate] = useState<ClimatePreset>('Coastal');
  const [templateId, setTemplateId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectTemplate = (id: string) => {
    setTemplateId(id);
    if (!id) return;
    const found = DESTINATIONS.find((d) => d.id === id);
    if (found) {
      setTitle(`${found.name} Expedition`);
      setDestinationName(found.name);
      setCountry(found.country);
      setClimate(found.climate);
      setBudgetCap(found.dailyEstimateUsd * found.idealDays * travelers);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destinationName.trim() || !country.trim()) {
      setError('Please enter a trip title, destination, and country.');
      return;
    }
    if (endDate < startDate) {
      setError('Return date must be on or after the departure date.');
      return;
    }
    setError('');
    onCreateTrip({
      title: title.trim(),
      destinationName: destinationName.trim(),
      country: country.trim(),
      startDate,
      endDate,
      travelers: Math.max(1, travelers),
      budgetCap: Math.max(100, budgetCap),
      climate,
      templateDestinationId: templateId || undefined,
    });
    setTitle('');
    setDestinationName('');
    setCountry('');
    setTemplateId('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-trip-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF9F6] border border-[#DFDBD2] rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <h2 id="new-trip-title" className="font-editorial text-2xl font-medium text-[#161615]">
            Plan a New Trip
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-[#575550] hover:bg-[#EFECE6] hover:text-[#161615] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="trip-template" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
              Start from a Curated Route (optional)
            </label>
            <select
              id="trip-template"
              value={templateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              <option value="">Blank Custom Itinerary</option>
              {DESTINATIONS.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}, {dest.country} ({dest.sampleDays.length}-day template)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="trip-title" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
              Trip Title
            </label>
            <input
              id="trip-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Northern Honshu Autumn Rail"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="trip-dest" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
                Destination City / Region
              </label>
              <input
                id="trip-dest"
                type="text"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                placeholder="e.g., Kanazawa"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>
            <div>
              <label htmlFor="trip-country" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
                Country
              </label>
              <input
                id="trip-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Japan"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="trip-start" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
                Departure Date
              </label>
              <input
                id="trip-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>
            <div>
              <label htmlFor="trip-end" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
                Return Date
              </label>
              <input
                id="trip-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="trip-travelers" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
                Travelers
              </label>
              <input
                id="trip-travelers"
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>
            <div>
              <label htmlFor="trip-budget" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
                Budget Cap ($)
              </label>
              <input
                id="trip-budget"
                type="number"
                min={100}
                step={50}
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value) || 500)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>
            <div>
              <label htmlFor="trip-climate" className="block text-xs font-medium text-[#3F3E3B] mb-1.5">
                Packing Kit
              </label>
              <select
                id="trip-climate"
                value={climate}
                onChange={(e) => setClimate(e.target.value as ClimatePreset)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              >
                <option value="Coastal">Coastal</option>
                <option value="Alpine">Alpine</option>
                <option value="Urban">Urban</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5E2DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#3F3E3B] hover:text-[#161615] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors cursor-pointer"
            >
              Create Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
