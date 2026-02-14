import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";

// ─── i18n ────────────────────────────────────────────────────────────────────
const T = {
  en: {
    badge1: "BOX 3",
    badge2: "36% UNREALIZED GAINS",
    title: "Dutch Wealth Tax Impact Simulator",
    subtitle: "Passed Feb 12, 2026 — effective Jan 2028. Compare your portfolio growth with and without the 36% annual tax on unrealized gains.",
    toggleExplain: "explanation on compounding impact",
    hide: "Hide",
    show: "Show",
    explainTitle: "How the 36% unrealized gains tax destroys compounding",
    explainP1: "Compound interest is often called the eighth wonder of the world. The core mechanism is simple: your gains generate their own gains. A \u20AC10,000 investment growing at 10% becomes \u20AC10,000 \u2192 \u20AC11,000 \u2192 \u20AC12,100 \u2192 \u20AC13,310. That extra \u20AC310 in year 3 exists solely because your earlier gains were reinvested.",
    explainP2_pre: "The Dutch Box 3 reform, passed on February 12, 2026, introduces a 36% annual tax on ",
    explainP2_em: "unrealized",
    explainP2_post: " gains \u2014 meaning you owe tax on paper profits even without selling. Each year, 36% of your gains are effectively removed from your compounding base. Instead of \u20AC11,000 rolling over to generate next year\u2019s returns, only \u20AC10,640 does (\u20AC1,000 gain minus \u20AC360 tax).",
    explainP3_pre: "This creates a ",
    explainP3_em: "compounding penalty",
    explainP3_post: " that grows exponentially over time. In year 1, the damage might be just a few hundred euros. But by year 7, 10, or 20, the gap between taxed and untaxed portfolios widens dramatically \u2014 because every year you\u2019re compounding on a smaller base, and that smaller base compounds into an even smaller amount the next year.",
    volTitle: "\u26A0 The volatility trap: you pay tax on gains you never keep",
    volText_pre: "For volatile assets like Bitcoin, this tax is uniquely destructive. Select Bitcoin in the simulator above and watch what happens. In 2020, Bitcoin returned +303%. The government takes 36% of that gain \u2014 in cash, immediately. Then in 2022, Bitcoin crashes \u221264%. You\u2019ve now lost most of your portfolio value, but the tax you paid in 2020 is gone forever. You paid real money on paper wealth that evaporated. Losses can technically be carried forward, but only amounts above \u20AC500 and only against future gains that may never come. The system is fundamentally asymmetric: the government always collects in good years, but never gives back in bad years. Over a full boom-bust cycle, you can end up with ",
    volText_em: "less money than you started with",
    volText_post: " while having paid thousands in taxes on \"gains\" that no longer exist.",
    compTitle: "\uD83D\uDCB8 The real cost: decades of stolen compounding",
    compText_pre: "What makes this tax so devastating is not the 36% rate itself \u2014 it\u2019s ",
    compText_em: "when",
    compText_post: " it\u2019s applied. A capital gains tax at sale lets your full portfolio compound untouched for 10, 20, or 30 years. You pay once, at the end. This tax bleeds your portfolio every single year. Run the simulator for 21 years and look at the gap. With the S&P 500, the tax drag can consume 20\u201330% of your total portfolio value. With Bitcoin, it can be even worse. This is not a 36% tax on your returns \u2014 because it interrupts compounding year after year, the effective lifetime cost is far higher. Every euro taken out in year 3 is a euro that can never generate returns in year 4, 5, 6, and beyond. Over a working lifetime of investing, this mechanism can destroy a third to half of the wealth an ordinary Dutch citizen would have built. The government isn\u2019t just taxing your gains \u2014 it\u2019s taxing your future.",
    note: "Note: This simulator uses actual historical yearly returns from 2018\u20132024. S&P 500 returns are converted from USD to EUR using end-of-year exchange rates. The AEX data reflects price returns only (excluding dividends). For simulations beyond 7 years, the return sequence repeats. The tax-free threshold (\u20AC57,684) and loss carry-forward are not modeled for simplicity.",
    labelAsset: "Asset",
    labelInitial: "Initial (\u20AC)",
    labelStrategy: "Strategy",
    labelMonthly: "Monthly (\u20AC)",
    labelFrequency: "Frequency",
    labelYears: "Years",
    lumpSum: "Lump sum",
    dca: "DCA",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    yearSuffix: "y",
    returnsUsed: "Returns used:",
    avg: "avg",
    totalInvested: "Total Invested",
    withoutTax: "Without Tax",
    withTax: "With 36% Tax",
    taxDrag: "Tax Drag",
    ofPortfolio: "of portfolio destroyed",
    total: "total",
    chartTitle: "Portfolio Growth Comparison",
    gapChartTitle: "Tax Drag Over Time",
    absLabel: "Absolute (\u20AC)",
    pctLabel: "Percentage (%)",
    tableTitle: "Year-by-Year Breakdown",
    thYear: "Year", thReturn: "Return", thNoTax: "No Tax", thWithTax: "With Tax", thGap: "Gap (\u20AC)", thGapPct: "Gap (%)",
    tooltipYear: "Year", tooltipGap: "Gap", tooltipLost: "Lost",
    noTax: "No Tax", withTaxLabel: "With 36% Tax",
    yearPrefix: "Y",
    footer1: "Data: S&P 500 total returns (Slickcharts) converted to EUR \u00B7 AEX price returns (1stock1) \u00B7 Bitcoin (Slickcharts)",
    footer2: "EUR/USD approximate end-of-year rates. Tax-free threshold (\u20AC57,684) and loss carry-forward not modeled for simplicity.",
    footer3: "Simulations beyond 7 years repeat the 2018\u20132024 return sequence. This is for educational purposes only."
  },
  nl: {
    badge1: "BOX 3",
    badge2: "36% ONGEREALISEERDE WINST",
    title: "Nederlandse Vermogensbelasting Simulator",
    subtitle: "Aangenomen 12 feb 2026 \u2014 ingaand jan 2028. Vergelijk je portefeuillegroei met en zonder de jaarlijkse 36% belasting op ongerealiseerde winst.",
    toggleExplain: "uitleg over het samengesteld-rendement effect",
    hide: "Verberg",
    show: "Toon",
    explainTitle: "Hoe de 36% belasting op ongerealiseerde winst samengesteld rendement vernietigt",
    explainP1: "Samengesteld rendement wordt vaak het achtste wereldwonder genoemd. Het mechanisme is simpel: je winst genereert zelf weer winst. Een investering van \u20AC10.000 die 10% groeit wordt \u20AC10.000 \u2192 \u20AC11.000 \u2192 \u20AC12.100 \u2192 \u20AC13.310. Die extra \u20AC310 in jaar 3 bestaat puur omdat eerdere winsten werden herbelegd.",
    explainP2_pre: "De Nederlandse Box 3-hervorming, aangenomen op 12 februari 2026, introduceert een jaarlijkse belasting van 36% op ",
    explainP2_em: "ongerealiseerde",
    explainP2_post: " winsten \u2014 wat betekent dat je belasting verschuldigd bent over papieren winst, zelfs zonder te verkopen. Elk jaar wordt 36% van je winst effectief uit je samengestelde basis verwijderd. In plaats van \u20AC11.000 die doorgroeit voor volgend jaar, doet slechts \u20AC10.640 dat (\u20AC1.000 winst minus \u20AC360 belasting).",
    explainP3_pre: "Dit cre\u00EBert een ",
    explainP3_em: "samengesteld-rendement straf",
    explainP3_post: " die exponentieel groeit over de tijd. In jaar 1 is de schade misschien slechts een paar honderd euro. Maar tegen jaar 7, 10 of 20 wordt het gat tussen belaste en onbelaste portefeuilles dramatisch groter \u2014 omdat je elk jaar samengesteld rendement opbouwt op een kleinere basis, en die kleinere basis het jaar daarna weer tot een nog kleiner bedrag leidt.",
    volTitle: "\u26A0 De volatiliteitsval: je betaalt belasting over winst die je nooit houdt",
    volText_pre: "Voor volatiele activa zoals Bitcoin is deze belasting uniek destructief. Selecteer Bitcoin in de simulator hierboven en kijk wat er gebeurt. In 2020 leverde Bitcoin +303% rendement op. De overheid neemt 36% van die winst \u2014 in contanten, direct. Dan crasht Bitcoin in 2022 met \u221264%. Je hebt nu het grootste deel van je portefeuillewaarde verloren, maar de belasting die je in 2020 betaalde is voor altijd weg. Je betaalde echt geld over papieren winst die verdampt is. Verliezen kunnen technisch gezien worden doorgeschoven, maar alleen bedragen boven \u20AC500 en alleen tegen toekomstige winsten die misschien nooit komen. Het systeem is fundamenteel asymmetrisch: de overheid int altijd in goede jaren, maar geeft nooit terug in slechte jaren. Over een volledige boom-bust cyclus kun je eindigen met ",
    volText_em: "minder geld dan waarmee je begon",
    volText_post: " terwijl je duizenden aan belasting hebt betaald over \"winsten\" die niet meer bestaan.",
    compTitle: "\uD83D\uDCB8 De werkelijke kosten: decennia aan gestolen samengesteld rendement",
    compText_pre: "Wat deze belasting zo verwoestend maakt is niet het tarief van 36% zelf \u2014 het is ",
    compText_em: "wanneer",
    compText_post: " het wordt toegepast. Een vermogenswinstbelasting bij verkoop laat je volledige portefeuille 10, 20 of 30 jaar ongestoord groeien. Je betaalt \u00E9\u00E9n keer, aan het eind. Deze belasting bloedt je portefeuille elk jaar leeg. Laat de simulator 21 jaar draaien en bekijk het gat. Met de S&P 500 kan de belastingdruk 20-30% van je totale portefeuillewaarde opslokken. Met Bitcoin kan het nog erger zijn. Dit is geen 36% belasting op je rendement \u2014 omdat het samengesteld rendement jaar na jaar onderbreekt, zijn de effectieve levenslange kosten veel hoger. Elke euro die in jaar 3 wordt afgenomen is een euro die nooit meer rendement kan opleveren in jaar 4, 5, 6 en daarna. Over een werkend leven van beleggen kan dit mechanisme een derde tot de helft van het vermogen vernietigen dat een gewone Nederlandse burger zou hebben opgebouwd. De overheid belast niet alleen je winst \u2014 ze belast je toekomst.",
    note: "Let op: deze simulator gebruikt werkelijke historische jaarrendementen van 2018\u20132024. S&P 500-rendementen zijn omgerekend van USD naar EUR met eindejaarskoersen. De AEX-data betreft alleen koersrendementen (exclusief dividenden). Voor simulaties langer dan 7 jaar wordt de rendementsreeks herhaald. De belastingvrije drempel (\u20AC57.684) en verliesverrekening zijn niet gemodelleerd.",
    labelAsset: "Belegging",
    labelInitial: "Startbedrag (\u20AC)",
    labelStrategy: "Strategie",
    labelMonthly: "Maandelijks (\u20AC)",
    labelFrequency: "Frequentie",
    labelYears: "Jaren",
    lumpSum: "Eenmalig",
    dca: "DCA",
    monthly: "Maandelijks",
    quarterly: "Per kwartaal",
    yearly: "Jaarlijks",
    yearSuffix: "j",
    returnsUsed: "Gebruikte rendementen:",
    avg: "gem",
    totalInvested: "Totaal Ingelegd",
    withoutTax: "Zonder Belasting",
    withTax: "Met 36% Belasting",
    taxDrag: "Belastingdruk",
    ofPortfolio: "van portefeuille vernietigd",
    total: "totaal",
    chartTitle: "Portefeuillegroei Vergelijking",
    gapChartTitle: "Belastingdruk Over de Tijd",
    absLabel: "Absoluut (\u20AC)",
    pctLabel: "Percentage (%)",
    tableTitle: "Jaar-voor-Jaar Overzicht",
    thYear: "Jaar", thReturn: "Rendement", thNoTax: "Zonder", thWithTax: "Met Belasting", thGap: "Verschil (\u20AC)", thGapPct: "Verschil (%)",
    tooltipYear: "Jaar", tooltipGap: "Verschil", tooltipLost: "Verloren",
    noTax: "Zonder Belasting", withTaxLabel: "Met 36% Belasting",
    yearPrefix: "J",
    footer1: "Data: S&P 500 totaalrendement (Slickcharts) omgerekend naar EUR \u00B7 AEX koersrendement (1stock1) \u00B7 Bitcoin (Slickcharts)",
    footer2: "EUR/USD geschatte eindejaarskoersen. Belastingvrije drempel (\u20AC57.684) en verliesverrekening niet gemodelleerd.",
    footer3: "Simulaties langer dan 7 jaar herhalen de 2018\u20132024 rendementsreeks. Alleen voor educatieve doeleinden."
  }
};

