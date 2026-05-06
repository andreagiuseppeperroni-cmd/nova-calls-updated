'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { demoCalls, makeSlug, type NovaCall } from '@/lib/local-call';
import { ProfileOrb } from '@/components/profile-store';

const STORAGE_KEY = 'nova:calls';

const callTypes = ['Decidere', 'Capire', 'Feedback', 'Trovare persone', 'Fare ora', 'Creare insieme'];

const navItems = [
  ['⌂', 'Home', '/'],
  ['◷', 'Call', '/calls/new'],
  ['⌁', 'Echo', '/echo'],
  ['◇', 'Outcome', '/outcome'],
  ['♙', 'Persone', '/people'],
  ['⬡', 'Spazi', '/spaces'],
  ['♧', 'Notifiche', '/notifications'],
  ['▱', 'Messaggi', '/messages'],
  ['◎', 'Profilo', '/profile'],
];

function readStoredCalls() {
  if (typeof window === 'undefined') return [] as NovaCall[];

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as NovaCall[];
  } catch {
    return [];
  }
}

function saveCall(call: NovaCall) {
  const calls = readStoredCalls();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([call, ...calls].slice(0, 12)));
}

export function NovaHome() {
  const [text, setText] = useState('');
  const [type, setType] = useState('Decidere');
  const [attachmentName, setAttachmentName] = useState('');
  const [calls, setCalls] = useState<NovaCall[]>(demoCalls);

  useEffect(() => {
    setCalls([...readStoredCalls(), ...demoCalls]);
  }, []);

  const featured = calls[0] || demoCalls[0];

  function openCall() {
    const title = text.trim() || 'Nuova Call Nova';

    const call: NovaCall = {
      title,
      description: 'Call aperta dalla homepage. Aggiungi contesto, messaggi e genera Echo, Pulse e Outcome.',
      type,
      accessType: 'public',
      slug: makeSlug(title),
      pulse: 12,
      participants: 1,
      createdAt: new Date().toISOString(),
    };

    saveCall(call);
    window.location.href = `/c/${call.slug}`;
  }

  return (
    <div className="nova-preview">
      <TopChrome />

      <main className="nova-app">
        <Sidebar />

        <section className="nova-center">
          <h1>
            Di cosa hai bisogno <span className="gradient-text">adesso?</span>
          </h1>
          <p className="subtitle">Apri una Call. La risposta è già nella tua rete.</p>

          <div className="composer">
            <div className="composer-content">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Racconta la tua Call..."
                rows={3}
                className="composer-input"
              />

              <div className="composer-actions">
                <button type="button" onClick={openCall} className="circle-plus">
                  +
                </button>

                <label className="mini-pill attachment-pill">
                  ⌘ {attachmentName || 'Allega'}
                  <input
                    type="file"
                    className="hidden-file"
                    onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || '')}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setType(type === 'Anonima' ? 'Decidere' : 'Anonima')}
                  className="mini-pill anon-pill"
                >
                  ◒ Anonima
                </button>
              </div>
            </div>

            <button type="button" onClick={openCall} className="mic">
              🎙
            </button>
          </div>

          <div className="chips">
            {callTypes.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setType(item)}
                className={`chip ${type === item ? 'active' : ''}`}
              >
                {item === 'Decidere'
                  ? '◈'
                  : item === 'Capire'
                    ? '⚭'
                    : item === 'Feedback'
                      ? '▱'
                      : item === 'Trovare persone'
                        ? '♙'
                        : item === 'Fare ora'
                          ? '☆'
                          : '▣'}{' '}
                {item}
              </button>
            ))}
          </div>

          <FeaturedCall call={featured} />
          <HostCard />
          <LiveStrip calls={calls} />
        </section>

        <RightPanels />
      </main>

      <style jsx global>{`
        :root {
          --bg: #030712;
          --panel: rgba(8, 14, 35, 0.72);
          --panel-2: rgba(13, 20, 48, 0.72);
          --line: rgba(142, 202, 255, 0.18);
          --text: #f8fbff;
          --muted: rgba(226, 232, 240, 0.66);
          --soft: rgba(226, 232, 240, 0.42);
          --cyan: #22d3ee;
          --blue: #3b82f6;
          --violet: #8b5cf6;
          --pink: #ec4899;
          --coral: #fb7185;
          --lime: #bef264;
          --green: #34d399;
          --radius-xl: 30px;
        }

        .nova-preview,
        .nova-preview * {
          box-sizing: border-box;
        }

        .nova-preview {
          position: relative;
          min-height: 100vh;
          width: 100%;
          color: var(--text);
          background:
            radial-gradient(circle at 51% 18%, rgba(34, 211, 238, .18), transparent 16%),
            radial-gradient(circle at 73% 9%, rgba(139, 92, 246, .14), transparent 20%),
            radial-gradient(circle at 43% 77%, rgba(236, 72, 153, .13), transparent 20%),
            radial-gradient(circle at 12% 22%, rgba(14, 165, 233, .11), transparent 18%),
            linear-gradient(180deg, #020617 0%, #020817 42%, #030712 100%);
          overflow-x: hidden;
          isolation: isolate;
        }

        .nova-preview::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          background-image:
            radial-gradient(circle, rgba(255,255,255,.55) 0 1px, transparent 1px),
            radial-gradient(circle, rgba(34,211,238,.45) 0 1px, transparent 1px);
          background-size: 94px 94px, 157px 157px;
          background-position: 13px 21px, 48px 77px;
          opacity: .11;
          mask-image: radial-gradient(circle at center, black 0%, transparent 83%);
        }

        .nova-preview::after {
          content: "";
          position: fixed;
          inset: -20%;
          z-index: -1;
          pointer-events: none;
          background:
            conic-gradient(from 110deg at 50% 42%, transparent 0deg, rgba(34, 211, 238, .15) 40deg, transparent 78deg, rgba(236, 72, 153, .11) 126deg, transparent 190deg, rgba(190, 242, 100, .07) 250deg, transparent 330deg),
            radial-gradient(ellipse at 50% 0%, rgba(34, 211, 238, .14), transparent 42%);
          filter: blur(28px);
          opacity: .88;
          transform: rotate(-5deg);
        }

        .glass {
          border: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(11, 18, 41, .77), rgba(5, 10, 27, .68));
          box-shadow: 0 22px 80px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08);
          backdrop-filter: blur(24px) saturate(1.25);
        }

        .nova-app {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 232px minmax(680px, 1fr) 460px;
          gap: 24px;
          width: 100%;
          min-height: 100vh;
          padding: 30px 26px 44px;
        }

        .brand {
          position: fixed;
          left: 30px;
          top: 24px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #eaf5ff;
          text-decoration: none;
        }

        .brand-logo-box {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(9, 15, 35, .72);
          box-shadow: 0 0 24px rgba(34,211,238,.18), inset 0 1px 0 rgba(255,255,255,.08);
          flex-shrink: 0;
        }

        .brand-logo-image {
          width: 18px;
          height: 18px;
          object-fit: contain;
          display: block;
        }

        .brand-word {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: .28em;
          color: #ffffff;
          text-shadow: 0 0 18px rgba(34,211,238,.18);
        }

        .brand:hover .brand-logo-box {
          border-color: rgba(34,211,238,.32);
          box-shadow: 0 0 32px rgba(34,211,238,.28), inset 0 1px 0 rgba(255,255,255,.08);
        }

        .brand-orb {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          border: 5px solid transparent;
          background: linear-gradient(#020617,#020617) padding-box, conic-gradient(from 0deg, var(--cyan), var(--violet), var(--pink), var(--cyan)) border-box;
          box-shadow: 0 0 22px rgba(34,211,238,.62), 0 0 28px rgba(236,72,153,.45);
          margin-left: -12px;
        }

        .top-actions {
          position: fixed;
          z-index: 10;
          right: 33px;
          top: 27px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-btn,
        .profile-orb-wrap {
          width: 49px;
          height: 49px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(9, 15, 35, .72);
          color: white;
          display: grid;
          place-items: center;
          font-size: 19px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
          text-decoration: none;
        }

        .profile-orb-wrap {
          border-radius: 999px;
          overflow: hidden;
          background: radial-gradient(circle at 30% 20%, #f8b4ff, #7c3aed 38%, #0f172a 70%);
          box-shadow: 0 0 28px rgba(139,92,246,.42);
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-radius: 18px;
          padding: 20px 16px;
          margin-top: 88px;
          position: sticky;
          top: 118px;
          height: calc(100vh - 142px);
          overflow: hidden;
        }

        .sidebar::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(130deg, rgba(34,211,238,.12), transparent 36%, rgba(139,92,246,.09));
          pointer-events: none;
        }

        .nav {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 9px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 15px;
          height: 52px;
          padding: 0 14px;
          border-radius: 16px;
          color: rgba(255,255,255,.82);
          font-size: 16px;
          font-weight: 750;
          text-decoration: none;
        }

        .nav-item:hover,
        .nav-item.active {
          color: #e7fbff;
          background: linear-gradient(90deg, rgba(34,211,238,.18), rgba(139,92,246,.09));
          box-shadow: inset 0 0 0 1px rgba(34,211,238,.18), 0 0 22px rgba(34,211,238,.18);
        }

        .nav-icon {
          width: 23px;
          text-align: center;
          font-size: 18px;
          filter: drop-shadow(0 0 8px rgba(34,211,238,.5));
        }

        .nav-badge {
          margin-left: auto;
          display: grid;
          place-items: center;
          min-width: 30px;
          height: 30px;
          border-radius: 999px;
          background: rgba(148, 163, 184, .22);
          color: rgba(255,255,255,.88);
          font-size: 12px;
        }

        .open-call {
          position: relative;
          z-index: 1;
          margin-top: auto;
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 17px;
          border: 0;
          border-radius: 15px;
          color: #fff;
          font-size: 21px;
          line-height: 1.15;
          font-weight: 850;
          text-align: left;
          text-decoration: none;
          background: linear-gradient(135deg, rgba(251,113,133,1), rgba(139,92,246,1) 58%, rgba(34,211,238,1));
          box-shadow: 0 0 32px rgba(34,211,238,.44), 0 0 38px rgba(236,72,153,.32);
        }

        .online {
          position: relative;
          z-index: 1;
          margin-top: 20px;
          border-radius: 999px;
          padding: 10px 13px;
          color: rgba(255,255,255,.68);
          background: rgba(255,255,255,.05);
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 12px;
          letter-spacing: .08em;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 99px;
          background: var(--green);
          box-shadow: 0 0 12px var(--green);
        }

        .nova-center {
          min-width: 0;
          padding-top: 78px;
        }

        .nova-center h1 {
          margin: 0;
          font-size: clamp(52px, 5.2vw, 83px);
          line-height: .98;
          letter-spacing: -.065em;
          font-weight: 780;
        }

        .gradient-text {
          background: linear-gradient(92deg, var(--cyan), #60a5fa 22%, #a78bfa 56%, var(--pink));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 42px rgba(34,211,238,.12);
        }

        .subtitle {
          margin: 8px 0 18px;
          color: var(--muted);
          font-size: 16px;
          font-weight: 650;
        }

        .composer {
          position: relative;
          height: 140px;
          border-radius: 26px;
          padding: 22px;
          overflow: hidden;
          border: 1px solid rgba(34,211,238,.55);
          background:
            radial-gradient(ellipse at 46% 4%, rgba(34,211,238,.95), transparent 24%),
            radial-gradient(ellipse at 70% 50%, rgba(236,72,153,.6), transparent 28%),
            linear-gradient(135deg, rgba(20,27,64,.92), rgba(6,13,32,.9));
          box-shadow: 0 0 28px rgba(34,211,238,.36), 0 0 44px rgba(139,92,246,.33), inset 0 1px 0 rgba(255,255,255,.12);
        }

        .composer::before {
          content: "";
          position: absolute;
          inset: -45px -20px auto -20px;
          height: 122px;
          background: linear-gradient(98deg, transparent 5%, rgba(34,211,238,.8), rgba(99,102,241,.7), rgba(236,72,153,.72), transparent 95%);
          filter: blur(19px);
          transform: rotate(7deg);
          opacity: .9;
        }

        .composer-content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .composer-input {
          width: calc(100% - 78px);
          min-height: 68px;
          resize: none;
          border: 0;
          outline: none;
          background: transparent;
          color: rgba(226,232,240,.9);
          font-size: 16px;
          font-weight: 650;
          font-family: inherit;
        }

        .composer-input::placeholder {
          color: rgba(226,232,240,.72);
        }

        .composer-actions {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .mini-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(2,6,23,.5);
          padding: 0 16px;
          color: rgba(255,255,255,.84);
          font-size: 14px;
          font-weight: 760;
          cursor: pointer;
          font-family: inherit;
        }

        .hidden-file {
          display: none;
        }

        .circle-plus {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 26px;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .mic {
          position: absolute;
          right: 19px;
          bottom: 23px;
          width: 72px;
          height: 72px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 26px;
          background: radial-gradient(circle, rgba(2,6,23,.85), rgba(15,23,42,.5));
          border: 1px solid rgba(255,255,255,.17);
          box-shadow: 0 0 28px rgba(139,92,246,.38);
          cursor: pointer;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin: 26px 0 20px;
        }

        .chip {
          height: 39px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(7,13,31,.68);
          color: rgba(255,255,255,.86);
          padding: 0 19px;
          font-size: 14px;
          font-weight: 780;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
          cursor: pointer;
          font-family: inherit;
        }

        .chip.active {
          border-color: rgba(99,102,241,.55);
          background: linear-gradient(135deg, rgba(59,130,246,.62), rgba(139,92,246,.62));
          box-shadow: 0 0 28px rgba(99,102,241,.36);
        }

        .featured {
          position: relative;
          min-height: 310px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid rgba(139,92,246,.45);
          background:
            linear-gradient(90deg, rgba(4,8,20,.88), rgba(4,8,20,.26)),
            radial-gradient(circle at 76% 45%, rgba(139,92,246,.42), transparent 22%),
            radial-gradient(circle at 90% 44%, rgba(34,211,238,.24), transparent 20%),
            linear-gradient(135deg, #071027, #11114a 47%, #080b1c);
          box-shadow: 0 0 42px rgba(139,92,246,.42), inset 0 1px 0 rgba(255,255,255,.09);
        }

        .featured::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 78% 36%, rgba(236,72,153,.65), transparent 12%),
            radial-gradient(ellipse at 82% 26%, rgba(34,211,238,.5), transparent 23%),
            linear-gradient(165deg, transparent 0 42%, rgba(34,211,238,.18), transparent 57%);
          background-size: cover;
          background-position: center bottom;
          opacity: .92;
        }

        .featured-content {
          position: relative;
          z-index: 1;
          min-height: 310px;
          padding: 27px 27px 28px;
          display: flex;
          flex-direction: column;
        }

        .badge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 34px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.11);
          padding: 0 15px;
          color: rgba(255,255,255,.86);
          font-size: 13px;
          font-weight: 820;
        }

        .status {
          position: absolute;
          right: 24px;
          top: 22px;
        }

        .featured h2 {
          margin: 34px 0 9px;
          font-size: 40px;
          line-height: 1;
          letter-spacing: -.045em;
          font-weight: 900;
        }

        .featured p {
          margin: 0;
          color: var(--muted);
          font-size: 17px;
          font-weight: 600;
        }

        .call-meta {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 24px;
        }

        .avatars {
          display: flex;
          align-items: center;
        }

        .avatar-small {
          width: 35px;
          height: 35px;
          margin-right: -9px;
          border: 2px solid rgba(4,8,20,.9);
          border-radius: 999px;
          background: linear-gradient(135deg, var(--cyan), var(--pink));
          box-shadow: 0 0 12px rgba(34,211,238,.25);
        }

        .avatar-small:nth-child(2) { background: linear-gradient(135deg, #f472b6, #7c3aed); }
        .avatar-small:nth-child(3) { background: linear-gradient(135deg, #22c55e, #06b6d4); }
        .avatar-small:nth-child(4) { background: linear-gradient(135deg, #fb7185, #f59e0b); }

        .plus-count {
          margin-left: 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.09);
          padding: 10px 14px;
          font-weight: 800;
          color: white;
        }

        .active-count {
          border-left: 1px solid rgba(255,255,255,.14);
          padding-left: 18px;
          font-size: 14px;
          color: rgba(255,255,255,.9);
          font-weight: 700;
        }

        .active-count b {
          font-size: 20px;
          color: white;
        }

        .speaking {
          color: var(--muted);
          display: block;
          font-weight: 600;
        }

        .call-actions {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .call-action {
          min-width: 140px;
          height: 52px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.11);
          background: rgba(7,13,31,.64);
          color: rgba(255,255,255,.88);
          font-weight: 840;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
        }

        .primary-cta {
          margin-left: auto;
          width: 300px;
          height: 58px;
          border-radius: 999px;
          border: 0;
          color: white;
          font-size: 22px;
          font-weight: 820;
          background: linear-gradient(100deg, #4f46e5, #8b5cf6 42%, #22d3ee 82%, #bef264);
          box-shadow: 0 0 34px rgba(34,211,238,.34), 0 0 35px rgba(139,92,246,.38);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .host-card {
          margin-top: 16px;
          border-radius: 22px;
          padding: 17px 22px;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 18px;
          align-items: center;
          background: linear-gradient(90deg, rgba(12, 18, 42, .86), rgba(24, 14, 58, .74));
        }

        .host-left {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .host-orb {
          width: 92px;
          height: 92px;
          border-radius: 999px;
          background: radial-gradient(circle at 34% 25%, #a5f3fc, #a855f7 32%, #db2777 54%, #020617 78%);
          box-shadow: 0 0 34px rgba(236,72,153,.32), inset 0 0 16px rgba(255,255,255,.16);
        }

        .host-name {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 2px;
        }

        .host-title {
          color: var(--muted);
          font-size: 14px;
          font-weight: 650;
        }

        .host-bio {
          color: rgba(255,255,255,.7);
          font-size: 13px;
          line-height: 1.35;
          max-width: 250px;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-left: 1px solid rgba(255,255,255,.09);
        }

        .metric {
          padding-left: 22px;
          border-right: 1px solid rgba(255,255,255,.08);
        }

        .metric:last-child {
          border-right: 0;
        }

        .metric span {
          display: block;
          color: rgba(255,255,255,.52);
          font-size: 13px;
          font-weight: 700;
        }

        .metric b {
          display: block;
          margin-top: 8px;
          font-size: 23px;
          color: var(--cyan);
        }

        .metric:nth-child(2) b { color: var(--lime); }
        .metric:nth-child(3) b { color: #67e8f9; }

        .live-strip {
          margin-top: 16px;
          border-radius: 22px;
          padding: 14px 16px;
          background: linear-gradient(180deg, rgba(14, 20, 50, .75), rgba(6, 11, 26, .75));
          border: 1px solid rgba(139,92,246,.25);
        }

        .strip-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .strip-title {
          font-size: 19px;
          font-weight: 850;
        }

        .see-all {
          color: var(--muted);
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .call-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }

        .mini-card {
          min-height: 84px;
          border-radius: 15px;
          padding: 10px;
          border: 1px solid rgba(255,255,255,.12);
          background: linear-gradient(135deg, rgba(34,211,238,.23), rgba(6,12,29,.75));
          overflow: hidden;
          position: relative;
          font-weight: 820;
          font-size: 13px;
          line-height: 1.15;
          color: white;
          text-decoration: none;
        }

        .mini-card:nth-child(2) { background: linear-gradient(135deg, rgba(59,130,246,.24), rgba(6,12,29,.75)); }
        .mini-card:nth-child(3) { background: linear-gradient(135deg, rgba(139,92,246,.35), rgba(6,12,29,.75)); }
        .mini-card:nth-child(4) { background: linear-gradient(135deg, rgba(251,113,133,.35), rgba(6,12,29,.75)); }
        .mini-card:nth-child(5) { background: linear-gradient(135deg, rgba(14,165,233,.36), rgba(6,12,29,.75)); }

        .mini-card::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 8px;
          height: 18px;
          background: repeating-linear-gradient(90deg, rgba(34,211,238,.9) 0 2px, transparent 2px 9px);
          opacity: .35;
          transform: skewX(-8deg);
        }

        .mini-status {
          font-size: 10px;
          color: var(--lime);
          display: block;
          margin-bottom: 8px;
        }

        .mini-score {
          position: absolute;
          left: 11px;
          bottom: 7px;
          color: var(--lime);
          font-size: 11px;
        }

        .right {
          padding-top: 76px;
          display: grid;
          gap: 18px;
          align-content: start;
          min-height: 0;
        }

        .panel {
          border-radius: 22px;
          padding: 22px;
          overflow: hidden;
          position: relative;
          min-height: 250px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          font-size: 28px;
          font-weight: 850;
          letter-spacing: -.03em;
        }

        .panel-title small {
          font-size: 14px;
          color: var(--muted);
          font-weight: 750;
          letter-spacing: 0;
        }

        .echo-body {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 14px;
          height: auto;
        }

        .inner {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(5,10,26,.42);
          border-radius: 15px;
          padding: 16px;
        }

        .inner h4 {
          margin: 0 0 15px;
          color: var(--soft);
          font-size: 14px;
          letter-spacing: .04em;
        }

        .insight {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 13px;
          align-items: start;
          margin-bottom: 18px;
          color: rgba(255,255,255,.87);
          font-size: 15px;
          line-height: 1.45;
          font-weight: 650;
        }

        .insight-icon {
          width: 31px;
          height: 31px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(34,211,238,.16);
          color: var(--cyan);
          border: 1px solid rgba(34,211,238,.25);
        }

        .mood-wrap {
          display: grid;
          place-items: center;
          height: 74%;
        }

        .mood-blob {
          width: 160px;
          height: 139px;
          display: grid;
          place-items: center;
          text-align: center;
          color: white;
          background:
            radial-gradient(circle at 28% 30%, rgba(34,211,238,.95), transparent 31%),
            radial-gradient(circle at 75% 35%, rgba(236,72,153,.9), transparent 32%),
            radial-gradient(circle at 60% 70%, rgba(139,92,246,.92), transparent 42%),
            rgba(15,23,42,.8);
          filter: drop-shadow(0 0 22px rgba(236,72,153,.5));
          border-radius: 45% 55% 52% 48% / 46% 38% 62% 54%;
          animation: morph 7s ease-in-out infinite;
        }

        .mood-blob b {
          font-size: 21px;
        }

        .mood-blob span {
          display: block;
          margin-top: 9px;
          font-size: 13px;
          color: rgba(255,255,255,.72);
        }

        @keyframes morph {
          50% {
            border-radius: 56% 44% 44% 56% / 35% 57% 43% 65%;
            transform: rotate(2deg) scale(1.04);
          }
        }

        .legend {
          display: flex;
          justify-content: center;
          gap: 14px;
          font-size: 11px;
          color: var(--muted);
        }

        .legend i {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 99px;
          margin-right: 5px;
          background: var(--cyan);
        }

        .legend span:nth-child(2) i { background: var(--coral); }
        .legend span:nth-child(3) i { background: var(--pink); }

        .outcome {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 20px;
          align-items: center;
        }

        .decision-label {
          color: var(--soft);
          font-size: 14px;
          font-weight: 650;
        }

        .decision {
          margin: 14px 0 6px;
          font-size: 21px;
          font-weight: 900;
        }

        .decision .check {
          color: var(--lime);
          margin-right: 10px;
        }

        .steps {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .step {
          border-radius: 11px;
          padding: 11px 12px;
          background: rgba(34,211,238,.07);
          border: 1px solid rgba(255,255,255,.08);
          font-size: 11px;
          color: rgba(255,255,255,.7);
        }

        .step b {
          color: var(--cyan);
          font-size: 16px;
          margin-right: 5px;
        }

        .result-orb {
          justify-self: center;
          width: 170px;
          height: 170px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 64px;
          color: var(--blue);
          background:
            radial-gradient(circle at 32% 20%, rgba(255,255,255,.32), transparent 18%),
            radial-gradient(circle at 65% 55%, rgba(139,92,246,.75), transparent 38%),
            radial-gradient(circle at 40% 60%, rgba(34,211,238,.85), transparent 40%),
            rgba(15,23,42,.86);
          box-shadow: 0 0 34px rgba(34,211,238,.35), 0 0 58px rgba(236,72,153,.23);
          position: relative;
        }

        .result-orb::after {
          content: "";
          position: absolute;
          inset: -16px;
          border-radius: inherit;
          border: 1px solid rgba(236,72,153,.35);
          transform: rotate(-18deg) scaleX(1.45);
          opacity: .6;
        }

        .pulse {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: center;
          height: calc(100% - 42px);
        }

        .radial {
          width: 230px;
          height: 230px;
          border-radius: 999px;
          margin: auto;
          display: grid;
          place-items: center;
          position: relative;
          background:
            repeating-radial-gradient(circle, transparent 0 12px, rgba(34,211,238,.16) 13px 14px),
            conic-gradient(from -15deg, transparent 0 18deg, var(--cyan) 38deg, var(--lime) 120deg, var(--pink) 240deg, transparent 310deg),
            radial-gradient(circle, rgba(34,211,238,.18), transparent 52%);
          box-shadow: 0 0 45px rgba(34,211,238,.26);
        }

        .radial::before {
          content: "";
          position: absolute;
          inset: 42px;
          border-radius: inherit;
          background: rgba(2,6,23,.82);
          box-shadow: inset 0 0 20px rgba(255,255,255,.08);
        }

        .radial::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 126%;
          background: linear-gradient(transparent, rgba(34,211,238,.9), rgba(139,92,246,.8), transparent);
          filter: blur(2px);
        }

        .pulse-score {
          position: relative;
          z-index: 1;
          text-align: center;
          font-size: 35px;
          font-weight: 850;
        }

        .pulse-score span {
          display: block;
          font-size: 13px;
          color: var(--muted);
          font-weight: 700;
        }

        .momentum h4 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 750;
        }

        .momentum p {
          margin: 0 0 28px;
          color: var(--muted);
          font-size: 13px;
        }

        .chart {
          width: 100%;
          height: 86px;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01));
        }

        .chart svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        @media (max-width: 1780px) {
          .nova-app {
            grid-template-columns: 232px minmax(0, 1fr);
            gap: 26px;
            padding-right: 26px;
          }

          .right {
            grid-column: 2;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            padding-top: 0;
          }

          .panel {
            min-height: 280px;
          }

          .echo-body {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          .outcome {
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }

          .result-orb {
            width: 128px;
            height: 128px;
            font-size: 50px;
            align-self: center;
            order: -1;
          }

          .pulse {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          .radial {
            width: 170px;
            height: 170px;
          }

          .radial::before {
            inset: 32px;
          }

          .chart {
            height: 76px;
          }

          .sidebar {
            height: auto;
            min-height: calc(100vh - 142px);
          }
        }

        @media (max-width: 1280px) {
          .nova-app {
            grid-template-columns: 210px minmax(0, 1fr);
          }

          .right {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .brand {
            position: relative;
            left: auto;
            top: auto;
            width: calc(100% - 28px);
            margin: 18px auto 12px;
            justify-content: center;
            gap: 12px;
            transform: none;
          }

          .brand-logo-box {
            width: 18px;
            height: 18px;
            border-radius: 16px;
          }

          .brand-logo-image {
            width: 18px;
            height: 18px;
          }

          .brand-word {
            font-size: 18px;
            letter-spacing: .22em;
          }

          .brand-orb {
            width: 22px;
            height: 22px;
            border-width: 4px;
            margin-left: -8px;
          }

          .top-actions {
            position: absolute;
            top: 20px;
            right: 14px;
            gap: 7px;
          }

          .top-actions .icon-btn {
            display: none;
          }

          .profile-orb-wrap {
            width: 38px;
            height: 38px;
          }

          .nova-app {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100vh;
            padding: 0 14px 92px;
            gap: 16px;
          }

          .sidebar {
            order: 3;
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            top: auto;
            z-index: 50;
            margin: 0;
            min-height: 0;
            height: auto;
            border-radius: 24px;
            padding: 9px;
            background: rgba(4, 9, 24, .78);
            backdrop-filter: blur(26px) saturate(1.4);
            box-shadow: 0 18px 60px rgba(0,0,0,.48), 0 0 34px rgba(34,211,238,.16), inset 0 1px 0 rgba(255,255,255,.1);
          }

          .sidebar::before,
          .online {
            display: none;
          }

          .nav {
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
          }

          .nav-item {
            height: 50px;
            justify-content: center;
            padding: 0;
            border-radius: 18px;
            font-size: 0;
            gap: 0;
          }

          .nav-item:nth-child(n+6) {
            display: none;
          }

          .nav-icon {
            width: auto;
            font-size: 20px;
          }

          .nav-badge {
            position: absolute;
            right: 7px;
            top: 5px;
            width: 18px;
            height: 18px;
            min-width: 18px;
            font-size: 10px;
          }

          .open-call {
            position: fixed;
            right: 18px;
            bottom: 84px;
            width: 64px;
            min-height: 64px;
            height: 64px;
            border-radius: 24px;
            padding: 0;
            justify-content: center;
            text-align: center;
            font-size: 0;
          }

          .open-call::before {
            content: "+";
            font-size: 36px;
            line-height: 1;
          }

          .open-call span {
            display: none;
          }

          .nova-center {
            order: 1;
            padding-top: 4px;
          }

          .nova-center h1 {
            max-width: 360px;
            margin: 0 auto;
            text-align: center;
            font-size: clamp(42px, 13.6vw, 58px);
            line-height: .92;
            letter-spacing: -.07em;
          }

          .subtitle {
            max-width: 310px;
            margin: 12px auto 18px;
            text-align: center;
            font-size: 14px;
            line-height: 1.45;
          }

          .composer {
            height: 132px;
            border-radius: 27px;
            padding: 18px;
          }

          .composer-input {
            font-size: 14px;
            width: calc(100% - 58px);
          }

          .composer-actions {
            gap: 8px;
            padding-right: 58px;
          }

          .circle-plus {
            width: 37px;
            height: 37px;
            font-size: 23px;
          }

          .mini-pill {
            height: 36px;
            padding: 0 12px;
            font-size: 12px;
          }

          .mic {
            width: 54px;
            height: 54px;
            right: 15px;
            bottom: 17px;
            font-size: 21px;
          }

          .chips {
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 9px;
            margin: 17px -14px 16px;
            padding: 0 14px 6px;
            scrollbar-width: none;
          }

          .chips::-webkit-scrollbar {
            display: none;
          }

          .chip {
            flex: 0 0 auto;
            height: 37px;
            padding: 0 15px;
            font-size: 12px;
            white-space: nowrap;
          }

          .featured {
            min-height: 360px;
            border-radius: 28px;
          }

          .featured-content {
            min-height: 360px;
            padding: 20px;
          }

          .status {
            right: 16px;
            top: 16px;
          }

          .featured h2 {
            margin-top: 48px;
            max-width: 270px;
            font-size: 34px;
            line-height: .98;
          }

          .featured p {
            max-width: 280px;
            font-size: 14px;
            line-height: 1.5;
          }

          .call-meta {
            align-items: flex-start;
            flex-direction: column;
            gap: 13px;
            margin-top: 20px;
          }

          .avatar-small {
            width: 32px;
            height: 32px;
          }

          .plus-count {
            padding: 8px 12px;
            font-size: 13px;
          }

          .active-count {
            border-left: 0;
            padding-left: 0;
            font-size: 13px;
          }

          .active-count b {
            font-size: 18px;
          }

          .call-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            width: 100%;
          }

          .call-action {
            min-width: 0;
            height: 44px;
            font-size: 12px;
          }

          .primary-cta {
            grid-column: 1 / -1;
            width: 100%;
            height: 54px;
            margin-left: 0;
            font-size: 19px;
          }

          .host-card {
            grid-template-columns: 1fr;
            gap: 17px;
            border-radius: 25px;
            padding: 18px;
          }

          .host-left {
            gap: 15px;
          }

          .host-orb {
            width: 74px;
            height: 74px;
            flex: 0 0 auto;
          }

          .host-name {
            font-size: 22px;
          }

          .host-bio {
            max-width: none;
          }

          .metrics {
            grid-template-columns: repeat(3, 1fr);
            border-left: 0;
            border-top: 1px solid rgba(255,255,255,.09);
            padding-top: 14px;
          }

          .metric {
            padding-left: 0;
            text-align: center;
          }

          .metric span {
            font-size: 10px;
            min-height: 28px;
          }

          .metric b {
            font-size: 20px;
          }

          .live-strip {
            border-radius: 25px;
            padding: 14px;
          }

          .call-grid {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 4px;
            scrollbar-width: none;
          }

          .call-grid::-webkit-scrollbar {
            display: none;
          }

          .mini-card {
            flex: 0 0 148px;
          }

          .right {
            order: 2;
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding-top: 0;
          }

          .panel {
            border-radius: 25px;
            padding: 18px;
          }

          .panel-title {
            font-size: 24px;
            margin-bottom: 14px;
          }

          .panel-title small {
            font-size: 12px;
          }

          .echo-body {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          .mood-wrap {
            height: auto;
            padding: 12px 0 16px;
          }

          .mood-blob {
            width: 142px;
            height: 122px;
          }

          .outcome {
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }

          .steps {
            grid-template-columns: 1fr;
          }

          .result-orb {
            width: 128px;
            height: 128px;
            font-size: 50px;
            align-self: center;
            order: -1;
          }

          .pulse {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          .radial {
            width: 210px;
            height: 210px;
          }

          .momentum {
            width: 100%;
          }

          .chart {
            height: 82px;
          }
        }

        @media (max-width: 420px) {
          .anon-pill {
            display: none;
          }

          .featured h2 {
            font-size: 31px;
          }

          .call-action {
            font-size: 11px;
          }

          .metric span {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
}

function TopChrome() {
  return (
    <>
      <Link href="/" className="brand" aria-label="NOVA home">
        <span className="brand-logo-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nova-logo.png" alt="" className="brand-logo-image" />
        </span>
        <span className="brand-word">NOVA</span>
      </Link>

      <div className="top-actions">
        <Link href="/search" className="icon-btn">
          ⌕
        </Link>
        <Link href="/saved" className="icon-btn">
          ☆
        </Link>
        <Link href="/people" className="icon-btn">
          ♙
        </Link>
        <Link href="/profile" className="profile-orb-wrap" aria-label="Profilo">
          <ProfileOrb className="h-full w-full" />
        </Link>
      </div>
    </>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar glass">
      <nav className="nav">
        {navItems.map(([icon, label, href], index) => (
          <Link key={label} href={href} className={`nav-item ${index === 0 ? 'active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            {label}
            {label === 'Notifiche' && <span className="nav-badge">3</span>}
          </Link>
        ))}
      </nav>

      <Link href="/calls/new" className="open-call">
        <span>
          Apri
          <br />
          una Call
        </span>
        <span>✦</span>
      </Link>

      <div className="online">
        <span className="dot" />
        NOVA Online
      </div>
    </aside>
  );
}

