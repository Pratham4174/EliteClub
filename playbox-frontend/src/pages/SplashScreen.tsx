import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/SplashScreen.css";

const SPLASH_DURATION_MS = 4000;
const FADE_DURATION_MS = 520;

export default function SplashScreen() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#000000";

    const fadeTimer = window.setTimeout(() => setFadeOut(true), SPLASH_DURATION_MS - FADE_DURATION_MS);
    const navTimer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(navTimer);
      document.body.style.backgroundColor = prevBg;
    };
  }, [navigate]);

  return (
    <div className={`splash-root ${fadeOut ? "splash-fade" : ""}`} aria-label="EliteClub Splash Screen">
      <div className="splash-bg-glow" />
      <div className="splash-content">
        <h1 className="splash-title">
          <span>E</span><span>l</span><span>i</span><span>t</span><span>e</span><span>C</span><span>l</span><span>u</span><span>b</span>
        </h1>

        <div className="sports-stage">
          {/* Cricket */}
          <div className="scene scene-cricket">
            <div className="cricket-player">
              <div className="cricket-head" />
              <div className="cricket-neck" />
              <div className="cricket-body" />
              <div className="cricket-hip" />
              <div className="cricket-front-arm" />
              <div className="cricket-back-arm" />
              <div className="cricket-leg cricket-leg-front" />
              <div className="cricket-leg cricket-leg-back" />
            </div>
            <div className="cricket-wickets">
              <span />
              <span />
              <span />
            </div>
            <div className="cricket-bat" />
            <div className="cricket-ball" />
            <div className="cricket-shot-trail" />
          </div>

          {/* Pickleball */}
          <div className="scene scene-pickle">
            <div className="pickle-net" />
            <div className="pickle-net-base" />
            <div className="pickle-player">
              <div className="player-head" />
              <div className="player-neck" />
              <div className="player-body" />
              <div className="player-hip" />
              <div className="player-arm" />
              <div className="player-leg player-leg-a" />
              <div className="player-leg player-leg-b" />
              <div className="pickle-paddle" />
            </div>
            <div className="pickle-ball" />
            <div className="pickle-trail" />
          </div>

          {/* Swimming */}
          <div className="scene scene-swim">
            <div className="swim-trail" />
            <div className="pool-lane" />
            <div className="swimmer">
              <div className="swimmer-head" />
              <div className="swimmer-neck" />
              <div className="swimmer-body" />
              <div className="swimmer-hip" />
              <div className="swimmer-arm swimmer-arm-front" />
              <div className="swimmer-arm swimmer-arm-back" />
              <div className="swimmer-leg swimmer-leg-a" />
              <div className="swimmer-leg swimmer-leg-b" />
            </div>
            <div className="water-splash" />
            <div className="water-wave water-wave-a" />
            <div className="water-wave water-wave-b" />
            <div className="water-wave water-wave-c" />
            <div className="water-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