// ─── Data ────────────────────────────────────────────────────────────────────
const HISTORICAL_DATA = {
  sp500_usd: { 2018: -4.38, 2019: 31.49, 2020: 18.40, 2021: 28.71, 2022: -18.11, 2023: 26.29, 2024: 25.02 },
  aex: { 2018: -10.41, 2019: 23.92, 2020: 3.31, 2021: 27.75, 2022: -13.65, 2023: 14.20, 2024: 11.67 },
  bitcoin: { 2018: -73.56, 2019: 92.20, 2020: 303.16, 2021: 59.67, 2022: -64.27, 2023: 155.42, 2024: 121.05 },
  eurusd: { 2017: 1.20, 2018: 1.145, 2019: 1.12, 2020: 1.22, 2021: 1.137, 2022: 1.07, 2023: 1.105, 2024: 1.04 }
};

function getSP500EurReturns() {
  const r = {};
  for (let y = 2018; y <= 2024; y++) {
    const u = HISTORICAL_DATA.sp500_usd[y] / 100;
    r[y] = ((1 + u) * (HISTORICAL_DATA.eurusd[y - 1] / HISTORICAL_DATA.eurusd[y]) - 1) * 100;
  }
  return r;
}
const SP500_EUR = getSP500EurReturns();

const ASSETS = {
  sp500_eur: { name: "S&P 500 (in EUR)", returns: SP500_EUR, color: "#FF6B35" },
  aex: { name: "AEX Amsterdam", returns: HISTORICAL_DATA.aex, color: "#004E89" },
  bitcoin: { name: "Bitcoin", returns: HISTORICAL_DATA.bitcoin, color: "#F7931A" }
};

