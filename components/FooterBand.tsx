interface FooterBandProps {
  note: string;
  metric?: string;
}

export function FooterBand({ note, metric }: FooterBandProps) {
  return (
    <footer className="footer-band">
      <div>
        <span className="on-dark">●</span> {note}
      </div>
      {metric && <div className="on-dark">{metric}</div>}
    </footer>
  );
}
