import { useState, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid, Legend, ReferenceLine } from "recharts";

// Historical data (2018-2024, 7 years)
const HISTORICAL_DATA = {
  sp500_usd: {
    2018: -4.38, 2019: 31.49, 2020: 18.40, 2021: 28.71,
    2022: -18.11, 2023: 26.29, 2024: 25.02
  },
  aex: {
    2018: -10.41, 2019: 23.92, 2020: 3.31, 2021: 27.75,
    2022: -13.65, 2023: 14.20, 2024: 11.67
  },
  bitcoin: {
    2018: -73.56, 2019: 92.20, 2020: 303.16, 2021: 59.67,
    2022: -64.27, 2023: 155.42, 2024: 121.05
  },
  // EUR/USD end-of-year rates (approximate)
  eurusd: {
    2017: 1.20, 2018: 1.145, 2019: 1.12, 2020: 1.22,
    2021: 1.137, 2022: 1.07, 2023: 1.105, 2024: 1.04
  }
};

// Convert S&P 500 USD returns to EUR returns
function getSP500EurReturns() {
  const result = {};
  for (let year = 2018; year <= 2024; year++) {
    const usdReturn = HISTORICAL_DATA.sp500_usd[year] / 100;
    const prevRate = HISTORICAL_DATA.eurusd[year - 1]; // EUR per USD start
    const currRate = HISTORICAL_DATA.eurusd[year];
    // If 1 EUR = X USD, then 1 USD = 1/X EUR
    // EUR return = (1 + USD return) * (prevRate / currRate) - 1
    const fxEffect = prevRate / currRate;
    result[year] = ((1 + usdReturn) * fxEffect - 1) * 100;
  }
  return result;
}

const SP500_EUR = getSP500EurReturns();

const ASSETS = {
  sp500_eur: { name: "S&P 500 (in EUR)", returns: SP500_EUR, color: "#FF6B35" },
  aex: { name: "AEX Amsterdam", returns: HISTORICAL_DATA.aex, color: "#004E89" },
  bitcoin: { name: "Bitcoin", returns: HISTORICAL_DATA.bitcoin, color: "#F7931A" }
};

const TAX_RATE = 0.36;

function simulate(initialInvestment, monthlyContrib, frequency, assetKey, yearsToSim) {
  const returns = ASSETS[assetKey].returns;
  const yearKeys = Object.keys(returns).map(Number).sort();

  const dataNoTax = [];
  const dataTax = [];
  let valueNoTax = initialInvestment;
  let valueTax = initialInvestment;

  dataNoTax.push({ year: yearKeys[0] - 1, value: initialInvestment });
  dataTax.push({ year: yearKeys[0] - 1, value: initialInvestment });

  const periodsPerYear = frequency === "monthly" ? 12 : frequency === "quarterly" ? 4 : 1;
  const contribPerPeriod = monthlyContrib * (frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12);
  const totalAnnualContrib = monthlyContrib * 12;

  const years = yearsToSim <= 7 ? yearKeys.slice(0, yearsToSim) : [];
  if (yearsToSim > 7) {
    for (let i = 0; i < yearsToSim; i++) {
      years.push(yearKeys[i % yearKeys.length] + Math.floor(i / yearKeys.length) * 7);
    }
  }

  const actualYears = yearsToSim <= 7 ? yearKeys.slice(0, yearsToSim) : years;
  const returnSequence = actualYears.map((_, i) => {
    const idx = i % yearKeys.length;
    return returns[yearKeys[idx]] / 100;
  });

  for (let i = 0; i < returnSequence.length; i++) {
    const r = returnSequence[i];
    const yearLabel = i + 1;

    // No tax scenario: grow + contribute throughout year
    const startNoTax = valueNoTax;
    if (periodsPerYear === 1) {
      valueNoTax = valueNoTax * (1 + r) + totalAnnualContrib;
    } else {
      const periodReturn = Math.pow(1 + r, 1 / periodsPerYear) - 1;
      for (let p = 0; p < periodsPerYear; p++) {
        valueNoTax = (valueNoTax + contribPerPeriod) * (1 + periodReturn);
      }
    }

    // Tax scenario: grow + contribute, then pay tax on gains
    const startTax = valueTax;
    if (periodsPerYear === 1) {
      valueTax = valueTax * (1 + r) + totalAnnualContrib;
    } else {
      const periodReturn = Math.pow(1 + r, 1 / periodsPerYear) - 1;
      for (let p = 0; p < periodsPerYear; p++) {
        valueTax = (valueTax + contribPerPeriod) * (1 + periodReturn);
      }
    }

    // Tax on unrealized gains (only on positive gains)
    const totalContribThisYear = totalAnnualContrib;
    const gain = valueTax - startTax - totalContribThisYear;
    if (gain > 0) {
      valueTax -= gain * TAX_RATE;
    }

    dataNoTax.push({ year: yearLabel, value: valueNoTax });
    dataTax.push({ year: yearLabel, value: valueTax });
  }

  return { dataNoTax, dataTax };
}