const TAX_RATE = 0.36;

// ─── Simulation ──────────────────────────────────────────────────────────────
function simulate(init, mo, freq, assetKey, ySim) {
  const ret = ASSETS[assetKey].returns;
  const yk = Object.keys(ret).map(Number).sort();
  const dNT = [{ year: yk[0] - 1, value: init }];
  const dT = [{ year: yk[0] - 1, value: init }];
  let vNT = init, vT = init;
  const ppy = freq === "monthly" ? 12 : freq === "quarterly" ? 4 : 1;
  const cpp = mo * (freq === "monthly" ? 1 : freq === "quarterly" ? 3 : 12);
  const tac = mo * 12;
  const rs = Array.from({ length: ySim }, (_, i) => ret[yk[i % yk.length]] / 100);

  for (let i = 0; i < rs.length; i++) {
    const r = rs[i], sT = vT;
    if (ppy === 1) { vNT = vNT * (1 + r) + tac; vT = vT * (1 + r) + tac; }
    else { const pr = Math.pow(1 + r, 1 / ppy) - 1; for (let p = 0; p < ppy; p++) { vNT = (vNT + cpp) * (1 + pr); vT = (vT + cpp) * (1 + pr); } }
    const g = vT - sT - tac;
    if (g > 0) vT -= g * TAX_RATE;
    dNT.push({ year: i + 1, value: vNT });
    dT.push({ year: i + 1, value: vT });
  }
  return { dataNoTax: dNT, dataTax: dT };
}

