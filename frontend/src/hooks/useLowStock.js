import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";

// Shared low-stock state — polled every 60 s
let _cache = { count: 0, items: [], ts: 0 };
const _listeners = new Set();

function notify() { _listeners.forEach((fn) => fn({ ..._cache })); }

async function fetchLowStock() {
    try {
        const { data } = await api.get("/reports/low-stock");
        _cache = { count: data.length, items: data, ts: Date.now() };
        notify();
    } catch {
        // silently ignore when backend is offline
    }
}

// Start polling once
let _started = false;
function startPolling() {
    if (_started) return;
    _started = true;
    fetchLowStock();
    setInterval(fetchLowStock, 60_000);
}

export function useLowStock() {
    const [state, setState] = useState({ count: _cache.count, items: _cache.items });

    useEffect(() => {
        startPolling();
        _listeners.add(setState);
        return () => _listeners.delete(setState);
    }, []);

    const refresh = useCallback(fetchLowStock, []);
    return { ...state, refresh };
}
