import { FormEvent, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from 'lucide-react';
import { ItineraryStop, StopCategory, Trip } from '../types/travel';

interface ItineraryPlannerProps {
  trips: Trip[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onOpenNewTrip: () => void;
}

const STOP_CATEGORIES: ('All' | StopCategory)[] = ['All', 'Transit', 'Stay', 'Dining', 'Sight', 'Walk'];

export function ItineraryPlanner({
  trips,
  activeTripId,
  onSelectTrip,
  onUpdateTrip,
  onDeleteTrip,
  onOpenNewTrip,
}: ItineraryPlannerProps) {
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0];
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<'All' | StopCategory>('All');
  const [showAddStop, setShowAddStop] = useState(false);

  // Add Stop Form State
  const [time, setTime] = useState('10:00');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StopCategory>('Sight');
  const [neighborhood, setNeighborhood] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  if (!activeTrip) {
    return (
      <div className="bg-white border border-[#E5E2DC] rounded-xl p-10 text-center space-y-4">
        <h3 className="font-editorial text-2xl font-medium text-[#161615]">No Trips Planned Yet</h3>
        <p className="text-sm text-[#575550] max-w-md mx-auto">
          Start a custom itinerary or load any curated route from the destination atlas above.
        </p>
        <button
          type="button"
          onClick={onOpenNewTrip}
          className="px-5 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors cursor-pointer"
        >
          Plan New Trip
        </button>
      </div>
    );
  }

  const safeDayIndex = Math.min(activeDayIndex, Math.max(0, activeTrip.days.length - 1));
  const currentDay = activeTrip.days[safeDayIndex];

  const handleAddDay = () => {
    const nextNum = activeTrip.days.length + 1;
    const newDay = {
      id: `day-${Date.now()}`,
      dayNumber: nextNum,
      title: `Day ${nextNum} Exploration`,
      stops: [],
    };
    onUpdateTrip({
      ...activeTrip,
      days: [...activeTrip.days, newDay],
    });
    setActiveDayIndex(activeTrip.days.length);
  };

  const handleDayTitleChange = (newTitle: string) => {
    const updatedDays = activeTrip.days.map((d, idx) =>
      idx === safeDayIndex ? { ...d, title: newTitle } : d
    );
    onUpdateTrip({ ...activeTrip, days: updatedDays });
  };

  const handleAddStop = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !neighborhood.trim()) {
      setFormError('Please enter both a stop name and neighborhood or area.');
      return;
    }
    setFormError('');
    const newStop: ItineraryStop = {
      id: `stop-${Date.now()}`,
      time: time || '09:00',
      title: title.trim(),
      category,
      neighborhood: neighborhood.trim(),
      estimatedCost: Math.max(0, Number(estimatedCost) || 0),
      notes: notes.trim(),
      confirmed: false,
    };

    const updatedDays = activeTrip.days.map((d, idx) =>
      idx === safeDayIndex ? { ...d, stops: [...d.stops, newStop] } : d
    );
    onUpdateTrip({ ...activeTrip, days: updatedDays });
    setTitle('');
    setNeighborhood('');
    setEstimatedCost('0');
    setNotes('');
    setShowAddStop(false);
  };

  const handleToggleConfirmed = (stopId: string) => {
    const updatedDays = activeTrip.days.map((d, idx) =>
      idx === safeDayIndex
        ? {
            ...d,
            stops: d.stops.map((s) =>
              s.id === stopId ? { ...s, confirmed: !s.confirmed } : s
            ),
          }
        : d
    );
    onUpdateTrip({ ...activeTrip, days: updatedDays });
  };

  const handleDeleteStop = (stopId: string) => {
    const updatedDays = activeTrip.days.map((d, idx) =>
      idx === safeDayIndex
        ? { ...d, stops: d.stops.filter((s) => s.id !== stopId) }
        : d
    );
    onUpdateTrip({ ...activeTrip, days: updatedDays });
  };

  const handleMoveStop = (stopId: string, direction: -1 | 1) => {
    if (!currentDay) return;
    const index = currentDay.stops.findIndex((s) => s.id === stopId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= currentDay.stops.length) return;

    const reordered = [...currentDay.stops];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);

    const updatedDays = activeTrip.days.map((d, idx) =>
      idx === safeDayIndex ? { ...d, stops: reordered } : d
    );
    onUpdateTrip({ ...activeTrip, days: updatedDays });
  };

  const filteredStops = currentDay
    ? currentDay.stops.filter((s) => categoryFilter === 'All' || s.category === categoryFilter)
    : [];

  const totalStops = activeTrip.days.reduce((sum, d) => sum + d.stops.length, 0);
  const confirmedStops = activeTrip.days.reduce(
    (sum, d) => sum + d.stops.filter((s) => s.confirmed).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Trip Selector & Active Trip Header */}
      <div className="bg-white border border-[#E5E2DC] rounded-xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E5E2DC]">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#575550]">
              <span>Active Itinerary</span>
              <span aria-hidden="true">·</span>
              <span>{activeTrip.country}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeTrip.startDate} to {activeTrip.endDate}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {activeTrip.travelers} {activeTrip.travelers === 1 ? 'traveler' : 'travelers'}
              </span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-[#161615] tracking-tight">
              {activeTrip.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="trip-switcher" className="sr-only">
              Switch active trip
            </label>
            <select
              id="trip-switcher"
              value={activeTrip.id}
              onChange={(e) => {
                onSelectTrip(e.target.value);
                setActiveDayIndex(0);
              }}
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D8D3C9] rounded-lg text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] max-w-[260px]"
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenNewTrip}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#0F4C5C] bg-[#0F4C5C]/10 hover:bg-[#0F4C5C]/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Trip
            </button>

            {trips.length > 1 && (
              <button
                type="button"
                onClick={() => onDeleteTrip(activeTrip.id)}
                aria-label="Delete current trip"
                className="p-2 text-[#575550] hover:text-[#991B1B] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Day Tabs & Summary Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {activeTrip.days.map((day, index) => (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveDayIndex(index)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  index === safeDayIndex
                    ? 'bg-[#0F4C5C] text-white'
                    : 'bg-[#F2F0EC] text-[#3F3E3B] hover:bg-[#E7E3DC]'
                }`}
              >
                Day {day.dayNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddDay}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#3F3E3B] border border-dashed border-[#C9C4BA] hover:border-[#0F4C5C] hover:text-[#0F4C5C] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Day
            </button>
          </div>

          <div className="text-xs text-[#575550] tabular-nums whitespace-nowrap shrink-0">
            {confirmedStops} of {totalStops} stops confirmed
          </div>
        </div>
      </div>

      {/* Active Day Workspace */}
      {currentDay && (
        <div className="bg-white border border-[#E5E2DC] rounded-xl p-6 sm:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
            <div className="flex-1 flex items-center gap-3">
              <span className="font-mono text-xs text-[#0F4C5C] whitespace-nowrap shrink-0">
                Day 0{currentDay.dayNumber}
              </span>
              <input
                type="text"
                aria-label="Day title"
                value={currentDay.title}
                onChange={(e) => handleDayTitleChange(e.target.value)}
                className="w-full font-editorial text-xl font-medium text-[#161615] bg-transparent border-b border-transparent hover:border-[#D8D3C9] focus:border-[#0F4C5C] focus:outline-none py-0.5"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-[#F2F0EC] rounded-lg overflow-x-auto">
                {STOP_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-white text-[#161615] shadow-sm'
                        : 'text-[#575550] hover:text-[#161615]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddStop((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddStop ? 'Close Form' : 'Add Stop'}
              </button>
            </div>
          </div>

          {/* Inline Add Stop Form */}
          {showAddStop && (
            <form
              onSubmit={handleAddStop}
              className="bg-[#FAF9F6] border border-[#DFDBD2] rounded-lg p-5 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="stop-time" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Time
                  </label>
                  <input
                    id="stop-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="stop-title" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Stop or Activity
                  </label>
                  <input
                    id="stop-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Morning train to Ravello"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
                <div>
                  <label htmlFor="stop-cat" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Category
                  </label>
                  <select
                    id="stop-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StopCategory)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  >
                    <option value="Sight">Sight</option>
                    <option value="Dining">Dining</option>
                    <option value="Transit">Transit</option>
                    <option value="Walk">Walk</option>
                    <option value="Stay">Stay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="stop-area" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Neighborhood / Area
                  </label>
                  <input
                    id="stop-area"
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g., Historic Center"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
                <div>
                  <label htmlFor="stop-cost" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Estimated Cost ($)
                  </label>
                  <input
                    id="stop-cost"
                    type="number"
                    min={0}
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
                <div>
                  <label htmlFor="stop-notes" className="block text-xs font-medium text-[#3F3E3B] mb-1">
                    Logistics Note
                  </label>
                  <input
                    id="stop-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ticket window, seat preference..."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-[#991B1B]">{formError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStop(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#575550] hover:text-[#161615] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg cursor-pointer"
                >
                  Save Stop
                </button>
              </div>
            </form>
          )}

          {/* Stops Timeline */}
          {filteredStops.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-[#575550]">
                {currentDay.stops.length === 0
                  ? 'No stops scheduled for this day yet.'
                  : `No ${categoryFilter.toLowerCase()} stops on Day ${currentDay.dayNumber}.`}
              </p>
              {currentDay.stops.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddStop(true)}
                  className="text-xs font-medium text-[#0F4C5C] underline underline-offset-4 cursor-pointer"
                >
                  Add your first stop
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#E5E2DC]">
              {filteredStops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
                    <span className="font-mono text-sm tabular-nums text-[#161615] pt-0.5 w-14 shrink-0">
                      {stop.time}
                    </span>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#575550]">
                        <span className="font-medium text-[#0F4C5C]">{stop.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{stop.neighborhood}</span>
                        {stop.estimatedCost > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-[#161615]">
                              ${stop.estimatedCost}
                            </span>
                          </>
                        )}
                      </div>
                      <h4 className="text-base font-medium text-[#161615]">{stop.title}</h4>
                      {stop.notes && (
                        <p className="text-sm text-[#575550] leading-relaxed max-w-2xl">
                          {stop.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-[4.5rem] md:pl-0">
                    <button
                      type="button"
                      onClick={() => handleToggleConfirmed(stop.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        stop.confirmed
                          ? 'bg-[#0F4C5C]/10 border-[#0F4C5C]/25 text-[#0F4C5C]'
                          : 'bg-[#FAF9F6] border-[#DFDBD2] text-[#575550] hover:text-[#161615]'
                      }`}
                    >
                      {stop.confirmed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                      {stop.confirmed ? 'Confirmed' : 'Planned'}
                    </button>

                    {categoryFilter === 'All' && (
                      <div className="flex items-center border border-[#E5E2DC] rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleMoveStop(stop.id, -1)}
                          disabled={idx === 0}
                          aria-label="Move stop up"
                          className="p-1.5 text-[#575550] hover:bg-[#F2F0EC] disabled:opacity-30 cursor-pointer disabled:cursor-default"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStop(stop.id, 1)}
                          disabled={idx === filteredStops.length - 1}
                          aria-label="Move stop down"
                          className="p-1.5 text-[#575550] hover:bg-[#F2F0EC] border-l border-[#E5E2DC] disabled:opacity-30 cursor-pointer disabled:cursor-default"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteStop(stop.id)}
                      aria-label={`Remove ${stop.title}`}
                      className="p-1.5 text-[#575550] hover:text-[#991B1B] hover:bg-[#FEF2F2] rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