function fmt(v) {
  if (v >= 1e6) return `\u20AC${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `\u20AC${(v / 1e3).toFixed(1)}K`;
  return `\u20AC${v.toFixed(0)}`;
}

// ─── Tooltips ────────────────────────────────────────────────────────────────
function TT1({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,15,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      <div style={{ color: "#aaa", marginBottom: 6 }}>{t.tooltipYear} {label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {fmt(p.value)}</div>)}
      {payload.length === 2 && <>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 6, paddingTop: 6, color: "#ef4444" }}>{t.tooltipGap}: {fmt(payload[0].value - payload[1].value)}</div>
        <div style={{ color: "#ef4444" }}>{t.tooltipLost}: {((1 - payload[1].value / payload[0].value) * 100).toFixed(1)}%</div>
      </>}
    </div>
  );
}

function TT2({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,15,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      <div style={{ color: "#aaa", marginBottom: 4 }}>{t.tooltipYear} {label}</div>
      <div style={{ color: "#F97316" }}>{t.tooltipGap}: {fmt(payload[0]?.value || 0)}</div>
      <div style={{ color: "#a855f7" }}>{t.tooltipLost}: {(payload[1]?.value || 0).toFixed(1)}%</div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("en");
  const [asset, setAsset] = useState("sp500_eur");
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [frequency, setFrequency] = useState("monthly");
  const [investmentType, setInvestmentType] = useState("dca");
  const [years, setYears] = useState(7);
  const [showInfo, setShowInfo] = useState(true);
  const t = T[lang];

  const result = useMemo(() => simulate(initial, investmentType === "lump" ? 0 : monthly, frequency, asset, years), [initial, monthly, frequency, asset, years, investmentType]);
  const chartData = useMemo(() => result.dataNoTax.map((d, i) => ({ year: d.year, noTax: Math.round(d.value), withTax: Math.round(result.dataTax[i].value), gap: Math.round(d.value - result.dataTax[i].value), gapPct: d.value > 0 ? (d.value - result.dataTax[i].value) / d.value * 100 : 0 })), [result]);

  const fNT = chartData.at(-1)?.noTax || 0, fWT = chartData.at(-1)?.withTax || 0, fG = fNT - fWT, fGP = fNT > 0 ? fG / fNT * 100 : 0;
  const tc = initial + (investmentType === "lump" ? 0 : monthly * 12 * years);
  const ar = ASSETS[asset].returns, yk = Object.keys(ar).map(Number).sort();
  const avgR = yk.reduce((s, y) => s + ar[y], 0) / yk.length;

  const inp = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#e0e0e0", padding: "8px 12px", fontSize: 14, width: "100%", outline: "none", fontFamily: "'JetBrains Mono', monospace" };
  const lbl = { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 };
  const B = (on) => ({ padding: "7px 14px", borderRadius: 6, border: on ? `1px solid ${ASSETS[asset].color}` : "1px solid rgba(255,255,255,0.1)", background: on ? ASSETS[asset].color + "22" : "transparent", color: on ? ASSETS[asset].color : "#888", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s" });
  const fm = { monthly: t.monthly, quarterly: t.quarterly, yearly: t.yearly };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0", fontFamily: "'Inter', -apple-system, sans-serif", padding: "24px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#ef4444", color: "white", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>{t.badge1}</div>
            <div style={{ background: "rgba(255,255,255,0.06)", color: "#888", fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>{t.badge2}</div>
          </div>
          <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden" }}>
            {["en", "nl"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", border: "none", cursor: "pointer", transition: "all 0.2s", background: lang === l ? "rgba(255,255,255,0.12)" : "transparent", color: lang === l ? "#e0e0e0" : "#555" }}>
                {l === "en" ? "\uD83C\uDDEC\uD83C\uDDE7 EN" : "\uD83C\uDDF3\uD83C\uDDF1 NL"}
              </button>
            ))}
          </div>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{t.title}</h1>
        <p style={{ color: "#666", fontSize: 14, margin: "8px 0 0 0", lineHeight: 1.5 }}>{t.subtitle}</p>

        <button onClick={() => setShowInfo(!showInfo)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontSize: 12, padding: "6px 14px", borderRadius: 6, cursor: "pointer", marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          {showInfo ? `\u25BE ${t.hide}` : `\u25B8 ${t.show}`} {t.toggleExplain}
        </button>

        {showInfo && (
          <div style={{ marginTop: 12, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, lineHeight: 1.7, color: "#bbb" }}>
            <h3 style={{ color: "#e0e0e0", fontSize: 15, margin: "0 0 10px 0" }}>{t.explainTitle}</h3>
            <p style={{ margin: "0 0 10px 0" }}>{t.explainP1}</p>
            <p style={{ margin: "0 0 10px 0" }}>{t.explainP2_pre}<strong style={{ color: "#ef4444" }}>{t.explainP2_em}</strong>{t.explainP2_post}</p>
            <p style={{ margin: "0 0 10px 0" }}>{t.explainP3_pre}<strong>{t.explainP3_em}</strong>{t.explainP3_post}</p>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 16, margin: "16px 0 10px 0" }}>
              <h4 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 8px 0", fontWeight: 700 }}>{t.volTitle}</h4>
              <p style={{ margin: 0 }}>{t.volText_pre}<strong style={{ color: "#ef4444" }}>{t.volText_em}</strong>{t.volText_post}</p>
            </div>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: 16, margin: "0 0 10px 0" }}>
              <h4 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 8px 0", fontWeight: 700 }}>{t.compTitle}</h4>
              <p style={{ margin: 0 }}>{t.compText_pre}<strong style={{ color: "#ef4444" }}>{t.compText_em}</strong>{t.compText_post}</p>
            </div>
            <p style={{ margin: 0, color: "#888", fontSize: 12, fontStyle: "italic" }}>{t.note}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>{t.labelAsset}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(ASSETS).map(([k, a]) => (
              <button key={k} onClick={() => setAsset(k)} style={{ ...B(asset === k), borderColor: asset === k ? a.color : "rgba(255,255,255,0.1)", color: asset === k ? a.color : "#888", background: asset === k ? a.color + "22" : "transparent" }}>{a.name}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <div><div style={lbl}>{t.labelInitial}</div><input type="number" value={initial} onChange={e => setInitial(Math.max(0, +e.target.value))} style={inp} /></div>
          <div><div style={lbl}>{t.labelStrategy}</div><div style={{ display: "flex", gap: 6 }}><button onClick={() => setInvestmentType("lump")} style={B(investmentType === "lump")}>{t.lumpSum}</button><button onClick={() => setInvestmentType("dca")} style={B(investmentType === "dca")}>{t.dca}</button></div></div>
          {investmentType === "dca" && <>
            <div><div style={lbl}>{t.labelMonthly}</div><input type="number" value={monthly} onChange={e => setMonthly(Math.max(0, +e.target.value))} style={inp} /></div>
            <div><div style={lbl}>{t.labelFrequency}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{["monthly", "quarterly", "yearly"].map(f => <button key={f} onClick={() => setFrequency(f)} style={B(frequency === f)}>{fm[f]}</button>)}</div></div>
          </>}
          <div><div style={lbl}>{t.labelYears}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[7, 14, 21].map(y => <button key={y} onClick={() => setYears(y)} style={B(years === y)}>{y}{t.yearSuffix}</button>)}</div></div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#666", fontFamily: "'JetBrains Mono', monospace" }}>{t.returnsUsed}</span>
          {yk.map(y => { const r = ar[y]; return <span key={y} style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: "2px 6px", borderRadius: 4, background: r >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: r >= 0 ? "#22c55e" : "#ef4444" }}>{y}: {r >= 0 ? "+" : ""}{r.toFixed(1)}%</span>; })}
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#aaa" }}>{t.avg}: {avgR >= 0 ? "+" : ""}{avgR.toFixed(1)}%</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { label: t.totalInvested, value: fmt(tc), bg: "rgba(255,255,255,0.03)", bc: "rgba(255,255,255,0.06)", c: "#e0e0e0", sub: null },
            { label: t.withoutTax, value: fmt(fNT), bg: "rgba(34,197,94,0.04)", bc: "rgba(34,197,94,0.12)", c: "#22c55e", sub: `+${((fNT / tc - 1) * 100).toFixed(1)}% ${t.total}`, sc: "#666" },
            { label: t.withTax, value: fmt(fWT), bg: "rgba(239,68,68,0.04)", bc: "rgba(239,68,68,0.12)", c: "#ef4444", sub: `+${((fWT / tc - 1) * 100).toFixed(1)}% ${t.total}`, sc: "#666" },
            { label: t.taxDrag, value: fmt(fG), bg: "rgba(239,68,68,0.08)", bc: "rgba(239,68,68,0.2)", c: "#ef4444", sub: `${fGP.toFixed(1)}% ${t.ofPortfolio}`, sc: "#ef4444" }
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 10, padding: 16, border: `1px solid ${s.bc}` }}>
              <div style={{ fontSize: 11, color: s.c === "#e0e0e0" ? "#888" : s.c, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.c }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 11, color: s.sc, fontFamily: "'JetBrains Mono', monospace" }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "20px 12px 12px 0" }}>
          <div style={{ paddingLeft: 20, marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{t.chartTitle}</span></div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={v => `${t.yearPrefix}${v}`} />
              <YAxis tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={fmt} width={65} />
              <Tooltip content={<TT1 t={t} />} />
              <Area type="monotone" dataKey="noTax" name={t.noTax} stroke="#22c55e" fill="url(#g1)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="withTax" name={t.withTaxLabel} stroke="#ef4444" fill="url(#g2)" strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gap Chart */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "20px 12px 12px 0" }}>
          <div style={{ paddingLeft: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{t.gapChartTitle}</span>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 11, color: "#F97316", fontFamily: "'JetBrains Mono', monospace" }}>{"\u2501"} {t.absLabel}</span>
              <span style={{ fontSize: 11, color: "#a855f7", fontFamily: "'JetBrains Mono', monospace" }}>{"\u2564"} {t.pctLabel}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData.slice(1)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} tickFormatter={v => `${t.yearPrefix}${v}`} />
              <YAxis yAxisId="left" tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={fmt} width={65} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}%`} width={45} />
              <Tooltip content={<TT2 t={t} />} />
              <Line yAxisId="left" type="monotone" dataKey="gap" stroke="#F97316" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="gapPct" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 32 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 16, overflowX: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 12 }}>{t.tableTitle}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {[t.thYear, t.thReturn, t.thNoTax, t.thWithTax, t.thGap, t.thGapPct].map(h => <th key={h} style={{ textAlign: "right", padding: "8px 10px", color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>)}
            </tr></thead>
            <tbody>{chartData.slice(1).map((row, i) => {
              const r = ar[yk[i % yk.length]];
              return <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <td style={{ padding: "7px 10px", textAlign: "right", color: "#aaa" }}>{row.year}</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: r >= 0 ? "#22c55e" : "#ef4444" }}>{r >= 0 ? "+" : ""}{r.toFixed(1)}%</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: "#22c55e" }}>{fmt(row.noTax)}</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: "#ef4444" }}>{fmt(row.withTax)}</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: "#F97316" }}>{fmt(row.gap)}</td>
                <td style={{ padding: "7px 10px", textAlign: "right", color: "#a855f7" }}>{row.gapPct.toFixed(1)}%</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", fontSize: 11, color: "#444", lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
        {t.footer1}<br />{t.footer2}<br />{t.footer3}
      </div>
    </div>
  );
}
