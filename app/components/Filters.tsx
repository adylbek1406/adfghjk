import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  id: string;
  name: string;
  options: FilterOption[];
}

interface FiltersProps {
  groups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onChange: (groupId: string, values: string[]) => void;
}

export default function Filters({ groups, selectedFilters, onChange }: FiltersProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{group.name}</h3>
          <div className="space-y-3">
            {group.options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${group.id}-${option.value}`}
                  checked={selectedFilters[group.id]?.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = selectedFilters[group.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    onChange(group.id, newValues);
                  }}
                  className="form-checkbox h-4 w-4 rounded border-gray-300 text-[#f85125] focus:ring-0 cursor-pointer checked:bg-[#f85125] checked:hover:bg-[#f85125] hover:bg-[#f85125]/10 transition-colors"
                />
                <label
                  htmlFor={`${group.id}-${option.value}`}
                  className="ml-3 text-sm text-gray-600 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 