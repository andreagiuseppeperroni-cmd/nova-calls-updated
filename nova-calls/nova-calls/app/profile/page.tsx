'use client';

import Link from 'next/link';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { ProfileOrb, useNovaProfile } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type WallPostRow = {
  id: string;
  city_id: string | null;
  user_id: string | null;
  content: string | null;
  post_type: string | null;
  status: string | null;
  created_at: string | null;
};

type CityRow = {
  id: string;
  name: string | null;
  slug: string | null;
  region?: string | null;
};

type MediaRow = {
  post_id: string;
  media_type: string | null;
  file_url: string | null;
  file_path: string | null;
};

type ProfileWallPost = {
  id: string;
  cityName: string;
  citySlug: string;
  content: string;
  type: string;
  mediaType: string;
  mediaUrl: string;
  createdAt: string;
};

type FrequentSquare = {
  cityName: string;
  citySlug: string;
  region: string;
  posts: number;
  lastActivity: string;
  types: string[];
};

type ActiveLinkRow = {
  link_id?: string | null;
  id?: string | null;
  other_user_id?: string | null;
  requester_id?: string | null;
  receiver_id?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  nova_points?: number | null;
  status?: string | null;
  updated_at?: string | null;
};

type PrivateMessageRow = {
  id: string;
  link_id?: string | null;
  sender_id?: string | null;
  receiver_id?: string | null;
  body?: string | null;
  message?: string | null;
  content?: string | null;
  text?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
};

type ChatPreview = {
  otherUserId: string;
  linkId: string;
  name: string;
  username: string;
  avatarUrl: string;
  city: string;
  points: number;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

function splitTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPostTypeLabel(type: string) {
  if (type === 'image') return 'Foto';
  if (type === 'audio') return 'Audio';
  if (type === 'video') return 'Video';
  if (type === 'mixed') return 'Multimedia';
  if (type === 'event') return 'Evento';
  if (type === 'news') return 'News';
  return 'Testo';
}

function formatDate(value: string) {
  if (!value) return 'recente';

  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'recente';
  }
}


function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'TS'
  );
}

function messageText(message: PrivateMessageRow) {
  return message.body || message.message || message.content || message.text || 'Messaggio privato';
}

function chatDisplayName(link: ActiveLinkRow) {
  return link.full_name || link.username || 'Utente The Square';
}

