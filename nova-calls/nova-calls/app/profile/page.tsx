'use client';

import Link from 'next/link';
import { type ChangeEvent, useState } from 'react';
import { ProfileOrb, useNovaProfile } from '@/components/profile-store';

function splitTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProfilePage() {
  const { profile, save, uploadAvatar, loading, syncError } = useNovaProfile();

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function update(field: keyof typeof profile, value: string) {
    save({ [field]: value });
    setSaved(false);
    setLocalError(null);
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setLocalError(null);
    setSaved(false);

    try {
      await uploadAvatar(file);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Impossibile caricare l’immagine profilo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function onSave() {
    save(profile);
    setSaved(true);
    setLocalError(null);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const tags = [...splitTags(profile.passions), ...splitTags(profile.interests)].slice(0, 8);

  return (
    <main className="ts-page">
      <header className="ts-profile-topbar">
        <Link href="/" className="ts-brand">
          <img src="/icon-192.png" alt="The Square" />
          <span>
            <b>The Square</b>
            <small>City Wall Network</small>
          </span>
        </Link>

        <nav className="ts-top-actions">
          <Link href="/">Home</Link>
          <Link href="/cities">Città</Link>
          <Link href="/notifications">Notifiche</Link>
        </nav>
      </header>

      <section className="ts-hero-card">
        <div>
          <p className="ts-eyebrow">Profilo personale</p>
          <h1>La tua Piazza su The Square</h1>
          <p className="ts-lead">
            Gestisci nome, città, biografia, interessi e presenza pubblica con lo stesso stile della nuova Home.
          </p>

          {loading && <p className="ts-status">Sincronizzo il profilo reale…</p>}
        </div>

        <div className="ts-hero-orb">
          <ProfileOrb className="h-full w-full" />
        </div>
      </section>

      {(syncError || localError) && (
        <section className="ts-alert">
          {localError || syncError}
        </section>
      )}

      <section className="ts-profile-grid">
        <aside className="ts-profile-card ts-profile-summary">
          <div className="ts-avatar-shell">
            <ProfileOrb className="h-full w-full" />
          </div>

          <div className="ts-summary-copy">
            <h2>{profile.displayName || 'Il tuo profilo'}</h2>
            <p>{profile.city || 'Aggiungi la tua città'}</p>
          </div>

          <label className="ts-upload-button">
            {uploading ? 'Carico immagine…' : 'Carica immagine profilo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>

          <div className="ts-stats">
            <div>
              <b>{profile.score}</b>
              <span>Punti</span>
            </div>
            <div>
              <b>{profile.contributions}</b>
              <span>Contributi</span>
            </div>
            <div>
              <b>{profile.callsJoined}</b>
              <span>Call</span>
            </div>
          </div>
        </aside>

        <section className="ts-profile-card ts-form-card">
          <div className="ts-section-head">
            <p className="ts-eyebrow">Informazioni</p>
            <h2>Modifica profilo</h2>
          </div>

          <div className="ts-form-grid">
            <label>
              <span>Nome visualizzato</span>
              <input
                value={profile.displayName}
                onChange={(event) => update('displayName', event.target.value)}
                autoComplete="name"
              />
            </label>

            <label>
              <span>Città / area</span>
              <input
                value={profile.city}
                onChange={(event) => update('city', event.target.value)}
                autoComplete="address-level2"
              />
            </label>

            <label className="wide">
              <span>Biografia</span>
              <textarea
                value={profile.bio}
                onChange={(event) => update('bio', event.target.value)}
                rows={5}
                placeholder="Racconta chi sei, cosa fai e in quali conversazioni vuoi essere trovato."
              />
            </label>

            <label>
              <span>Passioni</span>
              <textarea
                value={profile.passions}
                onChange={(event) => update('passions', event.target.value)}
                rows={4}
                placeholder="Decisioni, crescita personale, idee, community"
              />
              <small>Separale con una virgola.</small>
            </label>

            <label>
              <span>Interessi per le Call</span>
              <textarea
                value={profile.interests}
                onChange={(event) => update('interests', event.target.value)}
                rows={4}
                placeholder="Roma, lavoro, startup, relazioni, creatività"
              />
              <small>Aiutano The Square a suggerire Wall, persone e stanze.</small>
            </label>
          </div>

          <div className="ts-form-actions">
            <button type="button" onClick={onSave}>
              Salva profilo
            </button>

            {saved && <span>Profilo aggiornato</span>}
          </div>
        </section>
      </section>

      <section className="ts-profile-card ts-public-preview">
        <div className="ts-section-head">
          <p className="ts-eyebrow">Anteprima pubblica</p>
          <h2>Come ti vedranno gli altri</h2>
        </div>

        <article className="ts-preview-card">
          <ProfileOrb className="ts-preview-orb" />

          <div>
            <h3>{profile.displayName || 'Utente The Square'}</h3>
            <p>{profile.city || 'Italia'} · {profile.score} punti The Square</p>

            <p className="ts-preview-bio">
              {profile.bio || 'Completa la biografia per raccontare chi sei e quali conversazioni vuoi creare.'}
            </p>

            {tags.length > 0 && (
              <div className="ts-tags">
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <nav className="ts-mobile-nav">
        <Link href="/">⌂<span>Home</span></Link>
        <Link href="/cities">⌖<span>Città</span></Link>
        <Link href="/#composer" className="publish">+<span>Pubblica</span></Link>
        <Link href="/messages">💬<span>Chat</span></Link>
        <Link href="/profile" className="active">♙<span>Profilo</span></Link>
      </nav>

      <style jsx global>{`
        :root {
          --ts-bg: #fff7ec;
          --ts-ink: #17120d;
          --ts-muted: #7a6c5d;
          --ts-line: rgba(120, 78, 35, .16);
          --ts-yellow: #ffc93d;
          --ts-orange: #ff7a2f;
          --ts-blue: #44bfff;
          --ts-card: rgba(255,255,255,.84);
          --ts-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }

        html,
        body {
          background: #fff7ec !important;
        }

        .ts-page,
        .ts-page * {
          box-sizing: border-box;
        }

        .ts-page {
          min-height: 100vh;
          padding: 18px 18px 110px;
          color: var(--ts-ink);
          font-family: var(--ts-font);
          background:
            radial-gradient(circle at 0% 0%, rgba(255,201,61,.42), transparent 28%),
            radial-gradient(circle at 100% 6%, rgba(68,191,255,.24), transparent 28%),
            radial-gradient(circle at 84% 40%, rgba(255,111,97,.16), transparent 30%),
            linear-gradient(180deg,#fffaf2 0%,#fff3e1 44%,#fff8f0 100%);
          position: relative;
          overflow-x: hidden;
        }

        .ts-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .34;
          background:
            linear-gradient(90deg, rgba(120,78,35,.08) 1px, transparent 1px),
            linear-gradient(0deg, rgba(120,78,35,.08) 1px, transparent 1px);
          background-size: 34px 34px;
        }

        .ts-profile-topbar,
        .ts-hero-card,
        .ts-profile-grid,
        .ts-public-preview,
        .ts-alert {
          position: relative;
          z-index: 1;
          width: min(1120px, 100%);
          margin-left: auto;
          margin-right: auto;
        }

        .ts-profile-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .ts-brand {
          display: grid;
          grid-template-columns: 54px 1fr;
          align-items: center;
          gap: 12px;
          color: var(--ts-ink);
          text-decoration: none;
        }

        .ts-brand img {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          border: 2px solid rgba(255,167,38,.75);
          box-shadow: 0 0 0 6px rgba(255,201,61,.18), 0 16px 34px rgba(255,122,47,.20);
        }

        .ts-brand b {
          display: block;
          font-size: 28px;
          line-height: .96;
          letter-spacing: -.02em;
          font-weight: 800;
        }

        .ts-brand small {
          display: block;
          margin-top: 4px;
          color: #8a745f;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .ts-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ts-top-actions a {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          border-radius: 14px;
          padding: 0 14px;
          color: #332319;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ts-line);
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .ts-hero-card,
        .ts-profile-card,
        .ts-alert {
          background:
            radial-gradient(circle at 100% 0%, rgba(68,191,255,.12), transparent 28%),
            radial-gradient(circle at 0% 100%, rgba(255,201,61,.12), transparent 30%),
            var(--ts-card);
          border: 1px solid var(--ts-line);
          box-shadow: 0 14px 34px rgba(120,78,35,.10);
        }

        .ts-hero-card {
          display: grid;
          grid-template-columns: 1fr 130px;
          gap: 24px;
          align-items: center;
          border-radius: 28px;
          padding: 28px;
          margin-bottom: 18px;
        }

        .ts-eyebrow {
          margin: 0 0 10px;
          color: #d97016;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .ts-hero-card h1,
        .ts-section-head h2 {
          margin: 0;
          color: var(--ts-ink);
          font-size: clamp(30px, 5vw, 54px);
          line-height: .98;
          letter-spacing: -.04em;
          font-weight: 800;
        }

        .ts-lead {
          max-width: 620px;
          margin: 14px 0 0;
          color: var(--ts-muted);
          font-size: 17px;
          line-height: 1.55;
          font-weight: 500;
        }

        .ts-status {
          color: #147db2;
          font-weight: 700;
        }

        .ts-hero-orb {
          width: 124px;
          height: 124px;
          border-radius: 32px;
          overflow: hidden;
          background: linear-gradient(135deg,#ffc93d,#ff7a2f 52%,#44bfff);
          padding: 4px;
        }

        .ts-alert {
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 18px;
          color: #9f1239;
          font-weight: 700;
        }

        .ts-profile-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 18px;
          align-items: start;
          margin-bottom: 18px;
        }

        .ts-profile-card {
          border-radius: 26px;
          padding: 22px;
        }

        .ts-profile-summary {
          text-align: center;
        }

        .ts-avatar-shell {
          width: 138px;
          height: 138px;
          margin: 0 auto 16px;
          border-radius: 36px;
          overflow: hidden;
          background: linear-gradient(135deg,#ffc93d,#ff7a2f 52%,#44bfff);
          padding: 4px;
        }

        .ts-profile-summary h2 {
          margin: 0;
          font-size: 26px;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -.02em;
        }

        .ts-profile-summary p {
          margin: 8px 0 0;
          color: var(--ts-muted);
          font-weight: 600;
        }

        .ts-upload-button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 16px;
          border-radius: 16px;
          padding: 0 16px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .ts-upload-button input {
          display: none;
        }

        .ts-stats {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
          margin-top: 18px;
        }

        .ts-stats div {
          min-height: 72px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(255,250,242,.78);
          border: 1px solid var(--ts-line);
        }

        .ts-stats b {
          font-size: 24px;
          font-weight: 800;
        }

        .ts-stats span {
          color: var(--ts-muted);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .ts-section-head {
          margin-bottom: 18px;
        }

        .ts-section-head h2 {
          font-size: 30px;
        }

        .ts-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 14px;
        }

        .ts-form-grid label {
          display: grid;
          gap: 8px;
        }

        .ts-form-grid label.wide {
          grid-column: 1 / -1;
        }

        .ts-form-grid span {
          color: #6e6258;
          font-size: 13px;
          font-weight: 800;
        }

        .ts-form-grid input,
        .ts-form-grid textarea {
          width: 100%;
          border: 1px solid rgba(120,78,35,.16);
          outline: 0;
          border-radius: 16px;
          background: #fffaf2;
          color: #201610;
          padding: 13px 14px;
          font: 600 15px var(--ts-font);
        }

        .ts-form-grid textarea {
          resize: vertical;
          line-height: 1.5;
        }

        .ts-form-grid small {
          color: var(--ts-muted);
          font-size: 12px;
          line-height: 1.35;
        }

        .ts-form-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
        }

        .ts-form-actions button {
          min-height: 46px;
          border: 0;
          border-radius: 16px;
          padding: 0 18px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          font: 800 14px var(--ts-font);
          cursor: pointer;
        }

        .ts-form-actions span {
          color: #11834f;
          font-weight: 800;
        }

        .ts-public-preview {
          border-radius: 26px;
          padding: 22px;
        }

        .ts-preview-card {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 16px;
          align-items: start;
          border-radius: 22px;
          padding: 18px;
          background: rgba(255,250,242,.78);
          border: 1px solid var(--ts-line);
        }

        .ts-preview-orb {
          width: 72px;
          height: 72px;
        }

        .ts-preview-card h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -.02em;
        }

        .ts-preview-card p {
          margin: 6px 0 0;
          color: var(--ts-muted);
          font-weight: 600;
        }

        .ts-preview-bio {
          line-height: 1.55;
        }

        .ts-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .ts-tags span {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 11px;
          background: linear-gradient(135deg,#bfeeff,#62c9ff);
          color: #09202d;
          font-size: 12px;
          font-weight: 800;
        }

        .ts-mobile-nav {
          display: none;
        }

        @media (max-width: 820px) {
          .ts-page {
            padding-left: 0;
            padding-right: 0;
          }

          .ts-profile-topbar,
          .ts-hero-card,
          .ts-profile-grid,
          .ts-public-preview,
          .ts-alert {
            width: 100%;
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }

          .ts-profile-topbar {
            padding: 0 12px;
          }

          .ts-top-actions {
            display: none;
          }

          .ts-hero-card {
            grid-template-columns: 1fr 74px;
            padding: 18px 12px;
          }

          .ts-hero-card h1 {
            font-size: 30px;
          }

          .ts-lead {
            font-size: 15px;
          }

          .ts-hero-orb {
            width: 70px;
            height: 70px;
            border-radius: 22px;
          }

          .ts-profile-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .ts-profile-card,
          .ts-public-preview {
            padding: 18px 12px;
          }

          .ts-profile-summary {
            display: grid;
            grid-template-columns: 88px 1fr;
            text-align: left;
            align-items: center;
            gap: 14px;
          }

          .ts-avatar-shell {
            width: 82px;
            height: 82px;
            margin: 0;
            border-radius: 24px;
          }

          .ts-summary-copy {
            min-width: 0;
          }

          .ts-upload-button,
          .ts-stats {
            grid-column: 1 / -1;
          }

          .ts-form-grid {
            grid-template-columns: 1fr;
          }

          .ts-preview-card {
            grid-template-columns: 56px 1fr;
          }

          .ts-preview-orb {
            width: 56px;
            height: 56px;
          }

          .ts-mobile-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: max(0px, env(safe-area-inset-bottom));
            z-index: 80;
            height: 78px;
            display: grid;
            grid-template-columns: repeat(5,1fr);
            align-items: center;
            padding: 8px 8px max(8px, env(safe-area-inset-bottom));
            border-top: 1px solid rgba(120,78,35,.14);
            border-radius: 22px 22px 0 0;
            background: rgba(255,255,255,.92);
            box-shadow: 0 -14px 36px rgba(120,78,35,.14);
          }

          .ts-mobile-nav a {
            display: grid;
            place-items: center;
            gap: 5px;
            color: #6d5e50;
            text-decoration: none;
            font-size: 22px;
            font-weight: 700;
          }

          .ts-mobile-nav span {
            font-size: 12px;
            font-weight: 600;
          }

          .ts-mobile-nav .active {
            color: #d97016;
          }

          .ts-mobile-nav .publish {
            width: 62px;
            height: 62px;
            margin: -24px auto 0;
            border-radius: 50%;
            color: #201610;
            background: linear-gradient(135deg,#ffc93d,#ff9f35 48%,#ff7a2f);
            box-shadow: 0 0 0 8px rgba(255,201,61,.18), 0 18px 38px rgba(255,122,47,.24);
            font-size: 34px;
          }

          .ts-mobile-nav .publish span {
            position: absolute;
            margin-top: 78px;
            color: #5d4d3f;
            font-size: 11px;
          }
        }
      `}</style>
    </main>
  );
}