function FeaturedCall({ call }: { call: NovaCall }) {
  return (
    <article className="featured">
      <div className="featured-content">
        <span className="badge">★ Call in evidenza</span>
        <span className="badge status">
          <span className="dot" /> In corso
        </span>

        <h2>{call.title}</h2>
        <p>{call.description}</p>

        <div className="call-meta">
          <div className="avatars">
            <span className="avatar-small" />
            <span className="avatar-small" />
            <span className="avatar-small" />
            <span className="avatar-small" />
            <span className="plus-count">+{Math.max(call.participants - 4, 12)}</span>
          </div>

          <div className="active-count">
            <span className="dot" style={{ display: 'inline-block', marginRight: 8 }} />
            <b>{call.participants}</b> partecipanti attivi
            <span className="speaking">24 stanno parlando</span>
          </div>
        </div>

        <div className="call-actions">
          <Link href={`/c/${call.slug}?mode=audio`} className="call-action">
            ▥ Audio
          </Link>
          <Link href={`/c/${call.slug}?mode=video`} className="call-action">
            ▣ Video
          </Link>
          <Link href={`/c/${call.slug}?mode=chat`} className="call-action">
            ▱ Chat
          </Link>
          <Link href={`/c/${call.slug}`} className="primary-cta">
            Apri la Call →
          </Link>
        </div>
      </div>
    </article>
  );
}

