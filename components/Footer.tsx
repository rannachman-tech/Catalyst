export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-[12px] leading-relaxed text-fg-subtle">
        <p className="font-medium text-fg-muted">Equity Catalyst</p>
        <p className="mt-2 max-w-3xl">
          Equity Catalyst surfaces publicly-known events that may move a stock —
          earnings, dividends, FDA decisions, product launches, options expiries,
          index reconstitutions and analyst days. It does not predict returns or
          tell you what to buy. The &ldquo;Trade on eToro&rdquo; flow is optional and uses
          your own eToro API keys.
        </p>
        <p className="mt-3 max-w-3xl">
          Built as a free retail tool for the eToro community. Cryptoassets are
          highly volatile unregulated investment products. Not financial advice.
        </p>
      </div>
    </footer>
  );
}