function formatCurrency(val) {
  if (val >= 1e6) return `€${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `€${(val / 1e3).toFixed(1)}K`;
  return `€${val.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "rgba(15, 15, 20, 0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "12px 16px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12
    }}>
      <div style={{ color: "#aaa", marginBottom: 6 }}>Year {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
      {payload.length === 2 && (
        <>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 6, paddingTop: 6, color: "#ef4444" }}>
            Gap: {formatCurrency(payload[0].value - payload[1].value)}
          </div>
          <div style={{ color: "#ef4444" }}>
            Lost: {((1 - payload[1].value / payload[0].value) * 100).toFixed(1)}%
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [asset, setAsset] = useState("sp500_eur");
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [frequency, setFrequency] = useState("monthly");
  const [investmentType, setInvestmentType] = useState("dca");
  const [years, setYears] = useState(7);
  const [showInfo, setShowInfo] = useState(true);

  const result = useMemo(() => {
    const monthlyVal = investmentType === "lump" ? 0 : monthly;
    return simulate(initial, monthlyVal, frequency, asset, years);
  }, [initial, monthly, frequency, asset, years, investmentType]);

  const chartData = useMemo(() => {
    return result.dataNoTax.map((d, i) => ({
      year: d.year,
      noTax: Math.round(d.value),
      withTax: Math.round(result.dataTax[i].value),
      gap: Math.round(d.value - result.dataTax[i].value),
      gapPct: d.value > 0 ? ((d.value - result.dataTax[i].value) / d.value * 100) : 0
    }));
  }, [result]);

  const finalNoTax = chartData[chartData.length - 1]?.noTax || 0;
  const finalWithTax = chartData[chartData.length - 1]?.withTax || 0;
  const finalGap = finalNoTax - finalWithTax;
  const finalGapPct = finalNoTax > 0 ? (finalGap / finalNoTax * 100) : 0;
  const totalContributed = initial + (investmentType === "lump" ? 0 : monthly * 12 * years);

  const assetReturns = ASSETS[asset].returns;
  const yearKeys = Object.keys(assetReturns).map(Number).sort();
  const avgReturn = yearKeys.reduce((s, y) => s + assetReturns[y], 0) / yearKeys.length;

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    color: "#e0e0e0",
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    fontFamily: "'JetBrains Mono', monospace",
    transition: "border-color 0.2s"
  };

  const labelStyle = {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 4,
    fontWeight: 600
  };

  const btnStyle = (active) => ({
    padding: "7px 14px",
    borderRadius: 6,
    border: active ? "1px solid " + ASSETS[asset].color : "1px solid rgba(255,255,255,0.1)",
    background: active ? ASSETS[asset].color + "22" : "transparent",
    color: active ? ASSETS[asset].color : "#888",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    transition: "all 0.2s"
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e0e0e0",
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: "24px 16px"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            background: "#ef4444",
            color: "white",
            fontSize: 9,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 4,
            letterSpacing: "0.1em",
            fontFamily: "'JetBrains Mono', monospace"
          }}>BOX 3</div>
          <div style={{
            background: "rgba(255,255,255,0.06)",
            color: "#888",
            fontSize: 9,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 4,
            letterSpacing: "0.1em",
            fontFamily: "'JetBrains Mono', monospace"
          }}>36% UNREALIZED GAINS</div>
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: "-0.02em"
        }}>
          Dutch Wealth Tax Impact Simulator
        </h1>
        <p style={{ color: "#666", fontSize: 14, margin: "8px 0 0 0", lineHeight: 1.5 }}>
          Passed Feb 12, 2026 — effective Jan 2028. Compare your portfolio growth with and without the 36% annual tax on unrealized gains.
        </p>

        {/* Collapsible explanation */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#888",
            fontSize: 12,
            padding: "6px 14px",
            borderRadius: 6,
            cursor: "pointer",
            marginTop: 12,
            fontFamily: "'JetBrains Mono', monospace",
            transition: "all 0.2s"
          }}
        >
          {showInfo ? "▾ Hide" : "▸ Show"} explanation on compounding impact
        </button>

        {showInfo && (
          <div style={{
            marginTop: 12,
            padding: 20,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 13,
            lineHeight: 1.7,
            color: "#bbb"
          }}>
            <h3 style={{ color: "#e0e0e0", fontSize: 15, margin: "0 0 10px 0" }}>How the 36% unrealized gains tax destroys compounding</h3>
            <p style={{ margin: "0 0 10px 0" }}>
              Compound interest is often called the eighth wonder of the world. The core mechanism is simple: your gains generate their own gains. A €10,000 investment growing at 10% becomes €10,000 → €11,000 → €12,100 → €13,310. That extra €310 in year 3 exists solely because your earlier gains were reinvested.
            </p>
            <p style={{ margin: "0 0 10px 0" }}>
              The Dutch Box 3 reform, passed on February 12, 2026, introduces a 36% annual tax on <strong style={{ color: "#ef4444" }}>unrealized</strong> gains — meaning you owe tax on paper profits even without selling. Each year, 36% of your gains are effectively removed from your compounding base. Instead of €11,000 rolling over to generate next year's returns, only €10,640 does (€1,000 gain minus €360 tax).
            </p>
            <p style={{ margin: "0 0 10px 0" }}>
              This creates a <strong>compounding penalty</strong> that grows exponentially over time. In year 1, the damage might be just a few hundred euros. But by year 7, 10, or 20, the gap between taxed and untaxed portfolios widens dramatically — because every year you're compounding on a smaller base, and that smaller base compounds into an even smaller amount the next year.
            </p>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 16, margin: "16px 0 10px 0" }}>
              <h4 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 8px 0", fontWeight: 700 }}>⚠ The volatility trap: you pay tax on gains you never keep</h4>
              <p style={{ margin: 0 }}>
                For volatile assets like Bitcoin, this tax is uniquely destructive. Select Bitcoin in the simulator above and watch what happens. In 2020, Bitcoin returned +303%. The government takes 36% of that gain — in cash, immediately. Then in 2022, Bitcoin crashes −64%. You've now lost most of your portfolio value, but the tax you paid in 2020 is gone forever. You paid real money on paper wealth that evaporated. Losses can technically be carried forward, but only amounts above €500 and only against future gains that may never come. The system is fundamentally asymmetric: the government always collects in good years, but never gives back in bad years. Over a full boom-bust cycle, you can end up with <strong style={{ color: "#ef4444" }}>less money than you started with</strong> while having paid thousands in taxes on "gains" that no longer exist.
              </p>
            </div>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: 16, margin: "0 0 10px 0" }}>
              <h4 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 8px 0", fontWeight: 700 }}>💸 The real cost: decades of stolen compounding</h4>
              <p style={{ margin: 0 }}>
                What makes this tax so devastating is not the 36% rate itself — it's <strong style={{ color: "#ef4444" }}>when</strong> it's applied. A capital gains tax at sale lets your full portfolio compound untouched for 10, 20, or 30 years. You pay once, at the end. This tax bleeds your portfolio every single year. Run the simulator for 21 years and look at the gap. With the S&P 500, the tax drag can consume 20–30% of your total portfolio value. With Bitcoin, it can be even worse. This is not a 36% tax on your returns — because it interrupts compounding year after year, the effective lifetime cost is far higher. Every euro taken out in year 3 is a euro that can never generate returns in year 4, 5, 6, and beyond. Over a working lifetime of investing, this mechanism can destroy a third to half of the wealth an ordinary Dutch citizen would have built. The government isn't just taxing your gains — it's taxing your future.
              </p>
            </div>
            <p style={{ margin: 0, color: "#888", fontSize: 12, fontStyle: "italic" }}>
              Note: This simulator uses actual historical yearly returns from 2018–2024. S&P 500 returns are converted from USD to EUR using end-of-year exchange rates. The AEX data reflects price returns only (excluding dividends). For simulations beyond 7 years, the return sequence repeats. The tax-free threshold (€57,684) and loss carry-forward are not modeled for simplicity, meaning real-world impact may be slightly lower for small portfolios but the compounding destruction principle remains identical.
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        {/* Asset selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Asset</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(ASSETS).map(([key, a]) => (
              <button key={key} onClick={() => setAsset(key)} style={{
                ...btnStyle(asset === key),
                borderColor: asset === key ? a.color : "rgba(255,255,255,0.1)",
                color: asset === key ? a.color : "#888",
                background: asset === key ? a.color + "22" : "transparent"
              }}>
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <div>
            <div style={labelStyle}>Initial (€)</div>
            <input
              type="number"
              value={initial}
              onChange={e => setInitial(Math.max(0, Number(e.target.value)))}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Strategy</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setInvestmentType("lump")} style={btnStyle(investmentType === "lump")}>Lump sum</button>
              <button onClick={() => setInvestmentType("dca")} style={btnStyle(investmentType === "dca")}>DCA</button>
            </div>
          </div>

          {investmentType === "dca" && (
            <>
              <div>
                <div style={labelStyle}>Monthly (€)</div>
                <input
                  type="number"
                  value={monthly}
                  onChange={e => setMonthly(Math.max(0, Number(e.target.value)))}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={labelStyle}>Frequency</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["monthly", "quarterly", "yearly"].map(f => (
                    <button key={f} onClick={() => setFrequency(f)} style={btnStyle(frequency === f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <div style={labelStyle}>Years</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[7, 14, 21].map(y => (
                <button key={y} onClick={() => setYears(y)} style={btnStyle(years === y)}>{y}y</button>
              ))}
            </div>
          </div>
        </div>

        {/* Historical returns table */}
        <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#666", fontFamily: "'JetBrains Mono', monospace" }}>Returns used:</span>
          {yearKeys.map(y => {
            const r = assetReturns[y];
            return (
              <span key={y} style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                padding: "2px 6px",
                borderRadius: 4,
                background: r >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: r >= 0 ? "#22c55e" : "#ef4444"
              }}>
                {y}: {r >= 0 ? "+" : ""}{r.toFixed(1)}%
              </span>
            );
          })}
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            padding: "2px 6px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.06)",
            color: "#aaa"
          }}>
            avg: {avgReturn >= 0 ? "+" : ""}{avgReturn.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 10,
            padding: 16,
            border: "1px solid rgba(255,255,255,0.06)"
          }}>
            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Total Invested</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(totalContributed)}
            </div>
          </div>

          <div style={{
            background: "rgba(34,197,94,0.04)",
            borderRadius: 10,
            padding: 16,
            border: "1px solid rgba(34,197,94,0.12)"
          }}>
            <div style={{ fontSize: 11, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Without Tax</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}>
              {formatCurrency(finalNoTax)}
            </div>
            <div style={{ fontSize: 11, color: "#666", fontFamily: "'JetBrains Mono', monospace" }}>
              +{((finalNoTax / totalContributed - 1) * 100).toFixed(1)}% total
            </div>
          </div>

          <div style={{
            background: "rgba(239,68,68,0.04)",
            borderRadius: 10,
            padding: 16,
            border: "1px solid rgba(239,68,68,0.12)"
          }}>
            <div style={{ fontSize: 11, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>With 36% Tax</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#ef4444" }}>
              {formatCurrency(finalWithTax)}
            </div>
            <div style={{ fontSize: 11, color: "#666", fontFamily: "'JetBrains Mono', monospace" }}>
              +{((finalWithTax / totalContributed - 1) * 100).toFixed(1)}% total
            </div>
          </div>

          <div style={{
            background: "rgba(239,68,68,0.08)",
            borderRadius: 10,
            padding: 16,
            border: "1px solid rgba(239,68,68,0.2)"
          }}>
            <div style={{ fontSize: 11, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Tax Drag</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#ef4444" }}>
              {formatCurrency(finalGap)}
            </div>
            <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
              {finalGapPct.toFixed(1)}% of portfolio destroyed
            </div>
          </div>
        </div>
      </div>

      {/* Main chart */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 12px 12px 0"
        }}>
          <div style={{ paddingLeft: 20, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>Portfolio Growth Comparison</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="noTaxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
                tickFormatter={v => `Y${v}`}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => formatCurrency(v)}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="noTax" name="No Tax" stroke="#22c55e" fill="url(#noTaxGrad)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="withTax" name="With 36% Tax" stroke="#ef4444" fill="url(#taxGrad)" strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gap chart */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 24 }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 12px 12px 0"
        }}>
          <div style={{ paddingLeft: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>Tax Drag Over Time</span>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 11, color: "#F97316", fontFamily: "'JetBrains Mono', monospace" }}>━ Absolute (€)</span>
              <span style={{ fontSize: 11, color: "#a855f7", fontFamily: "'JetBrains Mono', monospace" }}>╌ Percentage (%)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData.slice(1)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
                tickFormatter={v => `Y${v}`}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => formatCurrency(v)}
                width={65}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v.toFixed(0)}%`}
                width={45}
              />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div style={{
                    background: "rgba(15,15,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12
                  }}>
                    <div style={{ color: "#aaa", marginBottom: 4 }}>Year {label}</div>
                    <div style={{ color: "#F97316" }}>Gap: {formatCurrency(payload[0]?.value || 0)}</div>
                    <div style={{ color: "#a855f7" }}>Lost: {(payload[1]?.value || 0).toFixed(1)}%</div>
                  </div>
                );
              }} />
              <Line yAxisId="left" type="monotone" dataKey="gap" name="Gap (€)" stroke="#F97316" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="gapPct" name="Gap (%)" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yearly breakdown table */}
      <div style={{ maxWidth: 900, margin: "0 auto", marginBottom: 32 }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 16,
          overflowX: "auto"
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 12 }}>Year-by-Year Breakdown</div>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["Year", "Return", "No Tax", "With Tax", "Gap (€)", "Gap (%)"].map(h => (
                  <th key={h} style={{
                    textAlign: "right",
                    padding: "8px 10px",
                    color: "#666",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.slice(1).map((row, i) => {
                const returnIdx = i % yearKeys.length;
                const r = assetReturns[yearKeys[returnIdx]];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: "#aaa" }}>{row.year}</td>
                    <td style={{
                      padding: "7px 10px",
                      textAlign: "right",
                      color: r >= 0 ? "#22c55e" : "#ef4444"
                    }}>{r >= 0 ? "+" : ""}{r.toFixed(1)}%</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: "#22c55e" }}>{formatCurrency(row.noTax)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: "#ef4444" }}>{formatCurrency(row.withTax)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: "#F97316" }}>{formatCurrency(row.gap)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: "#a855f7" }}>{row.gapPct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        textAlign: "center",
        fontSize: 11,
        color: "#444",
        lineHeight: 1.6,
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        Data: S&P 500 total returns (Slickcharts) converted to EUR · AEX price returns (1stock1) · Bitcoin (Slickcharts)
        <br />EUR/USD approximate end-of-year rates. Tax-free threshold (€57,684) and loss carry-forward not modeled for simplicity.
        <br />Simulations beyond 7 years repeat the 2018–2024 return sequence. This is for educational purposes only.
      </div>
    </div>
  );
}
