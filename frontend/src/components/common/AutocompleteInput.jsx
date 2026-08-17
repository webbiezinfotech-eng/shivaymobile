import { useMemo, useRef, useState } from 'react';

export default function AutocompleteInput({
  id,
  name,
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = '',
  error = '',
  maxOptions = 8,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];

    return suggestions
      .filter((option) => option.toLowerCase().includes(query))
      .slice(0, maxOptions);
  }, [value, suggestions, maxOptions]);

  const showList = open && filtered.length > 0;

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="label-text">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        className="input-field"
        value={value}
        onChange={(event) => {
          onChange(event);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showList && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-brand-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
