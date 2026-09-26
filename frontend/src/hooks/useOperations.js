import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";

export function useOperations(type) {
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetch = useCallback(() => {
        setLoading(true);
        api.get(`/operations/?type=${type}`)
            .then(({ data }) => setOperations(data))
            .catch(() => setOperations(DEMO_OPS[type] || []))
            .finally(() => setLoading(false));
    }, [type]);

    useEffect(() => { fetch(); }, [fetch]);

    return { operations, loading, error, refetch: fetch };
}

export function useProducts() {
    const [products, setProducts] = useState([]);
    useEffect(() => {
        api.get("/products/")
            .then(({ data }) => setProducts(data))
            .catch(() => setProducts(DEMO_PRODUCTS));
    }, []);
    return products;
}

// ── Demo data (used when backend is offline) ──────────────────────────────

const DEMO_PRODUCTS = [
    { id: 1, sku: "SKU-001", name: "Widget A", uom: "Units", on_hand: 50, free_to_use: 40 },
    { id: 2, sku: "SKU-002", name: "Gadget B", uom: "Units", on_hand: 0, free_to_use: 0 },
    { id: 3, sku: "SKU-003", name: "Part C", uom: "Units", on_hand: 20, free_to_use: 15 },
];

const DEMO_OPS = {
    IN: [
        { id: 1, reference: "WH/IN/0001", type: "IN", status: "Ready", partner_name: "Acme Supplies", scheduled_date: "2026-03-10T00:00:00Z", responsible_id: 1, stock_moves: [] },
        { id: 2, reference: "WH/IN/0002", type: "IN", status: "Waiting", partner_name: "Global Parts", scheduled_date: "2026-03-15T00:00:00Z", responsible_id: 1, stock_moves: [] },
        { id: 3, reference: "WH/IN/0003", type: "IN", status: "Draft", partner_name: "FastShip Co", scheduled_date: "2026-03-20T00:00:00Z", responsible_id: 1, stock_moves: [] },
        { id: 4, reference: "WH/IN/0004", type: "IN", status: "Done", partner_name: "Acme Supplies", scheduled_date: "2026-03-05T00:00:00Z", responsible_id: 1, stock_moves: [] },
    ],
    OUT: [
        { id: 5, reference: "WH/OUT/0001", type: "OUT", status: "Ready", partner_name: "Client Alpha", scheduled_date: "2026-03-10T00:00:00Z", responsible_id: 1, stock_moves: [] },
        { id: 6, reference: "WH/OUT/0002", type: "OUT", status: "Waiting", partner_name: "Client Beta", scheduled_date: "2026-03-12T00:00:00Z", responsible_id: 1, stock_moves: [] },
        { id: 7, reference: "WH/OUT/0003", type: "OUT", status: "Draft", partner_name: "Client Gamma", scheduled_date: "2026-03-22T00:00:00Z", responsible_id: 1, stock_moves: [] },
        { id: 8, reference: "WH/OUT/0004", type: "OUT", status: "Done", partner_name: "Client Alpha", scheduled_date: "2026-03-01T00:00:00Z", responsible_id: 1, stock_moves: [] },
    ],
};
