import Link from "next/link";

interface FooterBandProps {
  note: string;
  metric?: string;
}

export function FooterBand({ note, metric }: FooterBandProps) {
  return (
    <footer className="footer-band">
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span>
          <span className="on-dark">●</span> {note}
        </span>
        <Link
          href="/privacy"
          style={{
            color: "var(--wash)",
            textDecoration: "underline",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            opacity: 0.9,
          }}
        >
          FERPA & Privacy Policy
        </Link>
      </div>
      {metric && <div className="on-dark">{metric}</div>}
    </footer>
  );
}

