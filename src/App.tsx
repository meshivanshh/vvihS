import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, Check, Search } from 'lucide-react';
import { BudgetAndPacking } from './components/BudgetAndPacking';
import { DestinationModal } from './components/DestinationModal';
import { Header, NavSection } from './components/Header';
import { ItineraryPlanner } from './components/ItineraryPlanner';
import { NewTripModal } from './components/NewTripModal';
import { ResilientImage } from './components/ResilientImage';
import {
  buildPackingPreset,
  DESTINATIONS,
  FIELD_DISPATCHES,
  INITIAL_TRIPS,
} from './data/destinations';
import { ClimatePreset, Destination, Region, Season, Trip } from './types/travel';

const STORAGE_TRIPS_KEY = 'meridian_trips_v1';
const STORAGE_SAVED_KEY = 'meridian_saved_destinations_v1';

const REGION_OPTIONS: ('All' | Region)[] = ['All', 'Europe', 'Asia', 'Americas'];
const SEASON_OPTIONS: ('All' | Season)[] = ['All', 'Spring', 'Summer', 'Autumn', 'Winter'];

export default function App() {
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_TRIPS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Trip[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial trips if storage unavailable
    }
    return INITIAL_TRIPS;
  });

  const [savedDestinationIds, setSavedDestinationIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return ['amalfi-ravello', 'kyoto-higashiyama'];
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => trips[0]?.id || '');
  const [activeSection, setActiveSection] = useState<NavSection>('destinations');

  // Atlas Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'All' | Region>('All');
  const [seasonFilter, setSeasonFilter] = useState<'All' | Season>('All');
  const [savedOnly, setSavedOnly] = useState(false);

  // Modals & Expanded Dispatch
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [expandedDispatchId, setExpandedDispatchId] = useState<string | null>(FIELD_DISPATCHES[0].id);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRIPS_KEY, JSON.stringify(trips));
    } catch {
      // Ignore quota errors
    }
  }, [trips]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedDestinationIds));
    } catch {
      // Ignore quota errors
    }
  }, [savedDestinationIds]);

  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DESTINATIONS.filter((dest) => {
      if (regionFilter !== 'All' && dest.region !== regionFilter) return false;
      if (seasonFilter !== 'All' && !dest.bestSeasons.includes(seasonFilter)) return false;
      if (savedOnly && !savedDestinationIds.includes(dest.id)) return false;
      if (!q) return true;
      return (
        dest.name.toLowerCase().includes(q) ||
        dest.country.toLowerCase().includes(q) ||
        dest.kicker.toLowerCase().includes(q) ||
        dest.summary.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, regionFilter, seasonFilter, savedOnly, savedDestinationIds]);

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0];

  const scrollToSection = (section: NavSection) => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleToggleSave = (id: string) => {
    setSavedDestinationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLoadDestinationIntoPlanner = (destination: Destination) => {
    const clonedDays = destination.sampleDays.map((day, dIdx) => ({
      ...day,
      id: `day-${Date.now()}-${dIdx}`,
      stops: day.stops.map((stop, sIdx) => ({
        ...stop,
        id: `stop-${Date.now()}-${dIdx}-${sIdx}`,
      })),
    }));

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      title: `${destination.name} Field Route`,
      destinationId: destination.id,
      destinationName: destination.name,
      country: destination.country,
      startDate: '2026-10-12',
      endDate: `2026-10-${12 + Math.max(1, destination.idealDays)}`,
      travelers: 2,
      budgetCap: destination.dailyEstimateUsd * destination.idealDays * 2,
      currency: 'USD',
      climate: destination.climate,
      days: clonedDays,
      fixedExpenses: [
        {
          id: `exp-${Date.now()}-1`,
          label: `Primary Rail / Flight to ${destination.name}`,
          category: 'Transport',
          amount: 480,
          paid: false,
        },
      ],
      packingList: buildPackingPreset(destination.climate),
    };

    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    setSelectedDestination(null);
    scrollToSection('itinerary');
  };

  const handleCreateTrip = (payload: {
    title: string;
    destinationName: string;
    country: string;
    startDate: string;
    endDate: string;
    travelers: number;
    budgetCap: number;
    climate: ClimatePreset;
    templateDestinationId?: string;
  }) => {
    const template = payload.templateDestinationId
      ? DESTINATIONS.find((d) => d.id === payload.templateDestinationId)
      : undefined;

    const days = template
      ? template.sampleDays.map((day, dIdx) => ({
          ...day,
          id: `day-${Date.now()}-${dIdx}`,
          stops: day.stops.map((stop, sIdx) => ({
            ...stop,
            id: `stop-${Date.now()}-${dIdx}-${sIdx}`,
          })),
        }))
      : [
          {
            id: `day-${Date.now()}-1`,
            dayNumber: 1,
            title: `Arrival in ${payload.destinationName}`,
            stops: [],
          },
        ];

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      title: payload.title,
      destinationId: template?.id,
      destinationName: payload.destinationName,
      country: payload.country,
      startDate: payload.startDate,
      endDate: payload.endDate,
      travelers: payload.travelers,
      budgetCap: payload.budgetCap,
      currency: 'USD',
      climate: payload.climate,
      days,
      fixedExpenses: [],
      packingList: buildPackingPreset(payload.climate),
    };

    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    scrollToSection('itinerary');
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips((prev) => {
      const remaining = prev.filter((t) => t.id !== tripId);
      if (activeTripId === tripId && remaining[0]) {
        setActiveTripId(remaining[0].id);
      }
      return remaining;
    });
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#161615]">
      <Header
        activeSection={activeSection}
        onNavigate={scrollToSection}
        onOpenNewTrip={() => setIsNewTripOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section: Balanced 2-Column Split + Full-Width Index Strip */}
        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Column: Editorial Headline & Primary Action */}
            <div className="lg:col-span-5 flex flex-col justify-between py-2 space-y-8">
              <div className="space-y-5">
                <p className="text-xs font-medium tracking-wide text-[#575550]">
                  Curated Routes <span aria-hidden="true">·</span> Seasonal Field Guides{' '}
                  <span aria-hidden="true">·</span> Trip Ledger
                </p>

                <h1 className="font-editorial text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-medium tracking-tight text-[#161615] [text-wrap:balance]">
                  Travel shaped by terrain, rail timetables, and unhurried mornings.
                </h1>

                <p className="text-base leading-relaxed text-[#4A4843] max-w-md">
                  Explore field-tested routes across coastal Italy, Kyoto’s cedar lanes, alpine passes, and Arctic fjords—then assemble your day-by-day itinerary, packing kit, and budget in one workspace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('itinerary')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open Trip Planner
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('destinations')}
                  className="px-4 py-3 text-sm font-medium text-[#161615] hover:text-[#0F4C5C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Browse Destination Atlas
                </button>
              </div>
            </div>

            {/* Right Column: Dominant 16:9 Focal Photography */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="relative flex-1 min-h-[300px] lg:min-h-[420px] rounded-xl overflow-hidden bg-[#EAE6DF] border border-[#E5E2DC]">
                <ResilientImage
                  src={DESTINATIONS[0].imageUrl}
                  alt={DESTINATIONS[0].imageAlt}
                  fallbackTitle={DESTINATIONS[0].name}
                  className="w-full h-full lg:absolute lg:inset-0 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute bottom-5 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                  <div>
                    <p className="text-xs text-white/80 mb-1">
                      Featured Route <span aria-hidden="true">·</span> {DESTINATIONS[0].coordinates}
                    </p>
                    <p className="font-editorial text-2xl font-medium">
                      Amalfi & Ravello Coastal Trail
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDestination(DESTINATIONS[0])}
                    className="self-start sm:self-auto px-3.5 py-2 text-xs font-medium bg-white/95 text-[#161615] hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Read Field Guide
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Operational Index Strip Directly Below Hero Split */}
          <div className="mt-10 pt-6 border-t border-b border-[#E5E2DC] pb-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="font-mono text-xl font-medium tabular-nums text-[#161615] block">
                {DESTINATIONS.length} Regions
              </span>
              <span className="text-xs text-[#575550] mt-1 block">
                Curated atlases with transit & seasonal notes
              </span>
            </div>
            <div>
              <span className="font-mono text-xl font-medium tabular-nums text-[#161615] block">
                {trips.length} Active {trips.length === 1 ? 'Trip' : 'Trips'}
              </span>
              <span className="text-xs text-[#575550] mt-1 block">
                Saved automatically in your browser workspace
              </span>
            </div>
            <div>
              <span className="font-mono text-xl font-medium tabular-nums text-[#161615] block">
                {savedDestinationIds.length} Bookmarked
              </span>
              <span className="text-xs text-[#575550] mt-1 block">
                Shortlisted destinations ready to schedule
              </span>
            </div>
            <div>
              <span className="font-mono text-xl font-medium tabular-nums text-[#161615] block">
                {activeTrip ? `$${activeTrip.budgetCap.toLocaleString()}` : '$0'}
              </span>
              <span className="text-xs text-[#575550] mt-1 block">
                Current trip budget cap in tabular ledger
              </span>
            </div>
          </div>
        </section>

        {/* Section 1: Curated Destination Atlas */}
        <section
          id="destinations"
          className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16 border-t border-[#E5E2DC]"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs font-medium text-[#0F4C5C]">01. Destination Atlas</p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight text-[#161615] [text-wrap:balance]">
                Places chosen for walking scale and regional rail access.
              </h2>
            </div>

            {/* Search & Saved Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C8880] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, country, terrain..."
                  aria-label="Search destinations"
                  className="pl-9 pr-3 py-2 text-sm bg-white border border-[#D8D3C9] rounded-lg w-64 text-[#161615] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                />
              </div>

              <button
                type="button"
                onClick={() => setSavedOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  savedOnly
                    ? 'bg-[#0F4C5C] border-[#0F4C5C] text-white'
                    : 'bg-white border-[#D8D3C9] text-[#3F3E3B] hover:border-[#161615]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Saved Only ({savedDestinationIds.length})
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-1 p-1 bg-[#F2F0EC] rounded-lg w-fit overflow-x-auto">
              {REGION_OPTIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setRegionFilter(region)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    regionFilter === region
                      ? 'bg-white text-[#161615] shadow-sm'
                      : 'text-[#575550] hover:text-[#161615]'
                  }`}
                >
                  {region === 'All' ? 'All Regions' : region}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F2F0EC] rounded-lg w-fit overflow-x-auto">
              {SEASON_OPTIONS.map((season) => (
                <button
                  key={season}
                  type="button"
                  onClick={() => setSeasonFilter(season)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    seasonFilter === season
                      ? 'bg-white text-[#161615] shadow-sm'
                      : 'text-[#575550] hover:text-[#161615]'
                  }`}
                >
                  {season === 'All' ? 'Any Season' : season}
                </button>
              ))}
            </div>
          </div>

          {/* Asymmetric Bento / Editorial Grid */}
          {filteredDestinations.length === 0 ? (
            <div className="bg-white border border-[#E5E2DC] rounded-xl p-12 text-center space-y-3">
              <p className="font-editorial text-xl text-[#161615]">No matching destinations</p>
              <p className="text-sm text-[#575550]">
                Try clearing your season or region filter to view all curated routes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRegionFilter('All');
                  setSeasonFilter('All');
                  setSavedOnly(false);
                }}
                className="px-4 py-2 text-xs font-medium text-[#0F4C5C] border border-[#0F4C5C]/30 rounded-lg hover:bg-[#0F4C5C]/5 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredDestinations.map((dest, index) => {
                const isSaved = savedDestinationIds.includes(dest.id);
                const isFeature = index === 0 && filteredDestinations.length >= 4;
                return (
                  <article
                    key={dest.id}
                    className={`bg-white border border-[#E5E2DC] rounded-xl overflow-hidden flex flex-col transition-colors hover:border-[#C9C4BA] ${
                      isFeature ? 'lg:col-span-2' : ''
                    }`}
                  >
                    <div
                      className={`relative overflow-hidden bg-[#EAE6DF] cursor-pointer ${
                        isFeature ? 'h-64 sm:h-72' : 'aspect-[4/3]'
                      }`}
                      onClick={() => setSelectedDestination(dest)}
                    >
                      <ResilientImage
                        src={dest.imageUrl}
                        alt={dest.imageAlt}
                        fallbackTitle={dest.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSave(dest.id);
                        }}
                        aria-label={isSaved ? `Remove ${dest.name} from saved` : `Save ${dest.name}`}
                        className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-[#0F4C5C] text-white'
                            : 'bg-black/50 text-white hover:bg-black/70'
                        }`}
                      >
                        {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                      <div className="space-y-2.5">
                        {/* Zero-pill metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#575550]">
                          <span>{dest.country}</span>
                          <span aria-hidden="true">·</span>
                          <span>{dest.bestSeasons.join(' / ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{dest.idealDays}d</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-[#161615]">
                            ~${dest.dailyEstimateUsd}/day
                          </span>
                        </div>

                        <h3 className="font-editorial text-2xl font-medium text-[#161615] tracking-tight">
                          <button
                            type="button"
                            onClick={() => setSelectedDestination(dest)}
                            className="text-left hover:text-[#0F4C5C] transition-colors cursor-pointer"
                          >
                            {dest.name}
                          </button>
                        </h3>

                        <p className="text-sm leading-relaxed text-[#4A4843]">
                          {dest.summary}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#EFECE6] flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedDestination(dest)}
                          className="text-xs font-medium text-[#161615] hover:text-[#0F4C5C] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Open Field Guide
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDestinationIntoPlanner(dest)}
                          className="text-xs font-medium text-[#0F4C5C] hover:underline underline-offset-4 whitespace-nowrap cursor-pointer"
                        >
                          Load {dest.sampleDays.length}-Day Route
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Field Guides & Dispatches */}
        <section
          id="dispatches"
          className="bg-[#F2F0EC] border-t border-[#E5E2DC] py-12 lg:py-16"
        >
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-4 space-y-3">
                <p className="text-xs font-medium text-[#0F4C5C]">02. Field Guides</p>
                <h2 className="font-editorial text-3xl font-medium tracking-tight text-[#161615] [text-wrap:balance]">
                  Notes on timing, local transit, and quiet hours.
                </h2>
                <p className="text-sm leading-relaxed text-[#575550]">
                  Practical dispatches written by regional contributors to help you structure days around daylight and local ferries rather than rush-hour transfers.
                </p>
              </div>

              <div className="lg:col-span-8 divide-y divide-[#DFDBD2] border-t border-b border-[#DFDBD2]">
                {FIELD_DISPATCHES.map((dispatch) => {
                  const isOpen = expandedDispatchId === dispatch.id;
                  const linkedDest = DESTINATIONS.find(
                    (d) => d.id === dispatch.linkedDestinationId
                  );
                  return (
                    <div key={dispatch.id} className="py-5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDispatchId(isOpen ? null : dispatch.id)
                        }
                        aria-expanded={isOpen}
                        className="w-full text-left flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-[#575550]">
                            <span className="font-mono text-[#0F4C5C]">{dispatch.number}.</span>
                            <span>{dispatch.region}</span>
                            <span aria-hidden="true">·</span>
                            <span>{dispatch.author}</span>
                            <span aria-hidden="true">·</span>
                            <span>{dispatch.readTime}</span>
                          </div>
                          <h3 className="font-editorial text-xl sm:text-2xl font-medium text-[#161615] group-hover:text-[#0F4C5C] transition-colors">
                            {dispatch.title}
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-[#0F4C5C] shrink-0">
                          {isOpen ? 'Hide Note' : 'Read Note'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="mt-4 space-y-3 max-w-2xl">
                          <p className="text-sm font-medium text-[#3F3E3B] leading-relaxed">
                            {dispatch.excerpt}
                          </p>
                          <p className="text-sm text-[#575550] leading-relaxed">
                            {dispatch.body}
                          </p>
                          {linkedDest && (
                            <button
                              type="button"
                              onClick={() => setSelectedDestination(linkedDest)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C5C] hover:underline underline-offset-4 pt-1 cursor-pointer"
                            >
                              View {linkedDest.name} Guide
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Itinerary Workspace */}
        <section
          id="itinerary"
          className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16 border-t border-[#E5E2DC]"
        >
          <div className="space-y-2 mb-8 max-w-2xl">
            <p className="text-xs font-medium text-[#0F4C5C]">03. Day-by-Day Planner</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight text-[#161615] [text-wrap:balance]">
              Structure every leg, meal, and trailhead.
            </h2>
          </div>

          <ItineraryPlanner
            trips={trips}
            activeTripId={activeTripId}
            onSelectTrip={setActiveTripId}
            onUpdateTrip={handleUpdateTrip}
            onDeleteTrip={handleDeleteTrip}
            onOpenNewTrip={() => setIsNewTripOpen(true)}
          />
        </section>

        {/* Section 4: Budget Ledger & Packing Checklist */}
        <section
          id="toolkit"
          className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16 border-t border-[#E5E2DC]"
        >
          <div className="space-y-2 mb-8 max-w-2xl">
            <p className="text-xs font-medium text-[#0F4C5C]">04. Budget & Field Kit</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight text-[#161615] [text-wrap:balance]">
              Track projected trip spend alongside climate-matched gear.
            </h2>
          </div>

          <BudgetAndPacking trip={activeTrip} onUpdateTrip={handleUpdateTrip} />
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E5E2DC] bg-[#FAF9F6] mt-12">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[#575550]">
            <span className="font-editorial text-base font-medium text-[#161615]">Meridian</span>
            <span aria-hidden="true">·</span>
            <span>Editorial Travel Atlas & Trip Workspace</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#575550]">
            <button
              type="button"
              onClick={() => scrollToSection('destinations')}
              className="hover:text-[#161615] cursor-pointer"
            >
              Destinations
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('dispatches')}
              className="hover:text-[#161615] cursor-pointer"
            >
              Field Guides
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('itinerary')}
              className="hover:text-[#161615] cursor-pointer"
            >
              Itinerary
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('toolkit')}
              className="hover:text-[#161615] cursor-pointer"
            >
              Budget & Gear
            </button>
          </div>
        </div>
      </footer>

      <DestinationModal
        destination={selectedDestination}
        isSaved={selectedDestination ? savedDestinationIds.includes(selectedDestination.id) : false}
        onToggleSave={handleToggleSave}
        onClose={() => setSelectedDestination(null)}
        onLoadIntoPlanner={handleLoadDestinationIntoPlanner}
      />

      <NewTripModal
        isOpen={isNewTripOpen}
        onClose={() => setIsNewTripOpen(false)}
        onCreateTrip={handleCreateTrip}
      />
    </div>
  );
}