function HostCard() {
  return (
    <section className="host-card glass">
      <div className="host-left">
        <div className="host-orb" />

        <div>
          <div className="badge" style={{ marginBottom: 10 }}>
            ✦ Host
          </div>

          <div className="host-name">
            Giulia R.{' '}
            <span className="mini-pill" style={{ height: 22, padding: '0 9px', fontSize: 10 }}>
              Host
            </span>
          </div>

          <div className="host-title">Designer • Milano</div>
          <div className="host-bio">Creator di spazi che aiutano le persone a prendere decisioni migliori.</div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>Call ospitate</span>
          <b>47</b>
        </div>
        <div className="metric">
          <span>Outcome generati</span>
          <b>23</b>
        </div>
        <div className="metric">
          <span>Persone aiutate</span>
          <b>1.2K</b>
        </div>
      </div>
    </section>
  );
}

function LiveStrip({ calls }: { calls: NovaCall[] }) {
  return (
    <section className="live-strip">
      <div className="strip-head">
        <div className="strip-title">⌁ Live adesso</div>
        <Link href="/spaces" className="see-all">
          Vedi tutte →
        </Link>
      </div>

      <div className="call-grid">
        {calls.slice(0, 6).map((call, index) => (
          <Link href={`/c/${call.slug}`} key={`${call.slug}-${index}`} className="mini-card">
            <span className="mini-status">● In corso</span>
            {call.title}
            <span className="mini-score">↯ {call.pulse}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RightPanels() {
  return (
    <aside className="right">
      <section className="panel glass">
        <div className="panel-title">
          ✣ Echo{' '}
          <small>
            <span className="dot" style={{ display: 'inline-block', marginRight: 8 }} />
            In tempo reale
          </small>
        </div>

        <div className="echo-body">
          <div className="inner">
            <h4>Insight dell&apos;AI</h4>

            {[
              'Hai bisogno di stabilità finanziaria nei primi mesi.',
              'Il tuo network a Milano potrebbe accelerare tutto.',
              'Il 68% vede in te il profilo giusto per il cambio.',
            ].map((item, index) => (
              <div className="insight" key={item}>
                <span className="insight-icon">{index === 0 ? '◎' : index === 1 ? '♙' : '◉'}</span>
                <span>{item}</span>
              </div>
            ))}

            <Link href="/echo" className="see-all">
              Analisi completa →
            </Link>
          </div>

          <div className="inner">
            <h4>Clima della stanza</h4>
            <div className="mood-wrap">
              <div className="mood-blob">
                <div>
                  <b>Fiducioso</b>
                  <span>
                    Energia positiva e
                    <br />
                    curiosità alta.
                  </span>
                </div>
              </div>
            </div>

            <div className="legend">
              <span>
                <i />
                Speranza
              </span>
              <span>
                <i />
                Curiosità
              </span>
              <span>
                <i />
                Determinazione
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel glass outcome">
        <div>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            🏆 Outcome{' '}
            <small className="mini-pill" style={{ height: 22, fontSize: 10, color: 'var(--lime)' }}>
              Completata
            </small>
          </div>

          <div className="decision-label">Decisione della stanza</div>
          <div className="decision">
            <span className="check">✓</span>
            Vai. È il momento.
          </div>
          <div style={{ color: 'var(--soft)', fontSize: 13, fontWeight: 700 }}>
            Approvato dal 76% dei partecipanti
          </div>

          <div className="steps">
            <div className="step">
              <b>1</b>Piano finanziario
              <br />
              90 giorni
            </div>
            <div className="step">
              <b>2</b>Visita esplorativa
              <br />2 settimane
            </div>
            <div className="step">
              <b>3</b>Costruisci rete locale
              <br />
              Subito
            </div>
          </div>

          <Link href="/outcome" className="see-all" style={{ display: 'inline-flex', marginTop: 18 }}>
            Riepilogo completo →
          </Link>
        </div>

        <div className="result-orb">✓</div>
      </section>

      <section className="panel glass">
        <div className="panel-title">
          〽 Pulse <small>Energia della stanza</small>
        </div>

        <div className="pulse">
          <div className="radial">
            <div className="pulse-score">
              92<span>Alta</span>
            </div>
          </div>

          <div className="momentum">
            <h4>Momentum in crescita</h4>
            <p>+28% negli ultimi 10 minuti</p>

            <div className="chart">
              <svg viewBox="0 0 280 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="line" x1="0" x2="1">
                    <stop stopColor="#a78bfa" />
                    <stop offset=".55" stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#bef264" />
                  </linearGradient>
                  <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#22d3ee" stopOpacity=".28" />
                    <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M0 79 L34 53 L66 72 L96 49 L130 52 L162 29 L195 36 L225 15 L280 9 L280 100 L0 100 Z"
                  fill="url(#area)"
                />
                <path
                  d="M0 79 L34 53 L66 72 L96 49 L130 52 L162 29 L195 36 L225 15 L280 9"
                  fill="none"
                  stroke="url(#line)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
