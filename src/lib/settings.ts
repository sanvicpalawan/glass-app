export interface AppSettings {
  company: {
    name: string;
    logoUrl: string; // data URL or external URL
    address: string;
    phone: string;
    email: string;
    website: string;
    license: string;
    footerText: string;
  };
  quote: {
    prefix: string;
    nextNumber: number;
    validityDays: number;
    defaultNotes: string;
    terms: string;
    showRo: boolean;
    showGlass: boolean;
    showHardware: boolean;
    showSignature: boolean;
  };
  invoice: {
    prefix: string;
    nextNumber: number;
    dueDays: number;
    paymentTerms: string;
    bankDetails: string;
    depositPercent: number;
    lateFeeText: string;
    taxLabel: string;
    taxRate: number;
  };
  pricing: {
    currency: string;
    currencySymbol: string;
    defaultMargin: number;
    defaultDiscount: number;
    units: "mm" | "inch";
    rounding: number; // 0 = none, 1 = nearest 1, 10, 100 etc
  };
  documents: {
    showLogoOnDocs: boolean;
    headerStyle: "standard" | "compact";
    footerLegal: string;
    accentColor: string;
  };
  email: {
    fromName: string;
    fromEmail: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpSecure: boolean;
    quoteSubject: string;
    invoiceSubject: string;
  };
  production: {
    stockBarLength: number;
    kerf: number;
    labelShowBarcode: boolean;
    labelShowGlass: boolean;
  };
  catalogue: {
    defaultMaterial: string;
    defaultSeriesId: string;
    defaultGlass: string;
    defaultHardware: string;
    leadTimeDays: number;
  };
}

export const defaultSettings: AppSettings = {
  company: {
    name: "Fenestra",
    logoUrl: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    license: "",
    footerText: "Window & door quoting and production.",
  },
  quote: {
    prefix: "Q",
    nextNumber: 1001,
    validityDays: 30,
    defaultNotes: "",
    terms: "Prices exclude delivery and installation unless stated. 50% deposit to confirm, balance on completion. Lead time subject to material availability.",
    showRo: true,
    showGlass: true,
    showHardware: true,
    showSignature: true,
  },
  invoice: {
    prefix: "INV",
    nextNumber: 1001,
    dueDays: 30,
    paymentTerms: "Payment due within 30 days.",
    bankDetails: "",
    depositPercent: 50,
    lateFeeText: "",
    taxLabel: "VAT",
    taxRate: 12,
  },
  pricing: {
    currency: "PHP",
    currencySymbol: "₱",
    defaultMargin: 35,
    defaultDiscount: 0,
    units: "mm",
    rounding: 0,
  },
  documents: {
    showLogoOnDocs: true,
    headerStyle: "standard",
    footerLegal: "This is a system-generated document.",
    accentColor: "#e8a33d",
  },
  email: {
    fromName: "",
    fromEmail: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: false,
    quoteSubject: "Quotation {{number}} from {{company}}",
    invoiceSubject: "Invoice {{number}} from {{company}}",
  },
  production: {
    stockBarLength: 6000,
    kerf: 3,
    labelShowBarcode: true,
    labelShowGlass: true,
  },
  catalogue: {
    defaultMaterial: "aluminum",
    defaultSeriesId: "alu-sld-70",
    defaultGlass: "lam",
    defaultHardware: "std",
    leadTimeDays: 14,
  },
};

function coerce(base: any, val: any): any {
  if (typeof base === "number") {
    if (val === "" || val == null) return base;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : base;
  }
  if (typeof base === "boolean") return typeof val === "boolean" ? val : base;
  if (typeof base === "string") return val == null ? base : String(val);
  return val == null ? base : val;
}

function mergeSection<T extends object>(base: T, over: any): T {
  const src = over && typeof over === "object" ? over : {};
  const out: any = { ...base };
  for (const k of Object.keys(base as any)) out[k] = coerce((base as any)[k], src[k]);
  return out as T;
}

export function mergeSettings(partial: any): AppSettings {
  const d = defaultSettings;
  const p = partial || {};
  return {
    company: mergeSection(d.company, p.company),
    quote: mergeSection(d.quote, p.quote),
    invoice: mergeSection(d.invoice, p.invoice),
    pricing: mergeSection(d.pricing, p.pricing),
    documents: mergeSection(d.documents, p.documents),
    email: mergeSection(d.email, p.email),
    production: mergeSection(d.production, p.production),
    catalogue: mergeSection(d.catalogue, p.catalogue),
  };
}
