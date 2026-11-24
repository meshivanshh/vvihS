import { FormEvent, useState } from 'react';
import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { buildPackingPreset } from '../data/destinations';
import { BudgetExpense, ClimatePreset, PackingItem, Trip } from '../types/travel';

interface BudgetAndPackingProps {
  trip: Trip | undefined;
  onUpdateTrip: (updatedTrip: Trip) => void;
}

export function BudgetAndPacking({ trip, onUpdateTrip }: BudgetAndPackingProps) {
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<BudgetExpense['category']>('Transport');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [itemLabel, setItemLabel] = useState('');
  const [itemCategory, setItemCategory] = useState<PackingItem['category']>('Field Kit');

  if (!trip) return null;

  // Dynamic totals from itinerary stops + fixed expenses
  const itineraryCost = trip.days.reduce(
    (sum, day) => sum + day.stops.reduce((dSum, stop) => dSum + stop.estimatedCost, 0),
    0
  );
  const fixedCost = trip.fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalEstimated = itineraryCost + fixedCost;
  const remainingBudget = trip.budgetCap - totalEstimated;
  const perPerson = Math.round(totalEstimated / Math.max(1, trip.travelers));
  const utilizationPct = Math.min(100, Math.round((totalEstimated / Math.max(1, trip.budgetCap)) * 100));

  const packedCount = trip.packingList.filter((i) => i.packed).length;
  const packingCategories: PackingItem['category'][] = [
    'Documents & Transit',
    'Apparel',
    'Optics & Tech',
    'Field Kit',
  ];

  const handleAddExpense = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseLabel.trim() || !amount || amount <= 0) return;

    const newExpense: BudgetExpense = {
      id: `exp-${Date.now()}`,
      label: expenseLabel.trim(),
      category: expenseCategory,
      amount,
      paid: false,
    };

    onUpdateTrip({
      ...trip,
      fixedExpenses: [...trip.fixedExpenses, newExpense],
    });
    setExpenseLabel('');
    setExpenseAmount('');
  };

  const handleTogglePaid = (id: string) => {
    onUpdateTrip({
      ...trip,
      fixedExpenses: trip.fixedExpenses.map((e) =>
        e.id === id ? { ...e, paid: !e.paid } : e
      ),
    });
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateTrip({
      ...trip,
      fixedExpenses: trip.fixedExpenses.filter((e) => e.id !== id),
    });
  };

  const handleTogglePacked = (id: string) => {
    onUpdateTrip({
      ...trip,
      packingList: trip.packingList.map((item) =>
        item.id === id ? { ...item, packed: !item.packed } : item
      ),
    });
  };

  const handleAddPackingItem = (e: FormEvent) => {
    e.preventDefault();
    if (!itemLabel.trim()) return;
    const newItem: PackingItem = {
      id: `pk-${Date.now()}`,
      label: itemLabel.trim(),
      category: itemCategory,
      packed: false,
    };
    onUpdateTrip({
      ...trip,
      packingList: [...trip.packingList, newItem],
    });
    setItemLabel('');
  };

  const handleDeletePackingItem = (id: string) => {
    onUpdateTrip({
      ...trip,
      packingList: trip.packingList.filter((i) => i.id !== id),
    });
  };

  const handleApplyClimatePreset = (preset: ClimatePreset) => {
    onUpdateTrip({
      ...trip,
      climate: preset,
      packingList: buildPackingPreset(preset),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Budget Ledger (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-[#E5E2DC] rounded-xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E2DC]">
          <div>
            <p className="text-xs text-[#575550] mb-1">
              Trip Ledger <span aria-hidden="true">·</span> {trip.destinationName}
            </p>
            <h3 className="font-editorial text-2xl font-medium text-[#161615]">
              Budget & Expense Ledger
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-[#575550] block">Total Projected</span>
            <span className="font-mono text-2xl font-medium tabular-nums text-[#161615]">
              ${totalEstimated.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid grid-cols-3 gap-4 py-2">
          <div>
            <span className="text-xs text-[#575550] block">Budget Cap</span>
            <span className="font-mono text-base font-medium tabular-nums text-[#161615]">
              ${trip.budgetCap.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#575550] block">
              {remainingBudget >= 0 ? 'Headroom' : 'Over Cap'}
            </span>
            <span
              className={`font-mono text-base font-medium tabular-nums ${
                remainingBudget >= 0 ? 'text-[#0F4C5C]' : 'text-[#991B1B]'
              }`}
            >
              {remainingBudget >= 0
                ? `$${remainingBudget.toLocaleString()}`
                : `-$${Math.abs(remainingBudget).toLocaleString()}`}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#575550] block">Per Traveler</span>
            <span className="font-mono text-base font-medium tabular-nums text-[#161615]">
              ${perPerson.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Progress Bar with explicit text status */}
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-[#EFECE6] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                remainingBudget < 0 ? 'bg-[#991B1B]' : 'bg-[#0F4C5C]'
              }`}
              style={{ width: `${utilizationPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#575550] tabular-nums">
            <span>{utilizationPct}% of budget allocated</span>
            <span>
              Itinerary stops: ${itineraryCost.toLocaleString()} · Fixed: ${fixedCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Expense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E2DC] text-xs font-medium text-[#575550]">
                <th className="py-2.5 pr-4">Item</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Status</th>
                <th className="py-2.5 pl-2 w-8">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6] text-sm">
              <tr className="bg-[#FAF9F6]">
                <td className="py-3 pr-4 font-medium text-[#161615]">
                  Scheduled Itinerary Stops ({trip.days.reduce((s, d) => s + d.stops.length, 0)})
                </td>
                <td className="py-3 px-3 text-xs text-[#575550]">Daily Route</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#161615]">
                  ${itineraryCost.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right text-xs text-[#575550]">Auto-summed</td>
                <td />
              </tr>

              {trip.fixedExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="py-3 pr-4 text-[#161615]">{exp.label}</td>
                  <td className="py-3 px-3 text-xs text-[#575550]">{exp.category}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#161615]">
                    ${exp.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(exp.id)}
                      className={`text-xs font-medium px-2 py-1 rounded border transition-colors whitespace-nowrap cursor-pointer ${
                        exp.paid
                          ? 'bg-[#0F4C5C]/10 border-[#0F4C5C]/25 text-[#0F4C5C]'
                          : 'bg-white border-[#DFDBD2] text-[#575550] hover:text-[#161615]'
                      }`}
                    >
                      {exp.paid ? 'Paid' : 'Pending'}
                    </button>
                  </td>
                  <td className="py-3 pl-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      aria-label={`Remove ${exp.label}`}
                      className="p-1 text-[#575550] hover:text-[#991B1B] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Fixed Expense Form */}
        <form onSubmit={handleAddExpense} className="pt-3 border-t border-[#E5E2DC] flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={expenseLabel}
            onChange={(e) => setExpenseLabel(e.target.value)}
            placeholder="Add flight, pass, or hotel deposit..."
            aria-label="Expense description"
            className="flex-1 px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
          <select
            value={expenseCategory}
            onChange={(e) => setExpenseCategory(e.target.value as BudgetExpense['category'])}
            aria-label="Expense category"
            className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          >
            <option value="Transport">Transport</option>
            <option value="Lodging">Lodging</option>
            <option value="Dining">Dining</option>
            <option value="Activities">Activities</option>
            <option value="Gear">Gear</option>
          </select>
          <input
            type="number"
            min={1}
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="$"
            aria-label="Expense amount"
            className="w-24 px-3 py-2 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>
        </form>
      </div>

      {/* Packing Checklist (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-[#E5E2DC] rounded-xl p-6 sm:p-7 space-y-5">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <p className="text-xs text-[#575550] mb-1">
              Field Kit <span aria-hidden="true">·</span> {trip.climate} Climate
            </p>
            <h3 className="font-editorial text-2xl font-medium text-[#161615]">
              Packing Checklist
            </h3>
          </div>
          <span className="font-mono text-sm tabular-nums text-[#0F4C5C] pt-1">
            {packedCount}/{trip.packingList.length} packed
          </span>
        </div>

        {/* Climate Preset Switcher */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#575550]">Load kit:</span>
          <div className="flex items-center gap-1 p-1 bg-[#F2F0EC] rounded-lg">
            {(['Coastal', 'Alpine', 'Urban'] as ClimatePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleApplyClimatePreset(preset)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  trip.climate === preset
                    ? 'bg-white text-[#161615] shadow-sm'
                    : 'text-[#575550] hover:text-[#161615]'
                }`}
              >
                {trip.climate === preset && <RotateCcw className="w-3 h-3 text-[#0F4C5C]" />}
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped Checklist */}
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {packingCategories.map((cat) => {
            const items = trip.packingList.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-1.5">
                <h4 className="text-xs font-semibold text-[#575550]">{cat}</h4>
                <div className="divide-y divide-[#EFECE6] border-t border-b border-[#EFECE6]">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="py-2 flex items-center justify-between gap-3 group"
                    >
                      <button
                        type="button"
                        onClick={() => handleTogglePacked(item.id)}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            item.packed
                              ? 'bg-[#0F4C5C] border-[#0F4C5C] text-white'
                              : 'border-[#C9C4BA] bg-white'
                          }`}
                        >
                          {item.packed && <Check className="w-3 h-3" strokeWidth={2.5} />}
                        </span>
                        <span
                          className={`text-sm truncate ${
                            item.packed ? 'line-through text-[#8C8880]' : 'text-[#161615]'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackingItem(item.id)}
                        aria-label={`Remove ${item.label}`}
                        className="p-1 text-[#8C8880] hover:text-[#991B1B] opacity-70 hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Packing Item */}
        <form onSubmit={handleAddPackingItem} className="pt-3 border-t border-[#E5E2DC] flex gap-2">
          <input
            type="text"
            value={itemLabel}
            onChange={(e) => setItemLabel(e.target.value)}
            placeholder="Add gear or document..."
            aria-label="Packing item name"
            className="flex-1 px-3 py-2 text-sm bg-[#FAF9F6] border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
          <select
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value as PackingItem['category'])}
            aria-label="Packing item category"
            className="px-2.5 py-2 text-xs bg-[#FAF9F6] border border-[#D8D3C9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] max-w-[125px]"
          >
            <option value="Documents & Transit">Documents</option>
            <option value="Apparel">Apparel</option>
            <option value="Optics & Tech">Optics & Tech</option>
            <option value="Field Kit">Field Kit</option>
          </select>
          <button
            type="submit"
            aria-label="Add packing item"
            className="px-3 py-2 text-xs font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3945] rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
