"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SERIES as SEED_SERIES } from "@/domain/catalogue";
import type { Design, Series } from "@/domain/types";
import { defaultSettings, mergeSettings, type AppSettings } from "@/lib/settings";

export interface Customer { id: string; name: string; contact?: string; phone?: string; email?: string; address?: string; }
export interface Site { id: string; customerId: string; customerName?: string; name: string; address?: string; notes?: string; createdAt?: string; }
export interface Opening { id: string; siteId: string; customerId?: string; reference: string; location?: string; width: number; height: number; notes?: string; createdAt?: string; }

export interface QuoteLine { design: Design; description: string; unitPrice: number; quantity: number; lineTotal: number; openingId?: string; }
export interface SavedQuote {
  id: string; number: string; customerId?: string; customerName?: string; siteId?: string; siteName?: string;
  status: "draft" | "sent" | "won" | "lost"; createdAt: string; vatRate: number; discount: number;
  lines: QuoteLine[]; net: number; vat: number; total: number; notes?: string;
}

export type OrderStatus = "confirmed" | "in_production" | "ready" | "installed" | "closed";
export interface Order {
  id: string; number: string; quoteId?: string; quoteNumber?: string; customerId?: string; customerName?: string; siteId?: string; siteName?: string;
  status: OrderStatus; lines: QuoteLine[]; net: number; vat: number; total: number; dueDate?: string; notes?: string; createdAt: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";
export interface Invoice {
  id: string; number: string; orderId?: string; orderNumber?: string; quoteId?: string; quoteNumber?: string;
  customerId?: string; customerName?: string; status: InvoiceStatus; lines: QuoteLine[]; net: number; vat: number; total: number;
  dueDate?: string; paidAt?: string; notes?: string; createdAt: string;
}

export interface InventoryItem { id: string; sku: string; name: string; category: string; unit: string; qty: number; minQty: number; cost: number; notes?: string; }
export interface PurchaseItem { sku: string; name: string; qty: number; unitCost: number; lineTotal: number; }
export interface Purchase { id: string; number: string; supplier: string; status: "draft" | "ordered" | "received" | "cancelled"; items: PurchaseItem[]; total: number; notes?: string; createdAt: string; receivedAt?: string; }

export interface PredefinedDesign { id: string; name: string; design: Design; createdAt: string; }

export interface StoreState {
  customers: Customer[]; quotes: SavedQuote[]; predefined: PredefinedDesign[]; sites: Site[]; openings: Opening[];
  orders: Order[]; invoices: Invoice[]; inventory: InventoryItem[]; purchases: Purchase[];
  series: Series[]; settings: AppSettings; loading: boolean; error?: string;
}

interface StoreCtx extends StoreState {
  refresh: () => Promise<void>;
  addCustomer: (c: Omit<Customer, "id">) => Promise<Customer>;
  saveQuote: (q: Omit<SavedQuote, "id" | "number" | "createdAt">) => Promise<SavedQuote>;
  updateQuoteStatus: (id: string, status: SavedQuote["status"]) => Promise<void>;
  removeQuote: (id: string) => Promise<void>;
  savePredefined: (name: string, design: Design) => Promise<PredefinedDesign>;
  removePredefined: (id: string) => Promise<void>;
  addSite: (s: Omit<Site, "id" | "createdAt">) => Promise<Site>;
  removeSite: (id: string) => Promise<void>;
  addOpening: (o: Omit<Opening, "id" | "createdAt">) => Promise<Opening>;
  removeOpening: (id: string) => Promise<void>;
  createOrderFromQuote: (quoteId: string) => Promise<Order>;
  updateOrder: (id: string, patch: Partial<Order>) => Promise<Order>;
  createInvoiceFromOrder: (orderId: string) => Promise<Invoice>;
  createInvoiceFromQuote: (quoteId: string) => Promise<Invoice>;
  updateInvoice: (id: string, patch: Partial<Invoice>) => Promise<Invoice>;
  saveInventoryItem: (item: Omit<InventoryItem, "id"> & { id?: string }) => Promise<InventoryItem>;
  removeInventoryItem: (id: string) => Promise<void>;
  savePurchase: (p: Omit<Purchase, "id" | "number" | "createdAt"> & { id?: string; number?: string }) => Promise<Purchase>;
  updatePurchase: (id: string, patch: Partial<Purchase>) => Promise<Purchase>;
  saveSettings: (s: AppSettings) => Promise<AppSettings>;
}

const Ctx = createContext<StoreCtx | null>(null);

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) throw new Error(json?.error || `Request failed (${res.status})`);
  return json as T;
}

