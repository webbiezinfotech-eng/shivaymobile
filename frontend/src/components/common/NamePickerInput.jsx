import { useEffect, useMemo, useState } from 'react';

const STORAGE_PREFIX = 'shivay_extra_names_';

function readStoredNames(storageKey) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeNames(storageKey, names) {
  localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(names));
}

export default function NamePickerInput({
  id,
  name,
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = '',
  error = '',
  storageKey = name,
  maxOptions = 10,
}) {
  const [open, setOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [extraOptions, setExtraOptions] = useState(() => readStoredNames(storageKey));

  const allSuggestions = useMemo(() => {
    const merged = [...new Set([...extraOptions, ...suggestions])]
      .map((item) => String(item).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return merged;
  }, [extraOptions, suggestions]);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    const pool = query
      ? allSuggestions.filter((option) => option.toLowerCase().includes(query))
      : allSuggestions;
    return pool.slice(0, maxOptions);
  }, [value, allSuggestions, maxOptions]);

  const showList = open && filtered.length > 0;

  useEffect(() => {
    if (!showAddModal) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAddModal(false);
        setNewName('');
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showAddModal]);

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setOpen(false);
  };

  const openAddModal = () => {
    setNewName(value.trim());
    setShowAddModal(true);
    setOpen(false);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewName('');
  };

  const handleAddName = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const updated = [...new Set([...extraOptions, trimmed])];
    setExtraOptions(updated);
    storeNames(storageKey, updated);
    onChange({ target: { name, value: trimmed } });
    closeAddModal();
  };

  return (
    <>
      <div>
        <label htmlFor={id} className="label-text">
          {label}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="btn-secondary min-h-[46px] w-12 shrink-0 px-0 text-xl font-bold leading-none"
            aria-label={`Add new ${label}`}
          >
            +
          </button>
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={closeAddModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">Naya {label} add karein</h3>
            <p className="mt-2 text-sm text-slate-600">
              Yahan naam likho — baad mein dropdown se select kar sakte ho.
            </p>

            <div className="mt-4">
              <label htmlFor={`${id}_modal`} className="label-text">
                {label}
              </label>
              <input
                id={`${id}_modal`}
                type="text"
                className="input-field"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={placeholder || `${label} likhein...`}
                autoComplete="off"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddName();
                  }
                }}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={closeAddModal} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="button" onClick={handleAddName} className="btn-primary flex-1">
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
