import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAllCachedSearchNames,
  getCachedNamesForType,
  getNoAutocompleteInputProps,
  loadSavedNames,
  normalizeNames,
  savePickerName,
  setupSavedNamesAutoRefresh,
} from '../../utils/savedNames';

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getOptionsForType(data, nameType) {
  if (nameType === 'all') {
    return normalizeNames([...data.customers, ...data.sources]);
  }
  return nameType === 'source' ? data.sources : data.customers;
}

export default function SavedNameDropdownField({
  id,
  name,
  label,
  value,
  onChange,
  nameType = 'customer',
  placeholder = '',
  error = '',
  showAddButton = false,
}) {
  const rootRef = useRef(null);
  const listId = `${id}-dropdown-list`;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedOptions, setSavedOptions] = useState(() => (
    nameType === 'all' ? getAllCachedSearchNames() : getCachedNamesForType(nameType)
  ));
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [saveError, setSaveError] = useState('');

  const refreshOptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadSavedNames();
      setSavedOptions(getOptionsForType(data, nameType));
    } catch {
      setSavedOptions([]);
    } finally {
      setLoading(false);
    }
  }, [nameType]);

  useEffect(() => {
    refreshOptions();
    return setupSavedNamesAutoRefresh((data) => {
      setSavedOptions(getOptionsForType(data, nameType));
    });
  }, [nameType, refreshOptions]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return savedOptions;
    return savedOptions.filter((option) => option.toLowerCase().includes(query));
  }, [savedOptions, value]);

  const openDropdown = async () => {
    setOpen(true);
    await refreshOptions();
  };

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setOpen(false);
  };

  const openAddModal = () => {
    setNewName(value.trim());
    setSaveError('');
    setShowAddModal(true);
    setOpen(false);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewName('');
    setSaveError('');
  };

  const handleAddName = async () => {
    const trimmed = newName.trim();
    if (!trimmed || savingName || nameType === 'all') return;

    setSavingName(true);
    setSaveError('');

    try {
      const savedName = await savePickerName(nameType, trimmed);
      await refreshOptions();
      onChange({ target: { name, value: savedName || trimmed } });
      closeAddModal();
    } catch (err) {
      setSaveError(err?.message || 'Unable to save name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const noAutocompleteProps = getNoAutocompleteInputProps({ id, storageKey: nameType });

  return (
    <>
      <div ref={rootRef}>
        <label htmlFor={id} className="label-text">
          {label}
        </label>

        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <div
              className={`flex overflow-hidden rounded-xl border bg-white shadow-sm ${
                open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-300'
              }`}
            >
              <input
                {...noAutocompleteProps}
                type="text"
                className="min-h-[46px] flex-1 border-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:ring-0"
                value={value}
                placeholder={placeholder}
                aria-expanded={open}
                aria-controls={listId}
                onChange={(event) => {
                  onChange({ target: { name, value: event.target.value } });
                  setOpen(true);
                }}
                onFocus={openDropdown}
                onClick={openDropdown}
              />
              <button
                type="button"
                className="flex min-h-[46px] w-11 shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 hover:bg-slate-100"
                aria-label={`Open ${label} dropdown`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={openDropdown}
              >
                <ChevronIcon open={open} />
              </button>
            </div>

            {open && (
              <div
                id={listId}
                className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-xl"
              >
                <div className="max-h-56 overflow-y-auto">
                  {loading && (
                    <p className="px-4 py-3 text-sm text-slate-500">Loading names...</p>
                  )}
                  {!loading && filteredOptions.length === 0 && (
                    <p className="px-4 py-3 text-sm text-slate-500">
                      {savedOptions.length === 0
                        ? 'Koi saved name nahi hai. Pehle + se naam save karein.'
                        : 'Koi match nahi mila.'}
                    </p>
                  )}
                  {!loading && filteredOptions.map((option) => {
                    const selected = option.toLowerCase() === value.trim().toLowerCase();
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
                          selected
                            ? 'bg-brand-50 font-semibold text-brand-800'
                            : 'text-slate-800 hover:bg-slate-50'
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelect(option)}
                      >
                        <span>{option}</span>
                        {selected && <span className="text-xs text-brand-700">Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {showAddButton && nameType !== 'all' && (
            <button
              type="button"
              onClick={openAddModal}
              className="btn-secondary min-h-[46px] w-12 shrink-0 px-0 text-xl font-bold leading-none"
              aria-label={`Add new ${label}`}
            >
              +
            </button>
          )}
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
              Save karne ke baad yeh naam web aur mobile dono par dikhega.
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
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddName();
                  }
                }}
              />
            </div>

            {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={closeAddModal} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="button" onClick={handleAddName} disabled={savingName} className="btn-primary flex-1">
                {savingName ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