const empty: Omit<StoreState, "series" | "loading" | "settings"> = { customers: [], quotes: [], predefined: [], sites: [], openings: [], orders: [], invoices: [], inventory: [], purchases: [], error: undefined };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>({ ...empty, series: SEED_SERIES, settings: defaultSettings, loading: true });

  async function refresh() {
    try {
      const data = await api<any>("/api/store");
      setState((s) => ({ ...s, ...empty, customers: data.customers||[], quotes: data.quotes||[], predefined: data.predefined||[], sites: data.sites||[], openings: data.openings||[], orders: data.orders||[], invoices: data.invoices||[], inventory: data.inventory||[], purchases: data.purchases||[], settings: mergeSettings(data.settings), loading: false, error: undefined }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load data" }));
    }
  }

  useEffect(() => { refresh(); }, []);

  function upsert<T extends { id: string }>(arr: T[], item: T) { return [item, ...arr.filter((x) => x.id !== item.id)]; }

  const value = useMemo<StoreCtx>(() => ({
    ...state,
    refresh,
    async addCustomer(c) { const r = await api<any>("/api/store/customers", { method: "POST", body: JSON.stringify(c) }); const item = r.customer || r.item; setState(s=>({...s, customers: upsert(s.customers,item)})); return item; },
    async saveQuote(q) { const r = await api<any>("/api/store/quotes", { method: "POST", body: JSON.stringify(q) }); const item = r.quote || r.item; setState(s=>({...s, quotes: upsert(s.quotes,item)})); return item; },
    async updateQuoteStatus(id, status) { const r = await api<any>(`/api/store/quotes/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); const item = r.quote || r.item; setState(s=>({...s, quotes: s.quotes.map(q=>q.id===id?item:q)})); },
    async removeQuote(id) { await api(`/api/store/quotes/${id}`, { method: "DELETE" }); setState(s=>({...s, quotes: s.quotes.filter(q=>q.id!==id)})); },
    async savePredefined(name, design) { const r = await api<any>("/api/store/predefined", { method: "POST", body: JSON.stringify({ name, design }) }); const item = r.predefined || r.item; setState(s=>({...s, predefined: upsert(s.predefined,item)})); return item; },
    async removePredefined(id) { await api(`/api/store/predefined/${id}`, { method: "DELETE" }); setState(s=>({...s, predefined: s.predefined.filter(p=>p.id!==id)})); },
    async addSite(s0) { const r = await api<any>("/api/store/sites", { method: "POST", body: JSON.stringify(s0) }); setState(s=>({...s, sites: upsert(s.sites, r.item)})); return r.item; },
    async removeSite(id) { await api(`/api/store/sites/${id}`, { method: "DELETE" }); setState(s=>({...s, sites: s.sites.filter(x=>x.id!==id), openings: s.openings.filter(o=>o.siteId!==id)})); },
    async addOpening(o0) { const r = await api<any>("/api/store/openings", { method: "POST", body: JSON.stringify(o0) }); setState(s=>({...s, openings: upsert(s.openings, r.item)})); return r.item; },
    async removeOpening(id) { await api(`/api/store/openings/${id}`, { method: "DELETE" }); setState(s=>({...s, openings: s.openings.filter(x=>x.id!==id)})); },
    async createOrderFromQuote(quoteId) {
      const q = state.quotes.find(x=>x.id===quoteId); if(!q) throw new Error("Quote not found");
      const r = await api<any>("/api/store/orders", { method: "POST", body: JSON.stringify({ quoteId: q.id, quoteNumber: q.number, customerId: q.customerId, customerName: q.customerName, siteId: q.siteId, siteName: q.siteName, status: "confirmed", lines: q.lines, net: q.net, vat: q.vat, total: q.total, notes: q.notes }) });
      await api(`/api/store/quotes/${q.id}`, { method: "PATCH", body: JSON.stringify({ status: "won" }) });
      setState(s=>({...s, orders: upsert(s.orders, r.item), quotes: s.quotes.map(x=>x.id===q.id?{...x,status:"won"}:x)}));
      return r.item;
    },
    async updateOrder(id, patch) { const r = await api<any>(`/api/store/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); setState(s=>({...s, orders: s.orders.map(o=>o.id===id?r.item:o)})); return r.item; },
    async createInvoiceFromOrder(orderId) {
      const o = state.orders.find(x=>x.id===orderId); if(!o) throw new Error("Order not found");
      const r = await api<any>("/api/store/invoices", { method: "POST", body: JSON.stringify({ orderId: o.id, orderNumber: o.number, quoteId: o.quoteId, quoteNumber: o.quoteNumber, customerId: o.customerId, customerName: o.customerName, status: "draft", lines: o.lines, net: o.net, vat: o.vat, total: o.total }) });
      setState(s=>({...s, invoices: upsert(s.invoices, r.item)})); return r.item;
    },
    async createInvoiceFromQuote(quoteId) {
      const q = state.quotes.find(x=>x.id===quoteId); if(!q) throw new Error("Quote not found");
      const r = await api<any>("/api/store/invoices", { method: "POST", body: JSON.stringify({ quoteId: q.id, quoteNumber: q.number, customerId: q.customerId, customerName: q.customerName, status: "draft", lines: q.lines, net: q.net, vat: q.vat, total: q.total }) });
      setState(s=>({...s, invoices: upsert(s.invoices, r.item)})); return r.item;
    },
    async updateInvoice(id, patch) { const r = await api<any>(`/api/store/invoices/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); setState(s=>({...s, invoices: s.invoices.map(i=>i.id===id?r.item:i)})); return r.item; },
    async saveInventoryItem(item) {
      if (item.id) { const r = await api<any>(`/api/store/inventory/${item.id}`, { method: "PATCH", body: JSON.stringify(item) }); setState(s=>({...s, inventory: upsert(s.inventory, r.item)})); return r.item; }
      const r = await api<any>("/api/store/inventory", { method: "POST", body: JSON.stringify(item) }); setState(s=>({...s, inventory: upsert(s.inventory, r.item)})); return r.item;
    },
    async removeInventoryItem(id) { await api(`/api/store/inventory/${id}`, { method: "DELETE" }); setState(s=>({...s, inventory: s.inventory.filter(x=>x.id!==id)})); },
    async savePurchase(p) { const r = await api<any>("/api/store/purchases", { method: "POST", body: JSON.stringify(p) }); setState(s=>({...s, purchases: upsert(s.purchases, r.item)})); return r.item; },
    async updatePurchase(id, patch) { const r = await api<any>(`/api/store/purchases/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); setState(s=>({...s, purchases: s.purchases.map(x=>x.id===id?r.item:x)})); return r.item; },
    async saveSettings(newSettings) { const r = await api<any>("/api/settings", { method: "PUT", body: JSON.stringify(newSettings) }); const merged = mergeSettings(r.settings || newSettings); setState(s=>({...s, settings: merged })); return merged; },
  }), [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}