export default function ProfilePage() {
  const { profile, save, uploadAvatar, loading, syncError } = useNovaProfile();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [wallPosts, setWallPosts] = useState<ProfileWallPost[]>([]);
  const [frequentSquares, setFrequentSquares] = useState<FrequentSquare[]>([]);
  const [wallLoading, setWallLoading] = useState(true);

  const [activeChats, setActiveChats] = useState<ChatPreview[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);

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

  async function loadProfileWallActivity() {
    setWallLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setWallPosts([]);
      setFrequentSquares([]);
      setWallLoading(false);
      return;
    }

    const { data: postRows, error: postsError } = await supabase
      .from('city_wall_posts')
      .select('id, city_id, user_id, content, post_type, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(80);

    if (postsError) {
      setLocalError(postsError.message);
      setWallPosts([]);
      setFrequentSquares([]);
      setWallLoading(false);
      return;
    }

    const posts = (postRows || []) as WallPostRow[];
    const postIds = posts.map((post) => post.id);
    const cityIds = Array.from(new Set(posts.map((post) => post.city_id).filter(Boolean))) as string[];

    let mediaRows: MediaRow[] = [];
    let cityRows: CityRow[] = [];

    if (postIds.length > 0) {
      const { data } = await supabase
        .from('city_wall_post_media')
        .select('post_id, media_type, file_url, file_path')
        .in('post_id', postIds);

      mediaRows = (data || []) as MediaRow[];
    }

    if (cityIds.length > 0) {
      const { data } = await supabase
        .from('cities')
        .select('id, name, slug, region')
        .in('id', cityIds);

      cityRows = (data || []) as CityRow[];
    }

    const mediaMap = new Map<string, MediaRow>();
    for (const media of mediaRows) {
      if (!mediaMap.has(media.post_id)) {
        mediaMap.set(media.post_id, media);
      }
    }

    const cityMap = new Map(cityRows.map((city) => [city.id, city]));

    const mappedPosts: ProfileWallPost[] = posts.map((post) => {
      const city = post.city_id ? cityMap.get(post.city_id) : null;
      const media = mediaMap.get(post.id);
      const type = post.post_type || media?.media_type || 'text';

      return {
        id: post.id,
        cityName: city?.name || 'Wall',
        citySlug: city?.slug || 'cities',
        content: post.content || 'Post pubblicato sul Wall.',
        type,
        mediaType: media?.media_type || '',
        mediaUrl: media?.file_url || '',
        createdAt: post.created_at || '',
      };
    });

    const squaresMap = new Map<string, FrequentSquare>();

    for (const post of mappedPosts) {
      const key = post.citySlug || post.cityName;
      const current = squaresMap.get(key);

      if (!current) {
        const city = cityRows.find((item) => (item.slug || item.name) === key || item.name === post.cityName);

        squaresMap.set(key, {
          cityName: post.cityName,
          citySlug: post.citySlug,
          region: city?.region || 'Italia',
          posts: 1,
          lastActivity: post.createdAt,
          types: [getPostTypeLabel(post.type)],
        });
      } else {
        current.posts += 1;
        current.types = Array.from(new Set([...current.types, getPostTypeLabel(post.type)])).slice(0, 4);

        if (post.createdAt && (!current.lastActivity || new Date(post.createdAt) > new Date(current.lastActivity))) {
          current.lastActivity = post.createdAt;
        }
      }
    }

    setWallPosts(mappedPosts);
    setFrequentSquares(Array.from(squaresMap.values()).sort((a, b) => b.posts - a.posts));
    setWallLoading(false);
  }

  async function loadProfileChats() {
    setChatLoading(true);
    setChatError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActiveChats([]);
      setChatLoading(false);
      return;
    }

    let links: ActiveLinkRow[] = [];

    const { data: rpcRows, error: rpcError } = await supabase.rpc('get_my_active_links');

    if (!rpcError && rpcRows) {
      links = (rpcRows as ActiveLinkRow[]).filter((link) => Boolean(link.other_user_id));
    } else {
      const { data: linkRows, error: linkError } = await supabase
        .from('user_links')
        .select('id, requester_id, receiver_id, status, updated_at')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (linkError) {
        setChatError(linkError.message);
        setActiveChats([]);
        setChatLoading(false);
        return;
      }

      const acceptedLinks = ((linkRows || []) as ActiveLinkRow[]).filter((link) => {
        const status = String(link.status || 'accepted').toLowerCase();
        return !['rejected', 'blocked', 'declined', 'cancelled'].includes(status);
      });

      const otherIds = Array.from(
        new Set(
          acceptedLinks
            .map((link) => (link.requester_id === user.id ? link.receiver_id : link.requester_id))
            .filter(Boolean)
        )
      ) as string[];

      let profileRows: ActiveLinkRow[] = [];

      if (otherIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, city, nova_points')
          .in('id', otherIds);

        profileRows = (data || []) as ActiveLinkRow[];
      }

      const profileMap = new Map(profileRows.map((profile) => [profile.id || profile.other_user_id || '', profile]));

      links = acceptedLinks.map((link) => {
        const otherUserId = link.requester_id === user.id ? link.receiver_id : link.requester_id;
        const publicProfile = otherUserId ? profileMap.get(otherUserId) : null;

        return {
          ...link,
          link_id: link.id,
          other_user_id: otherUserId,
          full_name: publicProfile?.full_name || publicProfile?.username || null,
          username: publicProfile?.username || null,
          avatar_url: publicProfile?.avatar_url || null,
          city: publicProfile?.city || null,
          nova_points: publicProfile?.nova_points || 0,
        };
      });
    }

    const otherIds = Array.from(new Set(links.map((link) => link.other_user_id).filter(Boolean))) as string[];
    const linkIds = Array.from(new Set(links.map((link) => link.link_id || link.id).filter(Boolean))) as string[];
    const linkIdToOtherId = new Map(links.map((link) => [link.link_id || link.id || '', link.other_user_id || '']));
    let messages: PrivateMessageRow[] = [];

    if (linkIds.length > 0) {
      const { data: linkedRows, error: linkedError } = await supabase
        .from('private_messages')
        .select('*')
        .in('link_id', linkIds)
        .order('created_at', { ascending: false })
        .limit(160);

      if (!linkedError) {
        messages = (linkedRows || []) as PrivateMessageRow[];
      } else if (otherIds.length > 0) {
        const [{ data: sentRows, error: sentError }, { data: receivedRows, error: receivedError }] = await Promise.all([
          supabase
            .from('private_messages')
            .select('*')
            .eq('sender_id', user.id)
            .in('receiver_id', otherIds)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase
            .from('private_messages')
            .select('*')
            .eq('receiver_id', user.id)
            .in('sender_id', otherIds)
            .order('created_at', { ascending: false })
            .limit(120),
        ]);

        if (sentError || receivedError) {
          setChatError(linkedError.message || sentError?.message || receivedError?.message || 'Impossibile leggere i messaggi privati.');
        } else {
          messages = ([...(sentRows || []), ...(receivedRows || [])] as PrivateMessageRow[]).sort(
            (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          );
        }
      }
    }

    const messageMap = new Map<string, PrivateMessageRow>();
    const unreadMap = new Map<string, number>();

    for (const message of messages) {
      const otherUserId = message.link_id
        ? linkIdToOtherId.get(message.link_id)
        : message.sender_id === user.id
          ? message.receiver_id
          : message.sender_id;

      if (!otherUserId) continue;

      if (!messageMap.has(otherUserId)) {
        messageMap.set(otherUserId, message);
      }

      if (message.receiver_id === user.id && message.is_read === false) {
        unreadMap.set(otherUserId, (unreadMap.get(otherUserId) || 0) + 1);
      }
    }

    const previews = links
      .filter((link) => Boolean(link.other_user_id))
      .map((link) => {
        const otherUserId = link.other_user_id || '';
        const lastMessage = messageMap.get(otherUserId);
        const name = chatDisplayName(link);

        return {
          otherUserId,
          linkId: link.link_id || link.id || '',
          name,
          username: link.username || '',
          avatarUrl: link.avatar_url || '',
          city: link.city || 'Italia',
          points: link.nova_points || 0,
          lastMessage: lastMessage ? messageText(lastMessage) : 'Chat attiva: nessun messaggio recente.',
          lastAt: lastMessage?.created_at || link.updated_at || '',
          unread: unreadMap.get(otherUserId) || 0,
        };
      })
      .sort((a, b) => new Date(b.lastAt || '').getTime() - new Date(a.lastAt || '').getTime());

    setActiveChats(previews);
    setChatLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function start() {
      if (!active) return;
      await Promise.all([loadProfileWallActivity(), loadProfileChats()]);
    }

    start();

    const channel = supabase
      .channel('profile-page-activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'city_wall_posts',
        },
        async () => {
          await loadProfileWallActivity();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'city_wall_post_media',
        },
        async () => {
          await loadProfileWallActivity();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
        },
        async () => {
          await loadProfileChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_links',
        },
        async () => {
          await loadProfileChats();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

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
            Qui trovi identità, chat attive, post pubblicati sui Wall e Piazze che frequenti.
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
              <b>{wallPosts.length}</b>
              <span>Post Wall</span>
            </div>
            <div>
              <b>{frequentSquares.length}</b>
              <span>Piazze</span>
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

      <section className="ts-profile-card ts-chat-section">
        <div className="ts-section-head ts-section-split">
          <div>
            <p className="ts-eyebrow">Messaggi privati</p>
            <h2>Chat attive</h2>
          </div>
          <Link href="/messages">Apri messaggi</Link>
        </div>

        {chatLoading && (
          <div className="ts-empty-state">
            <b>Carico le chat…</b>
            <span>Sto collegando i legami attivi ai messaggi privati già inviati.</span>
          </div>
        )}

        {!chatLoading && chatError && (
          <div className="ts-empty-state">
            <b>Non riesco a leggere le chat</b>
            <span>{chatError}</span>
          </div>
        )}

        {!chatLoading && !chatError && activeChats.length === 0 && (
          <div className="ts-empty-state">
            <b>Nessuna chat attiva</b>
            <span>Quando avrai legami attivi o messaggi privati, le conversazioni appariranno qui.</span>
            <Link href="/people">Cerca legami</Link>
          </div>
        )}

        {!chatLoading && activeChats.length > 0 && (
          <div className="ts-chat-grid">
            {activeChats.map((chat) => (
              <Link
                href={chat.linkId ? `/messages?link=${chat.linkId}` : `/messages?user=${chat.otherUserId}`}
                className="ts-chat-card"
                key={chat.otherUserId}
              >
                <div className="ts-chat-avatar">
                  {chat.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={chat.avatarUrl} alt="" />
                  ) : (
                    initials(chat.name)
                  )}
                </div>

                <div className="ts-chat-copy">
                  <b>{chat.name}</b>
                  <span>{chat.city} · {chat.points} punti</span>
                  <p>{chat.lastMessage}</p>
                </div>

                <div className="ts-chat-side">
                  <small>{formatDate(chat.lastAt)}</small>
                  {chat.unread > 0 && <em>{chat.unread}</em>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="ts-profile-card ts-wall-section">
        <div className="ts-section-head ts-section-split">
          <div>
            <p className="ts-eyebrow">Attività pubblica</p>
            <h2>Post pubblicati sui Wall</h2>
          </div>
          <Link href="/#composer">Pubblica nuovo</Link>
        </div>

        {wallLoading && (
          <div className="ts-empty-state">
            <b>Carico i tuoi post…</b>
            <span>Sto leggendo le pubblicazioni dai Wall di città.</span>
          </div>
        )}

        {!wallLoading && wallPosts.length === 0 && (
          <div className="ts-empty-state">
            <b>Nessun post pubblicato</b>
            <span>Quando pubblicherai su un Wall, i tuoi contenuti appariranno qui.</span>
            <Link href="/#composer">Scrivi il primo post</Link>
          </div>
        )}

        {!wallLoading && wallPosts.length > 0 && (
          <div className="ts-wall-posts">
            {wallPosts.slice(0, 12).map((post) => (
              <article className="ts-wall-post" key={post.id}>
                <div className="ts-wall-post-head">
                  <span>{getPostTypeLabel(post.type)}</span>
                  <small>{formatDate(post.createdAt)}</small>
                </div>

                <h3>{post.content.split('\n')[0].slice(0, 92)}</h3>

                <p>{post.content}</p>

                {post.mediaUrl && post.mediaType === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.mediaUrl} alt="" />
                )}

                {post.mediaUrl && post.mediaType === 'audio' && (
                  <audio controls src={post.mediaUrl} />
                )}

                {post.mediaUrl && post.mediaType === 'video' && (
                  <video controls src={post.mediaUrl} />
                )}

                <Link href={`/cities/${post.citySlug}`}>Wall di {post.cityName} →</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ts-profile-card ts-square-section">
        <div className="ts-section-head">
          <p className="ts-eyebrow">Piazze frequentate</p>
          <h2>Wall e città dove sei più presente</h2>
        </div>

        {wallLoading && (
          <div className="ts-empty-state">
            <b>Carico le Piazze…</b>
            <span>Sto ricostruendo i Wall in cui hai pubblicato.</span>
          </div>
        )}

        {!wallLoading && frequentSquares.length === 0 && (
          <div className="ts-empty-state">
            <b>Ancora nessuna Piazza frequentata</b>
            <span>Le Piazze vengono create automaticamente dai Wall in cui pubblichi.</span>
          </div>
        )}

        {!wallLoading && frequentSquares.length > 0 && (
          <div className="ts-square-grid">
            {frequentSquares.map((square) => (
              <Link href={`/cities/${square.citySlug}`} className="ts-square-card" key={square.citySlug}>
                <div>
                  <b>{square.cityName}</b>
                  <span>{square.region} · ultima attività {formatDate(square.lastActivity)}</span>
                </div>

                <strong>{square.posts}</strong>

                <div className="ts-square-tags">
                  {square.types.map((type) => (
                    <em key={type}>{type}</em>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
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
        .ts-wall-section,
        .ts-square-section,
        .ts-chat-section,
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
          margin-bottom: 18px;
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

        .ts-section-split {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-end;
        }

        .ts-section-split > a {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          border-radius: 14px;
          padding: 0 14px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          text-decoration: none;
          font-weight: 800;
          white-space: nowrap;
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

        .ts-tags,
        .ts-square-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .ts-tags span,
        .ts-square-tags em {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 11px;
          background: linear-gradient(135deg,#bfeeff,#62c9ff);
          color: #09202d;
          font-size: 12px;
          font-style: normal;
          font-weight: 800;
        }

        .ts-chat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 14px;
        }

        .ts-chat-card {
          display: grid;
          grid-template-columns: 58px 1fr auto;
          gap: 12px;
          align-items: center;
          min-height: 104px;
          border-radius: 22px;
          padding: 14px;
          background: rgba(255,250,242,.78);
          border: 1px solid var(--ts-line);
          color: var(--ts-ink);
          text-decoration: none;
        }

        .ts-chat-avatar {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 16px;
          background: linear-gradient(135deg,#ffc93d,#ff7a2f 52%,#44bfff);
          color: #201610;
          font-weight: 900;
        }

        .ts-chat-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ts-chat-copy {
          min-width: 0;
        }

        .ts-chat-copy b {
          display: block;
          color: var(--ts-ink);
          font-size: 18px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -.02em;
        }

        .ts-chat-copy span {
          display: block;
          margin-top: 4px;
          color: var(--ts-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .ts-chat-copy p {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          margin: 6px 0 0;
          color: #6f6256;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 600;
        }

        .ts-chat-side {
          display: grid;
          justify-items: end;
          gap: 8px;
        }

        .ts-chat-side small {
          color: var(--ts-muted);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ts-chat-side em {
          min-width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          font-style: normal;
          font-size: 12px;
          font-weight: 900;
        }

        .ts-wall-posts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 14px;
        }

        .ts-wall-post {
          display: grid;
          gap: 10px;
          border-radius: 22px;
          padding: 16px;
          background: rgba(255,250,242,.78);
          border: 1px solid var(--ts-line);
        }

        .ts-wall-post-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .ts-wall-post-head span {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 10px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          font-size: 12px;
          font-weight: 800;
        }

        .ts-wall-post-head small {
          color: var(--ts-muted);
          font-weight: 700;
        }

        .ts-wall-post h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.15;
          letter-spacing: -.02em;
          font-weight: 800;
        }

        .ts-wall-post p {
          margin: 0;
          color: #6f6256;
          font-size: 14px;
          line-height: 1.45;
        }

        .ts-wall-post img,
        .ts-wall-post video {
          display: block;
          width: 100%;
          max-height: 230px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid var(--ts-line);
        }

        .ts-wall-post audio {
          width: 100%;
        }

        .ts-wall-post > a {
          color: #147db2;
          text-decoration: none;
          font-weight: 800;
          font-size: 13px;
        }

        .ts-square-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 14px;
        }

        .ts-square-card {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: start;
          min-height: 150px;
          border-radius: 22px;
          padding: 16px;
          background: rgba(255,250,242,.78);
          border: 1px solid var(--ts-line);
          color: var(--ts-ink);
          text-decoration: none;
        }

        .ts-square-card b {
          display: block;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -.02em;
        }

        .ts-square-card span {
          display: block;
          margin-top: 6px;
          color: var(--ts-muted);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.35;
        }

        .ts-square-card strong {
          min-width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          font-size: 20px;
          font-weight: 900;
        }

        .ts-square-tags {
          grid-column: 1 / -1;
          margin-top: 0;
        }

        .ts-empty-state {
          display: grid;
          gap: 8px;
          border-radius: 22px;
          padding: 20px;
          background: rgba(255,250,242,.78);
          border: 1px solid var(--ts-line);
        }

        .ts-empty-state b {
          font-size: 20px;
          font-weight: 800;
        }

        .ts-empty-state span {
          color: var(--ts-muted);
          font-weight: 600;
        }

        .ts-empty-state a {
          width: fit-content;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          margin-top: 6px;
          border-radius: 14px;
          padding: 0 14px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          text-decoration: none;
          font-weight: 800;
        }

        .ts-mobile-nav {
          display: none;
        }

        @media (max-width: 980px) {
          .ts-wall-posts,
          .ts-square-grid,
          .ts-chat-grid {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }
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
          .ts-wall-section,
          .ts-square-section,
          .ts-chat-section,
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
          .ts-public-preview,
          .ts-wall-section,
          .ts-square-section,
          .ts-chat-section {
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

          .ts-form-grid,
          .ts-wall-posts,
          .ts-square-grid,
          .ts-chat-grid {
            grid-template-columns: 1fr;
          }

          .ts-section-split {
            align-items: flex-start;
            flex-direction: column;
          }

          .ts-section-split > a {
            width: 100%;
            justify-content: center;
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
