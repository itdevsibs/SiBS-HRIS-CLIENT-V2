import { useEffect, useState } from "react";
import { subscribeToLoginEntrance, LOGIN_ENTRANCE_DURATION_MS } from "../../lib/utils/loginEntrance.js";
import "./LoginEntrance.css";

// Deterministic positions: no random rendering, canvas, or external assets.
const sparks = Array.from({ length: 24 }, (_, index) => {
  const angle = (index * Math.PI * 2) / 24;
  const radius = index % 3 === 0 ? 44 : index % 3 === 1 ? 32 : 23;
  return {
    "--spark-x": `${Math.cos(angle) * radius}vmin`,
    "--spark-y": `${Math.sin(angle) * radius}vmin`,
    "--spark-delay": `${(index % 5) * 36}ms`,
    "--spark-size": `${index % 4 === 0 ? 10 : 5}px`,
    "--spark-color": index % 3 === 0 ? "#ffffff" : index % 3 === 1 ? "#ff7138" : "#ffd6a4",
  };
});

export default function LoginEntrance({ enabled = true }) {
  const [sequence, setSequence] = useState(null);
  useEffect(() => subscribeToLoginEntrance(setSequence), []);

  if (!enabled || sequence === null) return null;

  return (
    <div
      key={sequence}
      className="sibs-login-entrance"
      style={{ "--entrance-duration": `${LOGIN_ENTRANCE_DURATION_MS}ms` }}
      aria-hidden="true"
      data-testid="login-entrance"
    >
      <div className="sibs-login-entrance__halo" />
      <div className="sibs-login-entrance__ring sibs-login-entrance__ring--outer" />
      <div className="sibs-login-entrance__ring sibs-login-entrance__ring--inner" />
      {sparks.map((style, index) => (
        <span key={index} className="sibs-login-entrance__spark" style={style} />
      ))}
      <div className="sibs-login-entrance__wordmark">
        <span className="sibs-login-entrance__eyebrow">WELCOME TO</span>
        <span className="sibs-login-entrance__brand">SiBS <span>HRIS</span></span>
        <span className="sibs-login-entrance__underline" />
      </div>
    </div>
  );
}
