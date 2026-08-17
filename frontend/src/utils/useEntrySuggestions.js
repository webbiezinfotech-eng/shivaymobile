import { useEffect, useState } from 'react';
import { getEntrySuggestions } from '../services/entryService';

export function useEntrySuggestions() {
  const [customers, setCustomers] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getEntrySuggestions()
      .then((data) => {
        if (!active) return;
        setCustomers(data.customers || []);
        setSources(data.sources || []);
      })
      .catch(() => {
        if (!active) return;
        setCustomers([]);
        setSources([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { customers, sources, loading };
}
