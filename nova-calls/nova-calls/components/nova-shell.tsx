'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ProfileOrb } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type FeedKind = 'text' | 'photo' | 'audio' | 'video' | 'news';

type FeedPost = {
  id: string;
  author: string;
  initials: string;
  city: string;
  citySlug: string;
  topic: string;
  topicSlug: string;
  time: string;
  wall: string;
  kind: FeedKind;
  title: string;
  text: string;
  likes: number;
  comments: number;
  audioReplies: number;
  rooms: number;
  accent?: 'yellow' | 'cyan' | 'pink' | 'green' | 'blue';
  mediaUrl?: string;
  mediaName?: string;
};

type CityPulse = {
  id: string;
  city_id: string;
  title: string;
  slug: string;
  description: string | null;
  topic: string;
  status: 'growing' | 'active' | 'room_open' | 'resolved' | 'archived';
  intensity: number;
  people_count: number;
  posts_count: number;
  audio_count: number;
  video_count: number;
  outcome: string | null;
  cities?: {
    name: string | null;
    slug: string | null;
  } | null;
};

type PulsePostLink = {
  pulse_id: string;
  post_id: string;
};

type ComposerMediaKind = 'text' | 'image' | 'audio' | 'video';

type PrivateMessageRow = {
  id: string;
  link_id: string | null;
  sender_id: string;
  receiver_id: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type ChatProfile = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  nova_points?: number | null;
};

type UserLinkRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string | null;
  updated_at?: string | null;
};

type RpcLinkRow = {
  link_id: string;
  other_user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  nova_points: number | null;
  updated_at: string | null;
};

type ChatPreview = {
  otherUserId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  linkId: string | null;
  body: string;
  time: string;
  unread: number;
  accent: 'yellow' | 'cyan' | 'pink' | 'green' | 'blue';
};

const cityTabs = [
  { label: 'Per te', slug: 'for-you', icon: '✨' },
  { label: 'Roma', slug: 'roma', icon: '📍' },
  { label: 'Milano', slug: 'milano', icon: '🏙️' },
  { label: 'Napoli', slug: 'napoli', icon: '🌊' },
  { label: 'Vicino a me', slug: 'nearby', icon: '🧭' },
  { label: 'Seguiti', slug: 'following', icon: '👥' },
];

const topics = [
  { label: 'Tutto', slug: 'all' },
  { label: 'Eventi', slug: 'eventi', icon: '🎟️' },
  { label: 'News', slug: 'news', icon: '📰' },
  { label: 'Mobilità', slug: 'mobilita', icon: '🚇' },
  { label: 'Food', slug: 'food', icon: '🍝' },
  { label: 'Lavoro', slug: 'lavoro', icon: '💼' },
  { label: 'Audio', slug: 'audio', icon: '🎙️' },
  { label: 'Video', slug: 'video', icon: '🎬' },
  { label: 'Socialità', slug: 'socialita', icon: '🤝' },
];

const feedPosts: FeedPost[] = [
  {
    id: 'roma-mobilita-1',
    author: 'Andrea Perroni',
    initials: 'A',
    city: 'Roma',
    citySlug: 'roma',
    topic: 'Mobilità',
    topicSlug: 'mobilita',
    time: '12 minuti fa',
    wall: 'Wall Roma',
    kind: 'photo',
    title: 'La nuova viabilità a Prati funziona davvero o sta solo spostando il traffico?',
    text: 'Mi piacerebbe sentire chi vive lì tutti i giorni. Io ho visto più caos nelle vie laterali, ma magari è solo questione di abitudine.',
    likes: 128,
    comments: 42,
    audioReplies: 9,
    rooms: 3,
    accent: 'yellow',
  },
  {
    id: 'roma-eventi-audio-1',
    author: 'Giulia Romano',
    initials: 'G',
    city: 'Roma',
    citySlug: 'roma',
    topic: 'Eventi',
    topicSlug: 'audio',
    time: '35 minuti fa',
    wall: 'Voice Wall',
    kind: 'audio',
    title: 'Andare agli eventi da soli è ancora un tabù?',
    text: 'Ho lasciato un audio perché secondo me il vero problema non è trovare eventi, ma andarci senza sentirsi fuori posto.',
    likes: 84,
    comments: 18,
    audioReplies: 21,
    rooms: 1,
    accent: 'cyan',
  },
  {
    id: 'milano-food-1',
    author: 'Marco B.',
    initials: 'M',
    city: 'Milano',
    citySlug: 'milano',
    topic: 'Food',
    topicSlug: 'food',
    time: '1 ora fa',
    wall: 'Wall Milano',
    kind: 'text',
    title: 'Il miglior posto per cena economica ma bella in zona Isola?',
    text: 'Budget 25/30 euro, atmosfera tranquilla, magari con tavoli esterni. Vale anche qualcosa di poco conosciuto.',
    likes: 51,
    comments: 33,
    audioReplies: 4,
    rooms: 0,
    accent: 'pink',
  },
  {
    id: 'napoli-news-video-1',
    author: 'Square News',
    initials: 'S',
    city: 'Napoli',
    citySlug: 'napoli',
    topic: 'News',
    topicSlug: 'video',
    time: '1 ora fa',
    wall: 'News locale',
    kind: 'video',
    title: 'Nuovo evento musicale sul lungomare: il Wall sta già organizzando gruppi',
    text: 'Da questa notizia sono nate due stanze: una per chi cerca compagnia e una per chi vuole arrivare prima e organizzarsi.',
    likes: 211,
    comments: 76,
    audioReplies: 15,
    rooms: 2,
    accent: 'green',
  },
  {
    id: 'roma-lavoro-1',
    author: 'Sara N.',
    initials: 'S',
    city: 'Roma',
    citySlug: 'roma',
    topic: 'Lavoro',
    topicSlug: 'lavoro',
    time: '2 ore fa',
    wall: 'Wall Roma',
    kind: 'text',
    title: 'Cerco un coworking non freddo e non troppo “startup finta” a Roma Est',
    text: 'Mi serve un posto umano, dove lavorare ma anche conoscere qualcuno. Avete esperienze dirette?',
    likes: 67,
    comments: 29,
    audioReplies: 6,
    rooms: 1,
    accent: 'blue',
  },
  {
    id: 'milano-socialita-audio-1',
    author: 'Luca V.',
    initials: 'L',
    city: 'Milano',
    citySlug: 'milano',
    topic: 'Socialità',
    topicSlug: 'audio',
    time: '3 ore fa',
    wall: 'Voice Wall',
    kind: 'audio',
    title: 'A Milano è facile conoscere persone o siamo tutti troppo di corsa?',
    text: 'Una riflessione vocale sul fatto che la città offre tantissimo, ma spesso manca il contesto giusto per iniziare una conversazione.',
    likes: 142,
    comments: 58,
    audioReplies: 24,
    rooms: 4,
    accent: 'cyan',
  },
];

const followedCities = [
  ['RM', 'Roma', '128 post oggi · 43 audio'],
  ['MI', 'Milano', '96 post oggi · 21 video'],
  ['NA', 'Napoli', '88 post oggi · 18 eventi'],
];

const fallbackChats: ChatPreview[] = [
  {
    otherUserId: 'demo-giulia',
    name: 'Giulia Romano',
    initials: 'G',
    avatarUrl: null,
    linkId: null,
    body: 'Ti ho mandato l’audio dell’evento di venerdì.',
    time: 'demo',
    unread: 0,
    accent: 'cyan',
  },
  {
    otherUserId: 'demo-marco',
    name: 'Marco B.',
    initials: 'M',
    avatarUrl: null,
    linkId: null,
    body: 'Ho creato una stanza su Isola, entra quando vuoi.',
    time: 'demo',
    unread: 0,
    accent: 'pink',
  },
  {
    otherUserId: 'demo-sara',
    name: 'Sara N.',
    initials: 'S',
    avatarUrl: null,
    linkId: null,
    body: 'Mi consigli quel coworking zona Roma Est?',
    time: 'demo',
    unread: 0,
    accent: 'green',
  },
];

function getInitials(name: string) {
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

function getProfileName(profile: ChatProfile | undefined | null) {
  return (
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    profile?.username ||
    ''
  ).trim();
}


function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function timeLabel(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));

  if (Number.isNaN(date.getTime())) return '';
  if (minutes < 1) return 'ora';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} g`;
}

export function NovaHome() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [activeCity, setActiveCity] = useState('for-you');
  const [activeTopic, setActiveTopic] = useState('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<PrivateMessageRow[]>([]);
  const [replyBody, setReplyBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [chatLinkSearch, setChatLinkSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ChatPreview | null>(null);
  const [userPosts, setUserPosts] = useState<FeedPost[]>([]);
  const [cityPulses, setCityPulses] = useState<CityPulse[]>([]);
  const [linkedPulsePosts, setLinkedPulsePosts] = useState<PulsePostLink[]>([]);
  const [pulseActionMessage, setPulseActionMessage] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [composerMediaKind, setComposerMediaKind] = useState<ComposerMediaKind>('text');
  const [composerFile, setComposerFile] = useState<File | null>(null);
  const [composerPreviewUrl, setComposerPreviewUrl] = useState('');
  const [composerPosting, setComposerPosting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const visiblePosts = useMemo(() => {
    const query = normalizeSearchValue(searchQuery.trim());

    return [...userPosts, ...feedPosts].filter((post) => {
      const cityMatch = activeCity === 'for-you' || activeCity === 'nearby' || activeCity === 'following' || post.citySlug === activeCity;
      const topicMatch =
        activeTopic === 'all' ||
        post.topicSlug === activeTopic ||
        (activeTopic === 'eventi' && post.topicSlug === 'audio' && post.topic === 'Eventi') ||
        (activeTopic === 'news' && (post.kind === 'news' || post.topic === 'News')) ||
        (activeTopic === 'audio' && post.kind === 'audio') ||
        (activeTopic === 'video' && post.kind === 'video');

      const searchMatch =
        !query ||
        normalizeSearchValue(`${post.author} ${post.city} ${post.topic} ${post.title} ${post.text} ${post.wall}`).includes(query);

      return cityMatch && topicMatch && searchMatch;
    });
  }, [activeCity, activeTopic, userPosts, searchQuery]);

  const activeCityPulses = useMemo(() => {
    return cityPulses
      .filter((pulse) => {
        const citySlug = pulse.cities?.slug || '';

        return activeCity === 'for-you' || activeCity === 'nearby' || activeCity === 'following' || citySlug === activeCity;
      })
      .sort((a, b) => (b.intensity || 0) - (a.intensity || 0));
  }, [activeCity, cityPulses]);

  const selectedChat = useMemo(() => {
    return chatPreviews.find((chat) => chat.otherUserId === selectedChatId) || chatPreviews[0] || fallbackChats[0];
  }, [chatPreviews, selectedChatId]);

  const chatsToShow = chatPreviews.length ? chatPreviews : fallbackChats;

  const homeFilteredChats = useMemo(() => {
    const query = normalizeSearchValue(linkSearch.trim());

    if (!query) return chatsToShow;

    return chatsToShow.filter((chat) =>
      normalizeSearchValue(`${chat.name} ${chat.body} ${chat.initials}`).includes(query)
    );
  }, [chatsToShow, linkSearch]);

  const drawerFilteredChats = useMemo(() => {
    const query = normalizeSearchValue(chatLinkSearch.trim());

    if (!query) return chatsToShow;

    return chatsToShow.filter((chat) =>
      normalizeSearchValue(`${chat.name} ${chat.body} ${chat.initials}`).includes(query)
    );
  }, [chatsToShow, chatLinkSearch]);


  function openComposer(kind: ComposerMediaKind = 'text') {
    setComposerMediaKind(kind);
    setComposerOpen(true);
    setComposerError(null);

    window.setTimeout(() => {
      document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function openComposerWithUpload(kind: ComposerMediaKind) {
    openComposer(kind);

    window.setTimeout(() => {
      if (kind === 'image') imageInputRef.current?.click();
      if (kind === 'audio') audioInputRef.current?.click();
      if (kind === 'video') videoInputRef.current?.click();
    }, 140);
  }

  function getBestPulseForPost(post: FeedPost) {
    const cityMatches = cityPulses.filter((pulse) => {
      const citySlug = pulse.cities?.slug || '';
      const topic = normalizeSearchValue(pulse.topic || '');
      const title = normalizeSearchValue(pulse.title || '');
      const postTopic = normalizeSearchValue(post.topic || post.topicSlug || '');

      const sameCity = citySlug === post.citySlug;
      const sameTopic = topic.includes(postTopic) || title.includes(postTopic) || postTopic.includes(topic);

      return sameCity && (sameTopic || postTopic === 'all');
    });

    return cityMatches[0] || cityPulses.find((pulse) => pulse.cities?.slug === post.citySlug) || cityPulses[0] || null;
  }

  async function loadCityPulses() {
    const { data: pulsesData, error: pulsesError } = await supabase
      .from('city_pulses')
      .select(`
        id,
        city_id,
        title,
        slug,
        description,
        topic,
        status,
        intensity,
        people_count,
        posts_count,
        audio_count,
        video_count,
        outcome,
        cities (
          name,
          slug
        )
      `)
      .in('status', ['growing', 'active', 'room_open'])
      .order('intensity', { ascending: false })
      .limit(18);

    if (!pulsesError) {
      setCityPulses((pulsesData || []) as CityPulse[]);
    }

    const { data: pulsePostRows } = await supabase
      .from('pulse_posts')
      .select('pulse_id, post_id')
      .limit(300);

    setLinkedPulsePosts((pulsePostRows || []) as PulsePostLink[]);
  }

  async function addPostToPulse(post: FeedPost) {
    const pulse = getBestPulseForPost(post);

    if (!pulse) {
      setPulseActionMessage('Nessun Pulse disponibile per questo Wall. Crea prima un Pulse dalla città.');
      window.setTimeout(() => setPulseActionMessage(null), 2400);
      return;
    }

    if (post.id.includes('-') && !post.id.startsWith('local-') && !post.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
      setPulseActionMessage('I post demo non possono essere aggiunti ai Pulse. Pubblica un post reale sul Wall.');
      window.setTimeout(() => setPulseActionMessage(null), 2600);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPulseActionMessage('Devi effettuare il login per aggiungere un post a un Pulse.');
      window.setTimeout(() => setPulseActionMessage(null), 2400);
      return;
    }

    const { error } = await supabase
      .from('pulse_posts')
      .insert({
        pulse_id: pulse.id,
        post_id: post.id,
        added_by: user.id,
      });

    if (error) {
      const alreadyLinked = error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('unique');

      setPulseActionMessage(alreadyLinked ? 'Questo post è già dentro il Pulse.' : error.message);
      window.setTimeout(() => setPulseActionMessage(null), 2600);
      return;
    }

    setLinkedPulsePosts((items) => [...items, { pulse_id: pulse.id, post_id: post.id }]);
    setPulseActionMessage(`Post aggiunto al Pulse “${pulse.title}”.`);
    await loadCityPulses();
    window.setTimeout(() => setPulseActionMessage(null), 2600);
  }

  function handleComposerFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setComposerFile(file);
    setComposerError(null);

    if (composerPreviewUrl) {
      URL.revokeObjectURL(composerPreviewUrl);
    }

    setComposerPreviewUrl(URL.createObjectURL(file));

    if (file.type.startsWith('image/')) setComposerMediaKind('image');
    else if (file.type.startsWith('audio/')) setComposerMediaKind('audio');
    else if (file.type.startsWith('video/')) setComposerMediaKind('video');
  }

  function resetComposer() {
    setComposerText('');
    setComposerMediaKind('text');
    setComposerFile(null);
    if (composerPreviewUrl) URL.revokeObjectURL(composerPreviewUrl);
    setComposerPreviewUrl('');
    setComposerError(null);
  }

  async function publishWallPost() {
    const content = composerText.trim();

    if (!content && !composerFile) {
      setComposerError('Scrivi qualcosa oppure allega un file prima di pubblicare.');
      return;
    }

    setComposerPosting(true);
    setComposerError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setComposerError('Devi effettuare il login per pubblicare sul Wall.');
        return;
      }

      const citySlug = ['roma', 'milano', 'napoli'].includes(activeCity) ? activeCity : 'roma';
      const { data: cityRow, error: cityError } = await supabase
        .from('cities')
        .select('id, name, slug')
        .eq('slug', citySlug)
        .single();

      if (cityError || !cityRow) {
        setComposerError('Non riesco a trovare la città selezionata su Supabase. Controlla che la tabella cities contenga Roma/Milano/Napoli e che is_active sia true.');
        return;
      }

      const detectedKind: ComposerMediaKind = composerFile?.type.startsWith('image/')
        ? 'image'
        : composerFile?.type.startsWith('audio/')
          ? 'audio'
          : composerFile?.type.startsWith('video/')
            ? 'video'
            : composerMediaKind;

      const postType = composerFile ? detectedKind : 'text';

      const { data: postRow, error: postError } = await supabase
        .from('city_wall_posts')
        .insert({
          city_id: cityRow.id,
          user_id: user.id,
          content: content || (composerFile ? `Nuovo contenuto ${detectedKind} pubblicato sul Wall.` : ''),
          post_type: postType,
          visibility: 'public',
          status: 'published',
        })
        .select('id, created_at')
        .single();

      if (postError || !postRow) {
        setComposerError(postError?.message || 'Non sono riuscito a pubblicare il post.');
        return;
      }

      let publicUrl = '';

      if (composerFile) {
        const safeName = composerFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const filePath = `${user.id}/${postRow.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('city-wall-media')
          .upload(filePath, composerFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: composerFile.type,
          });

        if (uploadError) {
          setComposerError(uploadError.message);
          return;
        }

        const { data: publicData } = supabase.storage.from('city-wall-media').getPublicUrl(filePath);
        publicUrl = publicData.publicUrl;

        const { error: mediaError } = await supabase.from('city_wall_post_media').insert({
          post_id: postRow.id,
          user_id: user.id,
          media_type: detectedKind,
          file_url: publicUrl,
          file_path: filePath,
          mime_type: composerFile.type,
          size_bytes: composerFile.size,
        });

        if (mediaError) {
          setComposerError(mediaError.message);
          return;
        }
      }

      const title = content ? content.split('\n')[0].slice(0, 110) : composerFile ? `Nuovo ${detectedKind} sul Wall` : 'Nuovo post sul Wall';

      setUserPosts((posts) => [
        {
          id: postRow.id,
          author: 'Tu',
          initials: 'TU',
          city: cityRow.name,
          citySlug: cityRow.slug,
          topic: topics.find((topic) => topic.slug === activeTopic)?.label || 'Wall',
          topicSlug: activeTopic === 'all' ? 'socialita' : activeTopic,
          time: 'ora',
          wall: `Wall ${cityRow.name}`,
          kind: detectedKind === 'image' ? 'photo' : detectedKind === 'audio' ? 'audio' : detectedKind === 'video' ? 'video' : 'text',
          title,
          text: content || (composerFile ? composerFile.name : ''),
          likes: 0,
          comments: 0,
          audioReplies: 0,
          rooms: 0,
          accent: 'yellow',
          mediaUrl: publicUrl || composerPreviewUrl,
          mediaName: composerFile?.name,
        },
        ...posts,
      ]);

      await loadWallPosts();
      resetComposer();
      setComposerOpen(false);
    } finally {
      setComposerPosting(false);
    }
  }


  async function loadWallPosts() {
    const { data: postRows, error: postsError } = await supabase
      .from('city_wall_posts')
      .select('id, city_id, user_id, content, post_type, status, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(80);

    if (postsError) {
      setComposerError(postsError.message);
      return;
    }

    const posts = postRows || [];
    const postIds = posts.map((post) => post.id);
    const cityIds = Array.from(new Set(posts.map((post) => post.city_id).filter(Boolean)));
    const userIds = Array.from(new Set(posts.map((post) => post.user_id).filter(Boolean)));

    let mediaRows: Array<{
      post_id: string;
      media_type: string | null;
      file_url: string | null;
      file_path: string | null;
    }> = [];

    let cityRows: Array<{
      id: string;
      name: string | null;
      slug: string | null;
    }> = [];

    let profileRows: Array<{
      id: string;
      full_name: string | null;
      username: string | null;
    }> = [];

    if (postIds.length > 0) {
      const { data } = await supabase
        .from('city_wall_post_media')
        .select('post_id, media_type, file_url, file_path')
        .in('post_id', postIds);

      mediaRows = data || [];
    }

    if (cityIds.length > 0) {
      const { data } = await supabase
        .from('cities')
        .select('id, name, slug')
        .in('id', cityIds);

      cityRows = data || [];
    }

    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      profileRows = data || [];
    }

    const mediaMap = new Map<string, typeof mediaRows[number]>();
    for (const media of mediaRows) {
      if (!mediaMap.has(media.post_id)) {
        mediaMap.set(media.post_id, media);
      }
    }

    const cityMap = new Map(cityRows.map((city) => [city.id, city]));
    const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));

    const mappedPosts: FeedPost[] = posts.map((post) => {
      const media = mediaMap.get(post.id);
      const city = cityMap.get(post.city_id);
      const profile = profileMap.get(post.user_id);
      const author = getProfileName(profile as ChatProfile) || 'Utente The Square';
      const postType = String(post.post_type || media?.media_type || 'text');
      const kind: FeedKind =
        postType === 'image'
          ? 'photo'
          : postType === 'audio'
            ? 'audio'
            : postType === 'video'
              ? 'video'
              : 'text';

      const content = post.content || '';
      const cityName = city?.name || 'Roma';
      const citySlug = city?.slug || 'roma';

      return {
        id: post.id,
        author,
        initials: getInitials(author),
        city: cityName,
        citySlug,
        topic: kind === 'audio' ? 'Audio' : kind === 'video' ? 'Video' : 'Wall',
        topicSlug: kind === 'audio' ? 'audio' : kind === 'video' ? 'video' : 'socialita',
        time: timeLabel(post.created_at),
        wall: `Wall ${cityName}`,
        kind,
        title: content ? content.split('\n')[0].slice(0, 110) : `Nuovo post sul Wall di ${cityName}`,
        text: content || media?.file_path || '',
        likes: 0,
        comments: 0,
        audioReplies: 0,
        rooms: 0,
        accent: 'yellow',
        mediaUrl: media?.file_url || '',
        mediaName: media?.file_path || '',
      };
    });

    setUserPosts(mappedPosts);
  }

  async function loadUnreadCounts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
      setChatPreviews([]);
      return;
    }

    const [messagesResult, notificationsResult] = await Promise.all([
      supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
    ]);

    setUnreadMessagesCount(messagesResult.count || 0);
    setUnreadNotificationsCount(notificationsResult.count || 0);
  }

  async function loadChatPreviews() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setChatPreviews([]);
      return;
    }

    const [{ data: messageRows }, { data: linkRows }] = await Promise.all([
      supabase
        .from('private_messages')
        .select('id, link_id, sender_id, receiver_id, body, read_at, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(80),
      supabase
        .from('user_links')
        .select('id, requester_id, receiver_id, status, created_at, updated_at')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false }),
    ]);

    const messages = (messageRows || []) as PrivateMessageRow[];

    const { data: rpcRows } = await supabase.rpc('get_my_active_links');
    const rpcLinks = (rpcRows || []) as RpcLinkRow[];

    const allowedLinkStatuses = new Set(['accepted', 'active', 'connected']);
    const links = ((linkRows || []) as UserLinkRow[]).filter((link) =>
      !link.status || allowedLinkStatuses.has(String(link.status).toLowerCase())
    );

    const messageOtherIds = messages.map((message) =>
      message.sender_id === user.id ? message.receiver_id : message.sender_id
    );

    const linkOtherIds = links.map((link) =>
      link.requester_id === user.id ? link.receiver_id : link.requester_id
    );

    const rpcOtherIds = rpcLinks.map((link) => link.other_user_id);

    const otherIds = Array.from(new Set([...messageOtherIds, ...linkOtherIds, ...rpcOtherIds]));

    let profiles: ChatProfile[] = [];

    if (otherIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds);

      profiles = (profileRows || []) as ChatProfile[];
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const rpcProfileMap = new Map(rpcLinks.map((link) => [link.other_user_id, link]));
    const linkMap = new Map<string, UserLinkRow>();

    for (const link of links) {
      const otherUserId = link.requester_id === user.id ? link.receiver_id : link.requester_id;
      linkMap.set(otherUserId, link);
    }

    const grouped = new Map<string, ChatPreview>();
    const unreadMap = new Map<string, number>();

    for (const message of messages) {
      const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;

      if (message.receiver_id === user.id && !message.read_at) {
        unreadMap.set(otherUserId, (unreadMap.get(otherUserId) || 0) + 1);
      }

      if (!grouped.has(otherUserId)) {
        const profile = profileMap.get(otherUserId);
        const rpcProfile = rpcProfileMap.get(otherUserId);
        const link = linkMap.get(otherUserId);
        const name = getProfileName(profile) || rpcProfile?.full_name || rpcProfile?.username || 'Utente The Square';

        grouped.set(otherUserId, {
          otherUserId,
          name,
          initials: getInitials(name),
          avatarUrl: profile?.avatar_url || rpcProfile?.avatar_url || null,
          linkId: message.link_id || link?.id || rpcProfile?.link_id || null,
          body: message.body || 'Messaggio',
          time: timeLabel(message.created_at),
          unread: 0,
          accent: ['cyan', 'pink', 'green', 'blue', 'yellow'][grouped.size % 5] as ChatPreview['accent'],
        });
      }
    }

    for (const link of links) {
      const otherUserId = link.requester_id === user.id ? link.receiver_id : link.requester_id;

      if (!grouped.has(otherUserId)) {
        const profile = profileMap.get(otherUserId);
        const name = getProfileName(profile) || 'Utente The Square';
        const city = profile?.city || 'Italia';
        const points = typeof profile?.nova_points === 'number' ? ` · ${profile.nova_points} punti` : '';

        grouped.set(otherUserId, {
          otherUserId,
          name,
          initials: getInitials(name),
          avatarUrl: profile?.avatar_url || null,
          linkId: link.id,
          body: `${city}${points} · Legame attivo`,
          time: link.updated_at ? timeLabel(link.updated_at) : '',
          unread: 0,
          accent: ['cyan', 'pink', 'green', 'blue', 'yellow'][grouped.size % 5] as ChatPreview['accent'],
        });
      }
    }

    for (const link of rpcLinks) {
      const otherUserId = link.other_user_id;

      if (!grouped.has(otherUserId)) {
        const profile = profileMap.get(otherUserId);
        const name = getProfileName(profile) || link.full_name || link.username || 'Utente The Square';
        const city = profile?.city || link.city || 'Italia';
        const points = typeof link.nova_points === 'number' ? ` · ${link.nova_points} punti` : '';

        grouped.set(otherUserId, {
          otherUserId,
          name,
          initials: getInitials(name),
          avatarUrl: profile?.avatar_url || link.avatar_url || null,
          linkId: link.link_id,
          body: `${city}${points} · Legame attivo`,
          time: link.updated_at ? timeLabel(link.updated_at) : '',
          unread: 0,
          accent: ['cyan', 'pink', 'green', 'blue', 'yellow'][grouped.size % 5] as ChatPreview['accent'],
        });
      }
    }

    const previews = Array.from(grouped.values()).map((preview) => ({
      ...preview,
      unread: unreadMap.get(preview.otherUserId) || 0,
    }));

    setChatPreviews(previews);
    setSelectedChatId((current) => current || previews[0]?.otherUserId || null);
  }

  async function loadActiveThread(otherUserId?: string | null) {
    const selectedOtherUserId = otherUserId || selectedChatId || chatPreviews[0]?.otherUserId;

    if (!selectedOtherUserId || selectedOtherUserId.startsWith('demo-')) {
      setActiveMessages([]);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActiveMessages([]);
      return;
    }

    const { data } = await supabase
      .from('private_messages')
      .select('id, link_id, sender_id, receiver_id, body, read_at, created_at')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedOtherUserId}),and(sender_id.eq.${selectedOtherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })
      .limit(80);

    setActiveMessages((data || []) as PrivateMessageRow[]);
  }

  async function markSelectedChatAsRead(otherUserId?: string | null) {
    const selectedOtherUserId = otherUserId || selectedChatId || chatPreviews[0]?.otherUserId;

    if (!selectedOtherUserId || selectedOtherUserId.startsWith('demo-')) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('private_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', selectedOtherUserId)
      .eq('receiver_id', user.id)
      .is('read_at', null);

    await loadUnreadCounts();
    await loadChatPreviews();
  }

  async function openChatThread(otherUserId: string) {
    setSelectedChatId(otherUserId);
    setChatOpen(true);
    await loadActiveThread(otherUserId);
    await markSelectedChatAsRead(otherUserId);
  }

  async function sendPrivateReply() {
    const content = replyBody.trim();
    const receiverId = selectedChat?.otherUserId;

    if (!content || !receiverId || receiverId.startsWith('demo-') || sendingMessage) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSendingMessage(true);

    try {
      await supabase.from('private_messages').insert({
        link_id: selectedChat?.linkId || null,
        sender_id: user.id,
        receiver_id: receiverId,
        body: content,
      });

      setReplyBody('');
      await loadActiveThread(receiverId);
      await loadChatPreviews();
    } finally {
      setSendingMessage(false);
    }
  }


  useEffect(() => {
    let mounted = true;

    async function start() {
      if (!mounted) return;
      await loadWallPosts();
      await loadCityPulses();
      await loadUnreadCounts();
      await loadChatPreviews();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel(`home-badges-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'private_messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            await loadUnreadCounts();
            await loadChatPreviews();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'private_messages',
            filter: `sender_id=eq.${user.id}`,
          },
          async () => {
            await loadChatPreviews();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await loadUnreadCounts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'city_wall_posts',
          },
          async () => {
            await loadWallPosts();
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
            await loadWallPosts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'city_pulses',
          },
          async () => {
            await loadCityPulses();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pulse_posts',
          },
          async () => {
            await loadCityPulses();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const cleanupPromise = start();

    return () => {
      mounted = false;
      cleanupPromise.then((cleanup) => cleanup?.()).catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);


  useEffect(() => {
    if (!chatOpen) return;
    loadActiveThread(selectedChatId || chatPreviews[0]?.otherUserId);
    markSelectedChatAsRead(selectedChatId || chatPreviews[0]?.otherUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, selectedChatId]);

  return (
    <div className="feed-shell">
      <div className="app">
        <aside className="rail">
          <Link href="/" className="brand">
            <img src="/icon-192.png" alt="The Square" className="brand-icon" />
            <div>
              <b>The Square</b>
              <span>City Wall Network</span>
            </div>
          </Link>

          <nav className="side-nav">
            <Link href="/" className="active"><span>⌂</span><b>Home</b></Link>
            <Link href="/cities"><span>📍</span><b>Città</b></Link>
            <Link href="#feed"><span>🧱</span><b>Wall</b></Link>
            <Link href="#audio"><span>🎙️</span><b>Audio</b></Link>
            <button type="button" onClick={() => openChatThread(selectedChat?.otherUserId || drawerFilteredChats[0]?.otherUserId || chatsToShow[0]?.otherUserId)}><span>💬</span><b>Chat</b></button>
            <Link href="/notifications"><span>🔔</span><b>Notifiche</b></Link>
            <Link href="/profile"><span>👤</span><b>Profilo</b></Link>
          </nav>

          <button type="button" className="side-post" onClick={() => openComposer('text')}>＋ Pubblica</button>

          <section className="now-box">
            <h3>Live ora</h3>
            <div className="trend-line"><span>Roma</span><small>128 post</small></div>
            <div className="trend-line"><span>Eventi</span><small>43 audio</small></div>
            <div className="trend-line"><span>Mobilità</span><small>hot</small></div>
            <div className="trend-line"><span>Chat attive</span><small>{unreadMessagesCount} nuove</small></div>
          </section>
        </aside>

        <main className="center">
          <header className="topbar">
            <div className="home-brand-row">
              <Link href="/" className="home-brand">
                <img src="/icon-192.png" alt="The Square" />
                <span>
                  <b>The Square</b>
                  <small>City Wall Network</small>
                </span>
              </Link>
            </div>

            <div className="search-row">
              <label className="search" aria-label="Cerca nella Home">
                <span>⌕</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cerca città, wall, creator, eventi locali..."
                />
              </label>

              <button
                type="button"
                className={`icon-btn ${chatOpen ? 'active' : ''}`}
                onClick={() => setChatOpen(true)}
                aria-label="Apri chat"
              >
                💬
                {unreadMessagesCount > 0 && <span className="badge">{unreadMessagesCount}</span>}
              </button>

              <Link className="icon-btn" href="/notifications" aria-label="Notifiche">
                🔔
                {unreadNotificationsCount > 0 && <span className="badge">{unreadNotificationsCount}</span>}
              </Link>

              <Link className="icon-btn profile-button" href="/profile" aria-label="Profilo">
                <ProfileOrb className="h-full w-full" />
              </Link>
            </div>

            <nav className="wall-tabs" aria-label="Filtro città">
              {cityTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.slug}
                  className={`wall-tab ${activeCity === tab.slug ? 'active' : ''}`}
                  onClick={() => setActiveCity(tab.slug)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
              <Link className="wall-tab" href="/cities">＋ Cambia città</Link>
            </nav>

            <nav className="topic-tabs" aria-label="Filtro argomenti">
              {topics.map((topic) => (
                <button
                  type="button"
                  key={topic.slug}
                  className={`topic ${activeTopic === topic.slug ? 'active' : ''}`}
                  onClick={() => setActiveTopic(topic.slug)}
                >
                  {topic.icon ? `${topic.icon} ` : ''}{topic.label}
                </button>
              ))}
            </nav>
          </header>

          <section className="pulse-strip" id="pulse">
            <div className="pulse-strip-head">
              <div>
                <p>Pulse della città</p>
                <h2>Il battito vivo di ciò che sta nascendo ora</h2>
              </div>
              <Link href="/pulse">Vedi tutti</Link>
            </div>

            {pulseActionMessage && <div className="pulse-message">{pulseActionMessage}</div>}

            <div className="pulse-cards">
              {activeCityPulses.length > 0 ? (
                activeCityPulses.slice(0, 4).map((pulse) => (
                  <Link href={`/pulse/${pulse.id}`} className={`pulse-card ${pulse.status}`} key={pulse.id}>
                    <span className="pulse-city">{pulse.cities?.name || 'The Square'} · {pulse.topic}</span>
                    <b>{pulse.title}</b>
                    <small>{pulse.description || 'Segnale in crescita nel Wall della città.'}</small>

                    <div className="pulse-meter" aria-label={`Intensità ${pulse.intensity}%`}>
                      <i style={{ width: `${Math.min(100, Math.max(1, pulse.intensity || 1))}%` }} />
                    </div>

                    <div className="pulse-stats">
                      <span>{pulse.intensity}% intensità</span>
                      <span>{pulse.posts_count} post</span>
                      <span>{pulse.people_count} persone</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="pulse-empty">
                  <b>Nessun Pulse attivo</b>
                  <span>Quando più post parleranno dello stesso tema, nascerà un Pulse della città.</span>
                </div>
              )}
            </div>
          </section>

          <section className={`composer ${composerOpen ? 'is-open' : ''}`} id="composer">
            <div className="composer-top">
              <div className="avatar">A</div>
              <button type="button" className="composer-placeholder" onClick={() => openComposer('text')}>
                Cosa vuoi dire al Wall di {['roma', 'milano', 'napoli'].includes(activeCity) ? cityTabs.find((city) => city.slug === activeCity)?.label : 'Roma'}?
              </button>
            </div>
            <div className="composer-actions">
              <button type="button" onClick={() => openComposerWithUpload('image')}>🖼️ Foto</button>
              <button type="button" onClick={() => openComposerWithUpload('audio')}>🎙️ Audio</button>
              <button type="button" onClick={() => openComposerWithUpload('video')}>🎬 Video</button>
              <Link href="/calls/new">🧩 Stanza 24h</Link>
            </div>

            {!composerOpen && (
              <button type="button" className="open-publisher-inline" onClick={() => openComposer('text')}>
                Apri il modulo per scrivere o allegare file →
              </button>
            )}

            {composerOpen && (
              <div className="wall-publisher">
                <div className="publisher-head">
                  <div>
                    <p>Pubblica sul Wall</p>
                    <h3>Scrivi, allega foto/audio/video e pubblica sul Wall</h3>
                  </div>
                  <button type="button" onClick={() => { resetComposer(); setComposerOpen(false); }} aria-label="Chiudi composer">×</button>
                </div>

                <textarea
                  value={composerText}
                  onChange={(event) => setComposerText(event.target.value)}
                  placeholder="Scrivi un pensiero, una domanda, una segnalazione o un aggiornamento locale..."
                />

                {composerPreviewUrl && (
                  <div className="publisher-preview">
                    {composerMediaKind === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={composerPreviewUrl} alt={composerFile?.name || 'Anteprima'} />
                    )}
                    {composerMediaKind === 'audio' && <audio src={composerPreviewUrl} controls />}
                    {composerMediaKind === 'video' && <video src={composerPreviewUrl} controls />}
                    <span>{composerFile?.name}</span>
                  </div>
                )}

                <div className="publisher-tools">
                  <label className={composerMediaKind === 'image' ? 'active' : ''}>
                    🖼️ Immagine
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleComposerFile} />
                  </label>
                  <label className={composerMediaKind === 'audio' ? 'active' : ''}>
                    🎙️ Audio
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleComposerFile} />
                  </label>
                  <label className={composerMediaKind === 'video' ? 'active' : ''}>
                    🎬 Video
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={handleComposerFile} />
                  </label>
                  <button type="button" onClick={() => setComposerMediaKind('text')}>✍️ Solo testo</button>
                </div>

                {composerError && <div className="publisher-error">{composerError}</div>}

                <div className="publisher-bottom">
                  <span>
                    Wall: {['roma', 'milano', 'napoli'].includes(activeCity) ? cityTabs.find((city) => city.slug === activeCity)?.label : 'Roma'} · Topic: {topics.find((topic) => topic.slug === activeTopic)?.label || 'Tutto'}
                  </span>
                  <button type="button" onClick={publishWallPost} disabled={composerPosting}>
                    {composerPosting ? 'Pubblico...' : 'Pubblica sul Wall →'}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="home-link-search">
            <div className="home-link-search-head">
              <div>
                <p>Cerca legame</p>
                <h2>Trova una persona tra i tuoi legami attivi</h2>
              </div>
              <button type="button" onClick={() => setChatOpen(true)}>Apri chat</button>
            </div>

            <div className="home-link-search-box">
              <span>⌕</span>
              <input
                value={linkSearch}
                onChange={(event) => setLinkSearch(event.target.value)}
                placeholder="Cerca per nome, città, interessi o ultimo messaggio..."
              />
            </div>

            {linkSearch.trim() && (
              <div className="home-link-results">
                {homeFilteredChats.length > 0 ? (
                  homeFilteredChats.slice(0, 5).map((chat) => (
                    <button
                      type="button"
                      key={chat.otherUserId}
                      className="home-link-result"
                      onClick={() => setSelectedProfile(chat)}
                    >
                      <AvatarBox chat={chat} />
                      <span>
                        <b>{chat.name}</b>
                        <small>{chat.body}</small>
                      </span>
                      {chat.unread > 0 && <em>{chat.unread}</em>}
                    </button>
                  ))
                ) : (
                  <div className="home-link-empty">
                    Nessun legame trovato con questa ricerca.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="feed" id="feed">
            {visiblePosts.length ? (
              visiblePosts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  onAddToPulse={addPostToPulse}
                  pulseLinked={linkedPulsePosts.some((item) => item.post_id === post.id)}
                />
              ))
            ) : (
              <section className="empty-feed">
                <h2>Nessun post con questi filtri</h2>
                <p>Cambia città o argomento, oppure pubblica tu il primo contenuto su questo Wall.</p>
              </section>
            )}
          </section>
        </main>

        <aside className="right">
          <section className="right-panel">
            <div className="panel-title-row">
              <h3>Chat personali</h3>
              <button type="button" onClick={() => setChatOpen(true)}>Apri</button>
            </div>
            {chatsToShow.slice(0, 4).map((chat) => (
              <div className="city-card" key={chat.otherUserId}>
                <AvatarBox chat={chat} />
                <div><b>{chat.name}</b><span>{chat.body}</span></div>
                <button type="button" className="follow" onClick={() => openChatThread(chat.otherUserId)}>
                  Apri
                </button>
              </div>
            ))}
          </section>

          <section className="right-panel">
            <h3>Wall che segui</h3>
            {followedCities.map(([code, city, meta]) => (
              <div className="city-card" key={city}>
                <div className="city-avatar">{code}</div>
                <div><b>{city}</b><span>{meta}</span></div>
                <button type="button" className="follow">Segui</button>
              </div>
            ))}
          </section>

          <section className="right-panel">
            <h3>Argomenti caldi</h3>
            <div className="topic-grid">
              <span>🚇 Mobilità</span>
              <span>🎟️ Eventi</span>
              <span>🍝 Food</span>
              <span>💼 Lavoro</span>
              <span>🏠 Casa</span>
              <span>🤝 Socialità</span>
              <span>🎙️ Audio</span>
              <span>📰 News</span>
            </div>
          </section>
        </aside>
      </div>

      <div className={`chat-backdrop ${chatOpen ? 'open' : ''}`} onClick={() => setChatOpen(false)} />

      <aside className={`chat-drawer ${chatOpen ? 'open' : ''}`} aria-label="Chat personali">
        <header className="chat-head">
          <div>
            <h2>Chat personali</h2>
            <p>Qui trovi tutti i legami attivi; i messaggi compaiono appena la conversazione inizia.</p>
          </div>
          <button type="button" className="close-chat" onClick={() => setChatOpen(false)} aria-label="Chiudi chat">×</button>
        </header>

        <div className="chat-search">
          <input
            value={chatLinkSearch}
            onChange={(event) => setChatLinkSearch(event.target.value)}
            placeholder="Cerca tra i tuoi legami..."
            autoFocus={chatOpen}
          />
        </div>

        <div className="chat-list">
          {drawerFilteredChats.length > 0 ? (
            drawerFilteredChats.map((chat) => (
              <button
                type="button"
                className={`chat-item ${selectedChat?.otherUserId === chat.otherUserId ? 'active' : ''}`}
                key={chat.otherUserId}
                onClick={() => openChatThread(chat.otherUserId)}
              >
                <AvatarBox chat={chat} large />
                <div className="chat-copy">
                  <b>{chat.name}</b>
                  <span>{chat.body}</span>
                </div>
                <div className="chat-meta">
                  {chat.time}
                  {chat.unread > 0 && <div className="unread">{chat.unread}</div>}
                </div>
              </button>
            ))
          ) : (
            <div className="empty-links">
              <b>Nessun legame trovato</b>
              <span>Prova con un altro nome oppure cerca nella Home tra tutti i tuoi legami.</span>
            </div>
          )}
        </div>

        <section className="mini-thread">
          <div className="mini-thread-title">
            <span>Conversazione · {selectedChat?.name || 'Chat'}</span>
            <span>{activeMessages.length || selectedChat?.body ? 'Chat integrata' : 'Nessun messaggio'}</span>
          </div>

          <div className="thread-messages">
            {activeMessages.length > 0 ? (
              activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`bubble ${message.sender_id === selectedChat?.otherUserId ? '' : 'me'}`}
                >
                  {message.body || 'Messaggio'}
                </div>
              ))
            ) : (
              <>
                <div className="bubble">{selectedChat?.body || 'Nessun messaggio recente.'}</div>
                <div className="bubble me">Questa chat è pronta: scrivi qui sotto per iniziare la conversazione.</div>
              </>
            )}
          </div>

          <div className="reply-row">
            <input
              placeholder={
                selectedChat?.otherUserId?.startsWith('demo-')
                  ? 'Chat demo: crea una conversazione reale per rispondere'
                  : 'Scrivi un messaggio...'
              }
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendPrivateReply();
                }
              }}
              disabled={selectedChat?.otherUserId?.startsWith('demo-') || sendingMessage}
            />
            <button
              type="button"
              onClick={sendPrivateReply}
              disabled={selectedChat?.otherUserId?.startsWith('demo-') || sendingMessage || !replyBody.trim()}
            >
              ➤
            </button>
          </div>
        </section>
      </aside>

      {selectedProfile && (
        <>
          <div className="profile-backdrop open" onClick={() => setSelectedProfile(null)} />
          <aside className="profile-drawer" aria-label="Profilo legame">
            <header className="profile-head">
              <button type="button" className="close-chat" onClick={() => setSelectedProfile(null)} aria-label="Chiudi profilo">×</button>
              <AvatarBox chat={selectedProfile} large />
              <div>
                <p>Legame attivo</p>
                <h2>{selectedProfile.name}</h2>
                <span>{selectedProfile.body}</span>
              </div>
            </header>

            <div className="profile-body">
              <div className="profile-stat">
                <b>{selectedProfile.unread}</b>
                <span>messaggi non letti</span>
              </div>
              <div className="profile-stat">
                <b>{selectedProfile.time || '—'}</b>
                <span>ultimo contatto</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                onClick={() => {
                  const id = selectedProfile.otherUserId;
                  setSelectedProfile(null);
                  openChatThread(id);
                }}
              >
                💬 Apri chat
              </button>
              <Link href="/people">Vedi persone</Link>
            </div>
          </aside>
        </>
      )}

      <nav className="mobile-nav">
        <Link href="/" className="nav-home active" aria-label="Home">
          <span className="nav-ico">⌂</span>
          <span className="nav-label">Home</span>
        </Link>

        <Link href="/cities" className="nav-city" aria-label="Città">
          <span className="nav-ico">⌖</span>
          <span className="nav-label">Città</span>
        </Link>

        <button type="button" className="nav-publish" onClick={() => openComposer('text')} aria-label="Pubblica">
          <span className="nav-ico">＋</span>
          <span className="nav-label">Pubblica</span>
        </button>

        <button
          type="button"
          className="nav-chat"
          onClick={() => openChatThread(selectedChat?.otherUserId || drawerFilteredChats[0]?.otherUserId || chatsToShow[0]?.otherUserId)}
          aria-label="Chat"
        >
          <span className="nav-ico">💬</span>
          <span className="nav-label">Chat</span>
          {unreadMessagesCount > 0 && <span className="mobile-badge">{unreadMessagesCount}</span>}
        </button>

        <Link href="/profile" className="nav-profile" aria-label="Profilo">
          <span className="nav-ico">♙</span>
          <span className="nav-label">Profilo</span>
        </Link>
      </nav>

      <style jsx global>{styles}</style>
    </div>
  );
}

function AvatarBox({ chat, large }: { chat: ChatPreview; large?: boolean }) {
  return (
    <div className={`chat-avatar ${large ? 'large' : ''} ${chat.accent}`}>
      {chat.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={chat.avatarUrl} alt="" />
      ) : (
        chat.initials
      )}
    </div>
  );
}

function FeedPostCard({ post, onAddToPulse, pulseLinked }: { post: FeedPost; onAddToPulse: (post: FeedPost) => void; pulseLinked: boolean }) {
  return (
    <article className="post">
      <div className="post-head">
        <div className={`post-avatar avatar-${post.accent || 'yellow'}`}>{post.initials}</div>
        <div className="post-meta">
          <b>{post.author}</b>
          <span>{post.city} · {post.topic} · {post.time}</span>
        </div>
        <div className="wall-pill">{post.wall}</div>
      </div>

      <div className="post-body">
        <h2>{post.title}</h2>
        <p>{post.text}</p>
        {post.kind === 'photo' && <PhotoMedia src={post.mediaUrl} name={post.mediaName} />}
        {post.kind === 'audio' && <AudioMedia src={post.mediaUrl} />}
        {post.kind === 'video' && <VideoMedia src={post.mediaUrl} />}
      </div>

      <div className="post-actions">
        <button type="button">❤️ {post.likes}</button>
        <button type="button">💬 {post.comments}</button>
        <button type="button">🎙️ {post.audioReplies}</button>
        <button type="button">↗</button>
        <button type="button" onClick={() => onAddToPulse(post)} className={pulseLinked ? 'pulse-linked' : ''}>
          {pulseLinked ? '⚡ Nel Pulse' : '⚡ Pulse'}
        </button>
        <Link href="/calls/new" className="primary">🧩 Stanza</Link>
      </div>

      <div className="post-comments">
        {post.rooms > 0
          ? `Vedi ${post.comments} commenti · ${post.audioReplies} risposte audio · ${post.rooms} stanze nate da questo post`
          : `Vedi ${post.comments} commenti · ${post.audioReplies} risposte audio · Segui ${post.city} + ${post.topic}`}
      </div>
    </article>
  );
}

function PhotoMedia({ src, name }: { src?: string; name?: string }) {
  return (
    <div className="media photo-media">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="real-media" src={src} alt={name || 'Immagine pubblicata sul Wall'} />
      ) : (
        <div className="photo-shape" />
      )}
      <div className="media-label">Foto · caricata sul Wall locale</div>
    </div>
  );
}

function AudioMedia({ src }: { src?: string }) {
  return (
    <div className="media audio-media" id="audio">
      <div className="audio-play">▶</div>
      {src ? (
        <audio className="real-audio" src={src} controls />
      ) : (
        <div className="wave">
          {Array.from({ length: 14 }).map((_, index) => <i key={index} />)}
        </div>
      )}
      <span className="duration">0:42</span>
    </div>
  );
}

function VideoMedia({ src }: { src?: string }) {
  return (
    <div className="media video-media" id="video">
      {src ? <video className="real-video" src={src} controls /> : <div className="play-big">▶</div>}
    </div>
  );
}

const styles = `
:root {
  --bg: #080a0f;
  --panel: #101620;
  --panel-2: #151d2a;
  --ink: #f8fafc;
  --muted: #8c98aa;
  --line: rgba(255,255,255,.11);
  --line-2: rgba(255,255,255,.18);
  --yellow: #ffd21f;
  --orange: #ff9d2e;
  --cyan: #24e0d2;
  --blue: #2f8dff;
  --pink: #ff3d6e;
  --green: #a6ff4d;
  --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --title: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
}

.feed-shell,
.feed-shell * {
  box-sizing: border-box;
}

.feed-shell {
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font);
  background:
    radial-gradient(circle at 10% 0%, rgba(255,210,31,.18), transparent 30%),
    radial-gradient(circle at 92% 7%, rgba(36,224,210,.15), transparent 32%),
    radial-gradient(circle at 70% 100%, rgba(255,61,110,.10), transparent 30%),
    linear-gradient(180deg, #0b1018 0%, #080a0f 100%);
  overflow-x: hidden;
}

.feed-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(to bottom, black, transparent 90%);
}

.feed-shell a {
  color: inherit;
  text-decoration: none;
}

.app {
  position: relative;
  z-index: 1;
  width: min(1540px, calc(100% - 28px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 238px minmax(0, 720px) 360px;
  gap: 22px;
  padding: 18px 0 40px;
}

.rail,
.right {
  position: sticky;
  top: 18px;
  height: calc(100vh - 36px);
  overflow: hidden;
}

.brand {
  height: 74px;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line-2);
  background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
}

.brand-icon {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(255,210,31,.35);
  box-shadow: 0 0 0 4px rgba(255,210,31,.08), 0 18px 38px rgba(255,157,46,.18);
}

.brand b {
  display: block;
  font-family: var(--title);
  font-size: 28px;
  line-height: .9;
  letter-spacing: -.075em;
}

.brand span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.side-nav {
  margin-top: 14px;
  padding: 10px;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.78);
  box-shadow: 0 22px 60px rgba(0,0,0,.28);
}

.side-nav a,
.side-nav button {
  width: 100%;
  min-height: 48px;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 11px;
  align-items: center;
  border: 1px solid transparent;
  padding: 0 10px;
  color: #cbd5e1;
  background: transparent;
  font-size: 13px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
}

.side-nav a span,
.side-nav button span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 7px;
}

.side-nav a.active,
.side-nav a:hover,
.side-nav button:hover {
  color: var(--yellow);
  background: rgba(255,210,31,.10);
  border-color: rgba(255,210,31,.22);
}

.side-post {
  margin-top: 14px;
  min-height: 76px;
  display: grid;
  place-items: center;
  padding: 0 18px;
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  font-size: 14px;
  font-weight: 1000;
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
  box-shadow: 0 18px 38px rgba(255,157,46,.18);
}

.now-box,
.right-panel {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.72);
  box-shadow: 0 22px 60px rgba(0,0,0,.28);
}

.now-box h3,
.right-panel h3 {
  margin: 0 0 12px;
  font-family: var(--title);
  font-size: 20px;
  letter-spacing: -.045em;
}

.now-box h3 {
  font-size: 18px;
}

.trend-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-top: 1px solid rgba(255,255,255,.08);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 800;
}

.trend-line:first-of-type {
  border-top: 0;
}

.trend-line small {
  color: var(--muted);
  font-weight: 900;
}

.center {
  min-width: 0;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  margin: -18px 0 0;
  padding: 18px 0 12px;
  backdrop-filter: blur(18px);
  background: linear-gradient(180deg, rgba(8,10,15,.96), rgba(8,10,15,.76), transparent);
}


.home-brand-row {
  display: none;
  margin-bottom: 12px;
}

.home-brand {
  min-height: 68px;
  display: inline-grid;
  grid-template-columns: 48px 1fr;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--line-2);
  background:
    radial-gradient(circle at 0% 0%, rgba(255,210,31,.14), transparent 34%),
    linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
}

.home-brand img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(255,210,31,.35);
  box-shadow: 0 0 0 4px rgba(255,210,31,.08), 0 18px 38px rgba(255,157,46,.18);
}

.home-brand b {
  display: block;
  font-family: var(--title);
  font-size: 30px;
  line-height: .9;
  letter-spacing: -.075em;
  color: var(--ink);
}

.home-brand small {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.search-row {
  min-height: 58px;
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 10px;
  align-items: center;
}

.search {
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
  color: var(--muted);
  border: 1px solid var(--line);
  background: rgba(16,22,32,.80);
  font-size: 13px;
  font-weight: 800;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
}

.icon-btn {
  position: relative;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.80);
  color: var(--ink);
  font-size: 20px;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}

.icon-btn.active {
  border-color: rgba(255,210,31,.42);
  background: rgba(255,210,31,.12);
}

.badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: var(--pink);
  color: white;
  border: 1px solid rgba(255,255,255,.28);
  font-size: 10px;
  font-weight: 1000;
}

.wall-tabs,
.topic-tabs {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.wall-tabs {
  margin-top: 12px;
}

.topic-tabs {
  margin-top: 9px;
  gap: 8px;
}

.wall-tabs::-webkit-scrollbar,
.topic-tabs::-webkit-scrollbar {
  display: none;
}

.wall-tab,
.topic {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.78);
  color: #cbd5e1;
  cursor: pointer;
  font-family: inherit;
}

.wall-tab {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
}

.wall-tab.active {
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  border-color: rgba(255,210,31,.38);
}

.topic {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 11px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 900;
}

.topic.active {
  color: var(--cyan);
  border-color: rgba(36,224,210,.28);
  background: rgba(36,224,210,.10);
}

.composer {
  margin: 12px 0 16px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    linear-gradient(90deg, rgba(255,210,31,.10), transparent 48%),
    rgba(16,22,32,.86);
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
}

.composer-top {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,.16);
  background: linear-gradient(135deg, var(--yellow), var(--pink) 52%, var(--blue));
  color: #07110f;
  font-weight: 1000;
}

.composer-placeholder {
  min-height: 42px;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 13px;
  color: #68768a;
  background: rgba(8,10,15,.68);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 7px;
  font-size: 14px;
  font-weight: 800;
  text-align: left;
  font-family: inherit;
}

.composer-actions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.composer-actions button {
  height: 38px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.64);
  color: #cbd5e1;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
}

.open-publisher-inline {
  width: 100%;
  min-height: 46px;
  margin-top: 12px;
  border: 1px solid rgba(255,210,31,.28);
  background: rgba(255,210,31,.10);
  color: var(--yellow);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 1000;
  cursor: pointer;
}

.wall-publisher {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(8,10,15,.72);
  border-radius: 12px;
}

.publisher-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.publisher-head p {
  margin: 0 0 5px;
  color: var(--yellow);
  font-size: 10px;
  font-weight: 1000;
  letter-spacing: .20em;
  text-transform: uppercase;
}

.publisher-head h3 {
  margin: 0;
  font-family: var(--title);
  font-size: 22px;
  letter-spacing: -.055em;
}

.publisher-head button {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: white;
  border-radius: 8px;
  font-size: 24px;
  cursor: pointer;
}

.wall-publisher textarea {
  width: 100%;
  min-height: 132px;
  resize: vertical;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(13,17,23,.86);
  color: #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  outline: none;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.45;
}

.wall-publisher textarea::placeholder {
  color: #64748b;
}

.publisher-preview {
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(13,17,23,.76);
  border-radius: 12px;
}

.publisher-preview img,
.publisher-preview video {
  display: block;
  width: 100%;
  max-height: 340px;
  object-fit: cover;
}

.publisher-preview audio {
  width: calc(100% - 20px);
  margin: 14px 10px;
}

.publisher-preview span {
  display: block;
  padding: 10px 12px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
}

.publisher-tools {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.publisher-tools label,
.publisher-tools button {
  min-height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(16,22,32,.72);
  color: #cbd5e1;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
}

.publisher-tools label.active {
  color: var(--yellow);
  border-color: rgba(255,210,31,.32);
  background: rgba(255,210,31,.10);
}

.publisher-tools input {
  display: none;
}

.publisher-error {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255,61,110,.30);
  background: rgba(255,61,110,.10);
  color: #fecdd3;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 850;
}

.publisher-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.publisher-bottom span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
}

.publisher-bottom button {
  min-height: 44px;
  border: 0;
  border-radius: 9px;
  padding: 0 16px;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  font-size: 13px;
  font-weight: 1000;
  cursor: pointer;
}

.publisher-bottom button:disabled {
  opacity: .55;
  cursor: wait;
}

.real-media,
.real-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.real-audio {
  width: 100%;
}


.home-link-search {
  margin: 0 0 16px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    radial-gradient(circle at 100% 0%, rgba(36,224,210,.12), transparent 32%),
    linear-gradient(135deg, rgba(255,255,255,.055), rgba(255,255,255,.015)),
    rgba(16,22,32,.82);
  box-shadow: 0 22px 62px rgba(0,0,0,.22);
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
}

.home-link-search-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 14px;
  margin-bottom: 12px;
}

.home-link-search-head p {
  margin: 0 0 5px;
  color: var(--cyan);
  font-size: 10px;
  font-weight: 1000;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.home-link-search-head h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 22px;
  line-height: 1;
  letter-spacing: -.055em;
}

.home-link-search-head button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(255,210,31,.28);
  background: rgba(255,210,31,.10);
  color: var(--yellow);
  border-radius: 7px;
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}

.home-link-search-box {
  min-height: 50px;
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  border: 1px solid rgba(255,255,255,.11);
  background: rgba(8,10,15,.66);
  border-radius: 9px;
  overflow: hidden;
}

.home-link-search-box span {
  display: grid;
  place-items: center;
  color: var(--yellow);
  font-size: 18px;
}

.home-link-search-box input {
  width: 100%;
  height: 50px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 850;
}

.home-link-search-box input::placeholder {
  color: #657286;
}

.home-link-results {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.home-link-result {
  width: 100%;
  min-height: 62px;
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 10px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.46);
  color: inherit;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
}

.home-link-result:hover {
  border-color: rgba(36,224,210,.28);
  background: rgba(36,224,210,.08);
}

.home-link-result b {
  display: block;
  font-size: 14px;
  font-weight: 1000;
}

.home-link-result small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 780;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-link-result em {
  min-width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: var(--pink);
  color: white;
  font-style: normal;
  font-size: 11px;
  font-weight: 1000;
}

.home-link-empty {
  padding: 13px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.46);
  color: var(--muted);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
}

.feed {
  display: grid;
  gap: 18px;
}

.empty-feed,
.post {
  overflow: hidden;
  border: 1px solid var(--line-2);
  background:
    linear-gradient(135deg, rgba(255,255,255,.06), transparent 28%),
    rgba(16,22,32,.86);
  box-shadow: 0 22px 62px rgba(0,0,0,.30);
}

.empty-feed {
  padding: 28px;
}

.empty-feed h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 28px;
  letter-spacing: -.05em;
}

.empty-feed p {
  color: var(--muted);
  font-weight: 800;
}

.post-head {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
}

.post-avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  font-weight: 1000;
}

.avatar-cyan,
.chat-avatar.cyan {
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  color: white;
}

.avatar-pink,
.chat-avatar.pink {
  background: linear-gradient(135deg, var(--pink), var(--orange));
  color: white;
}

.avatar-green,
.chat-avatar.green {
  background: linear-gradient(135deg, var(--green), var(--cyan));
  color: #06110f;
}

.avatar-blue,
.chat-avatar.blue {
  background: linear-gradient(135deg, var(--blue), #7c3aed);
  color: white;
}

.post-meta b {
  display: block;
  font-family: var(--title);
  font-size: 16px;
  line-height: 1;
  letter-spacing: -.03em;
}

.post-meta span {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
}

.wall-pill {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: var(--cyan);
  background: rgba(36,224,210,.10);
  border: 1px solid rgba(36,224,210,.24);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 1000;
  text-transform: uppercase;
  letter-spacing: .06em;
  white-space: nowrap;
}

.post-body {
  padding: 0 14px 14px;
}

.post-body h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 26px;
  line-height: 1.02;
  letter-spacing: -.055em;
}

.post-body p {
  margin: 10px 0 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.55;
  font-weight: 670;
}

.media {
  margin-top: 14px;
  min-height: 430px;
  position: relative;
  overflow: hidden;
  background: #0b1119;
  border-top: 1px solid rgba(255,255,255,.10);
  border-bottom: 1px solid rgba(255,255,255,.10);
}

.photo-media {
  display: grid;
  place-items: end start;
  padding: 18px;
  background:
    linear-gradient(0deg, rgba(0,0,0,.62), transparent 55%),
    radial-gradient(circle at 26% 24%, rgba(255,210,31,.62), transparent 18%),
    radial-gradient(circle at 70% 34%, rgba(36,224,210,.34), transparent 24%),
    linear-gradient(135deg, #243044, #0e1622 58%, #111827);
}

.photo-shape {
  position: absolute;
  inset: 42px 54px 70px 54px;
  background:
    linear-gradient(135deg, rgba(255,255,255,.16), transparent 28%),
    linear-gradient(135deg, rgba(255,210,31,.72), rgba(255,157,46,.45) 42%, rgba(36,224,210,.34));
  clip-path: polygon(0 18%, 75% 0, 100% 28%, 82% 100%, 14% 88%);
  opacity: .72;
}

.video-media {
  display: grid;
  place-items: center;
  min-height: 520px;
  background:
    radial-gradient(circle at center, rgba(255,61,110,.36), transparent 28%),
    linear-gradient(160deg, #1c2433, #0a1018 66%);
}

.play-big {
  width: 86px;
  height: 86px;
  display: grid;
  place-items: center;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  border-radius: 50%;
  font-size: 34px;
  box-shadow: 0 0 0 18px rgba(255,210,31,.08), 0 30px 70px rgba(0,0,0,.34);
}

.audio-media {
  min-height: 220px;
  display: grid;
  grid-template-columns: 74px 1fr 52px;
  gap: 16px;
  align-items: center;
  padding: 18px;
  background:
    radial-gradient(circle at 92% 20%, rgba(36,224,210,.18), transparent 26%),
    linear-gradient(135deg, rgba(36,224,210,.08), rgba(8,10,15,.85));
}

.audio-play {
  width: 74px;
  height: 74px;
  display: grid;
  place-items: center;
  color: #06110f;
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  border-radius: 10px;
  font-size: 28px;
  font-weight: 1000;
}

.wave {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 80px;
}

.wave i {
  width: 6px;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--cyan), var(--blue));
  opacity: .9;
}

.wave i:nth-child(1){height:20px}
.wave i:nth-child(2){height:42px}
.wave i:nth-child(3){height:30px}
.wave i:nth-child(4){height:66px}
.wave i:nth-child(5){height:54px}
.wave i:nth-child(6){height:72px}
.wave i:nth-child(7){height:44px}
.wave i:nth-child(8){height:60px}
.wave i:nth-child(9){height:24px}
.wave i:nth-child(10){height:48px}
.wave i:nth-child(11){height:35px}
.wave i:nth-child(12){height:66px}
.wave i:nth-child(13){height:28px}
.wave i:nth-child(14){height:58px}

.media-label {
  position: relative;
  z-index: 2;
  max-width: 420px;
  padding: 12px;
  background: rgba(8,10,15,.72);
  border: 1px solid rgba(255,255,255,.12);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 850;
}

.post-actions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid rgba(255,255,255,.10);
}

.post-actions button {
  min-height: 52px;
  border: 0;
  border-right: 1px solid rgba(255,255,255,.08);
  background: rgba(8,10,15,.34);
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 950;
  cursor: pointer;
  font-family: inherit;
}

.post-actions button:last-child {
  border-right: 0;
}

.post-actions button.primary {
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
}

.post-comments {
  padding: 12px 14px 14px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.right-panel {
  margin-top: 0;
  margin-bottom: 14px;
}

.city-card {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid rgba(255,255,255,.08);
}

.city-card:first-of-type {
  border-top: 0;
}

.city-avatar,
.chat-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255,210,31,.12);
  color: var(--yellow);
  font-weight: 1000;
}

.chat-avatar {
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
}

.chat-avatar.large {
  width: 46px;
  height: 46px;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.city-card b {
  display: block;
  font-size: 13px;
  font-weight: 1000;
}

.city-card span {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  max-width: 190px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.follow {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(255,210,31,.26);
  background: rgba(255,210,31,.10);
  color: var(--yellow);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
}

.topic-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-grid span {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: #cbd5e1;
  background: rgba(8,10,15,.62);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 900;
}


.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.panel-title-row h3 {
  margin-bottom: 0;
}

.panel-title-row button {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(36,224,210,.24);
  background: rgba(36,224,210,.10);
  color: var(--cyan);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
}

.mini-link-search {
  margin-bottom: 8px;
}

.mini-link-search input {
  width: 100%;
  height: 38px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.64);
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0 12px;
  outline: none;
  font-size: 12px;
  font-weight: 800;
}

.empty-links {
  margin: 10px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.52);
  border-radius: 10px;
}

.empty-links b {
  display: block;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 1000;
}

.empty-links span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
  font-weight: 760;
}

.chat-drawer {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 100;
  width: min(430px, calc(100vw - 24px));
  height: calc(100vh - 36px);
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  border: 1px solid rgba(255,255,255,.18);
  background:
    radial-gradient(circle at 100% 0%, rgba(36,224,210,.14), transparent 32%),
    linear-gradient(180deg, rgba(18,26,38,.98), rgba(8,10,15,.98));
  box-shadow: -28px 0 90px rgba(0,0,0,.52);
  transform: translateX(calc(100% + 30px));
  transition: transform .28s ease;
  clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
}

.chat-drawer.open {
  transform: translateX(0);
}

.chat-head {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,.10);
}

.chat-head h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 26px;
  line-height: 1;
  letter-spacing: -.055em;
}

.chat-head p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
}

.close-chat {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(8,10,15,.62);
  color: white;
  border-radius: 8px;
  font-size: 24px;
  cursor: pointer;
}

.chat-search {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.chat-search input {
  width: 100%;
  height: 44px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.64);
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0 13px;
  outline: none;
  font-weight: 800;
}

.chat-list {
  overflow-y: auto;
  padding: 10px;
}

.chat-item {
  width: 100%;
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 11px;
  align-items: center;
  padding: 11px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
}

.chat-item:hover,
.chat-item.active {
  background: rgba(255,255,255,.055);
  border-color: rgba(255,255,255,.10);
}

.chat-copy b {
  display: block;
  font-size: 14px;
  font-weight: 1000;
}

.chat-copy span {
  display: block;
  max-width: 230px;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-meta {
  text-align: right;
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
}

.unread {
  min-width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  margin: 6px 0 0 auto;
  border-radius: 6px;
  background: var(--yellow);
  color: #06110f;
  font-size: 10px;
  font-weight: 1000;
}

.mini-thread {
  border-top: 1px solid rgba(255,255,255,.10);
  padding: 12px;
  background: rgba(8,10,15,.36);
}

.mini-thread-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .12em;
}

.mini-thread-title a {
  color: var(--yellow);
}

.bubble {
  width: fit-content;
  max-width: 82%;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255,255,255,.07);
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
}

.bubble.me {
  margin-left: auto;
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
}

.thread-messages {
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.reply-row {
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 8px;
  margin-top: 12px;
}

.reply-row input {
  min-height: 42px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.65);
  color: #e2e8f0;
  border-radius: 9px;
  padding: 0 12px;
  outline: none;
  font-weight: 800;
}

.reply-row button {
  min-height: 42px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  font-size: 18px;
  font-weight: 1000;
  cursor: pointer;
}

.reply-row button:disabled {
  cursor: not-allowed;
  opacity: .45;
}

.chat-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0,0,0,.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity .24s ease;
}

.chat-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}


.profile-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(0,0,0,.50);
}

.profile-drawer {
  position: fixed;
  right: 28px;
  top: 50%;
  z-index: 120;
  width: min(420px, calc(100vw - 32px));
  transform: translateY(-50%);
  border: 1px solid rgba(255,255,255,.18);
  background:
    radial-gradient(circle at 100% 0%, rgba(255,210,31,.14), transparent 34%),
    linear-gradient(180deg, rgba(18,26,38,.98), rgba(8,10,15,.98));
  box-shadow: -28px 0 90px rgba(0,0,0,.52);
  clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
}

.profile-head {
  position: relative;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 16px;
  align-items: center;
  padding: 22px 60px 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,.10);
}

.profile-head .close-chat {
  position: absolute;
  right: 14px;
  top: 14px;
}

.profile-head .chat-avatar.large {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  font-size: 20px;
}

.profile-head p {
  margin: 0 0 6px;
  color: var(--yellow);
  font-size: 10px;
  font-weight: 1000;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.profile-head h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 30px;
  line-height: .95;
  letter-spacing: -.06em;
}

.profile-head span {
  display: block;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.profile-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 14px;
}

.profile-stat {
  min-height: 82px;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.52);
  border-radius: 10px;
}

.profile-stat b {
  color: #e2e8f0;
  font-size: 22px;
  font-weight: 1000;
}

.profile-stat span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.profile-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 14px 14px;
}

.profile-actions button,
.profile-actions a {
  min-height: 46px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 1000;
}

.profile-actions button {
  border: 0;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  cursor: pointer;
}

.profile-actions a {
  border: 1px solid rgba(36,224,210,.24);
  color: var(--cyan);
  background: rgba(36,224,210,.10);
}

.mobile-nav {
  display: none;
}

@media (max-width: 1220px) {
  .app {
    grid-template-columns: 88px minmax(0, 720px) 320px;
  }

  .home-brand-row {
    display: block;
  }

  .home-brand {
    width: 100%;
  }

  .brand {
    grid-template-columns: 1fr;
    justify-items: center;
    height: auto;
  }

  .brand b,
  .brand span {
    display: none;
  }

  .side-nav a,
  .side-nav button {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 0;
  }

  .side-nav a b,
  .side-nav button b,
  .now-box,
  .side-post {
    display: none;
  }
}

@media (max-width: 980px) {
  .app {
    width: min(720px, calc(100% - 20px));
    display: block;
    padding-bottom: 96px;
  }

  .rail,
  .right {
    display: none;
  }

  .topbar {
    margin-top: 0;
  }

  .home-brand-row {
    display: block;
  }

  .home-brand {
    width: 100%;
  }

  .search-row {
    grid-template-columns: 1fr 48px 48px;
  }

  .search-row .icon-btn.profile-button {
    display: none;
  }

  .composer-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .publisher-tools {
    grid-template-columns: repeat(2, 1fr);
  }

  .publisher-bottom {
    align-items: stretch;
    flex-direction: column;
  }

  .publisher-bottom button {
    width: 100%;
  }


  .home-link-search-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .home-link-search-head button {
    width: 100%;
  }


  .post-head {
    grid-template-columns: 44px 1fr;
  }

  .post-avatar {
    width: 44px;
    height: 44px;
  }

  .wall-pill {
    grid-column: 1 / -1;
    width: fit-content;
    margin-left: 56px;
  }

  .media {
    min-height: 350px;
  }

  .video-media {
    min-height: 520px;
  }

  .audio-media {
    grid-template-columns: 60px 1fr;
  }

  .audio-play {
    width: 60px;
    height: 60px;
  }

  .audio-media .duration {
    grid-column: 1 / -1;
  }

  .post-actions {
    grid-template-columns: repeat(5, minmax(0,1fr));
  }

  .post-actions button {
    min-height: 48px;
    font-size: 0;
  }

  .post-actions button::first-letter {
    font-size: 18px;
  }

  .chat-drawer {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: min(86vh, 760px);
    transform: translateY(calc(100% + 30px));
    clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
    border-radius: 18px 18px 0 0;
  }

  .chat-drawer.open {
    transform: translateY(0);
  }

  .mobile-nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 80;
    height: 64px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    padding: 7px;
    border: 1px solid var(--line-2);
    background: rgba(10,16,24,.88);
    backdrop-filter: blur(18px);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0,0,0,.42);
  }

  .mobile-nav a,
  .mobile-nav button {
    position: relative;
    display: grid;
    place-items: center;
    color: #cbd5e1;
    background: transparent;
    border: 0;
    border-radius: 10px;
    font-size: 20px;
  }

  .mobile-nav a.active {
    background: linear-gradient(135deg, var(--yellow), var(--orange));
    color: #06110f;
  }

  .mobile-badge {
    position: absolute;
    right: 16px;
    top: 5px;
    min-width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: var(--pink);
    color: white;
    font-size: 10px;
    font-weight: 1000;
  }
}

@media (max-width: 520px) {
  .post-body h2 {
    font-size: 23px;
  }

  .photo-media {
    min-height: 390px;
  }

  .video-media {
    min-height: 560px;
  }
}

/* === THE SQUARE MOBILE REDESIGN — exact bottom/nav fix === */
@media (max-width: 980px) {
  .feed-shell {
    background:
      radial-gradient(circle at 16% 0%, rgba(255,210,31,.10), transparent 30%),
      radial-gradient(circle at 92% 14%, rgba(36,224,210,.08), transparent 28%),
      linear-gradient(180deg, #080c12 0%, #0b1017 56%, #070a0f 100%);
  }

  .app {
    width: min(100%, 940px);
    padding: 22px 24px 118px;
  }

  .topbar {
    position: relative;
    top: auto;
    z-index: 35;
    margin: 0;
    padding: 0 0 18px;
    background: transparent;
    backdrop-filter: none;
  }

  .home-brand-row {
    display: block;
    margin-bottom: 22px;
  }

  .home-brand {
    width: 100%;
    min-height: 108px;
    display: grid;
    grid-template-columns: 86px 1fr 60px;
    gap: 18px;
    align-items: center;
    padding: 18px 0;
    border: 0;
    background: transparent;
    clip-path: none;
  }

  .home-brand::after {
    content: "🔔";
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    justify-self: end;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(10,15,22,.88);
    border-radius: 18px;
    font-size: 25px;
    box-shadow: 0 18px 40px rgba(0,0,0,.25);
  }

  .home-brand::before {
    content: "3";
    position: absolute;
    right: 4px;
    top: 10px;
    z-index: 2;
    min-width: 23px;
    height: 23px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    background: var(--yellow);
    color: #07110f;
    font-size: 12px;
    font-weight: 1000;
    box-shadow: 0 0 0 3px rgba(8,12,18,.9);
  }

  .home-brand img {
    width: 82px;
    height: 82px;
    border-radius: 21px;
    border: 2px solid rgba(255,210,31,.44);
    box-shadow: 0 16px 34px rgba(255,210,31,.14);
  }

  .home-brand b {
    font-size: clamp(42px, 9vw, 56px);
    letter-spacing: -.075em;
    line-height: .86;
  }

  .home-brand small {
    margin-top: 10px;
    font-size: 15px;
    letter-spacing: .34em;
    color: #9aa6b8;
  }

  .search-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
    min-height: auto;
    margin-bottom: 18px;
  }

  .search-row > .icon-btn {
    display: none;
  }

  .search {
    height: 82px;
    border-radius: 20px;
    clip-path: none;
    border: 1px solid rgba(255,255,255,.13);
    background: rgba(8,12,18,.88);
    padding: 0 26px;
    color: #8f99aa;
    font-size: clamp(22px, 3.4vw, 27px);
    letter-spacing: -.04em;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.025), 0 16px 40px rgba(0,0,0,.18);
  }

  .search::first-letter {
    color: var(--yellow);
  }

  .wall-tabs {
    gap: 14px;
    margin-top: 0;
    padding-bottom: 14px;
  }

  .wall-tab {
    min-height: 66px;
    border-radius: 22px;
    padding: 0 30px;
    background: rgba(12,17,25,.82);
    border: 1px solid rgba(255,255,255,.12);
    color: #d6dce6;
    font-size: clamp(22px, 3.1vw, 27px);
    font-weight: 1000;
    box-shadow: 0 14px 34px rgba(0,0,0,.18);
  }

  .wall-tab.active {
    color: #07110f;
    background: linear-gradient(135deg, #ffd21f, #ffb326);
    border-color: rgba(255,210,31,.42);
  }

  .topic-tabs {
    gap: 14px;
    margin-top: 2px;
    padding-bottom: 18px;
  }

  .topic {
    min-height: 64px;
    border-radius: 13px;
    padding: 0 24px;
    background: rgba(12,17,25,.86);
    border: 1px solid rgba(255,255,255,.12);
    color: #d6dce6;
    font-size: clamp(20px, 2.8vw, 25px);
    font-weight: 1000;
  }

  .topic.active {
    color: var(--cyan);
    border-color: rgba(36,224,210,.46);
    background: rgba(36,224,210,.08);
  }

  .composer {
    margin: 10px 0 24px;
    padding: 26px;
    border-radius: 23px;
    clip-path: none;
    border: 1px solid rgba(255,255,255,.13);
    background:
      radial-gradient(circle at 0% 0%, rgba(255,210,31,.08), transparent 28%),
      rgba(15,20,27,.86);
    box-shadow: 0 24px 58px rgba(0,0,0,.28);
  }

  .composer-top {
    grid-template-columns: 88px 1fr;
    gap: 22px;
  }

  .avatar {
    width: 78px;
    height: 78px;
    border-radius: 18px;
    font-size: 28px;
  }

  .composer-placeholder {
    min-height: 78px;
    border-radius: 16px;
    background: rgba(6,10,16,.80);
    font-size: clamp(24px, 3.2vw, 31px);
    color: #8d98aa;
    letter-spacing: -.04em;
    padding: 0 28px;
  }

  .composer-actions {
    margin-top: 26px;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid rgba(255,255,255,.11);
    border-radius: 14px;
    overflow: hidden;
  }

  .composer-actions button {
    height: 78px;
    border: 0;
    border-right: 1px solid rgba(255,255,255,.10);
    border-radius: 0;
    background: rgba(6,10,16,.58);
    color: #d7dde7;
    font-size: clamp(18px, 2.5vw, 24px);
    font-weight: 950;
  }

  .composer-actions button:last-child {
    border-right: 0;
  }

  .wall-publisher,
  .publisher-panel,
  .publisher-card {
    margin-bottom: 24px !important;
    border-radius: 22px !important;
    clip-path: none !important;
  }

  .home-link-search {
    border-radius: 22px;
    clip-path: none;
    margin-bottom: 24px;
  }

  .section-title,
  .feed::before {
    display: none;
  }

  .feed {
    gap: 22px;
  }

  .feed::after {
    content: "";
    display: block;
    height: 24px;
  }

  .post {
    border-radius: 24px;
    background:
      radial-gradient(circle at 92% 0%, rgba(255,210,31,.055), transparent 28%),
      rgba(14,19,27,.88);
    box-shadow: 0 24px 60px rgba(0,0,0,.34);
  }

  .post-head {
    grid-template-columns: 68px 1fr auto;
    gap: 18px;
    padding: 24px;
  }

  .post-avatar {
    width: 62px;
    height: 62px;
    border-radius: 18px;
    font-size: 24px;
  }

  .post-meta b {
    font-size: clamp(24px, 3.2vw, 31px);
    letter-spacing: -.05em;
  }

  .post-meta span {
    font-size: clamp(15px, 2.1vw, 19px);
    margin-top: 9px;
  }

  .wall-pill {
    min-height: 42px;
    border-radius: 11px;
    padding: 0 18px;
    font-size: 14px;
  }

  .post-body {
    padding: 0 24px 24px;
  }

  .post-body h2 {
    font-size: clamp(29px, 4vw, 39px);
    line-height: 1.05;
  }

  .post-body p {
    font-size: clamp(20px, 2.8vw, 26px);
    line-height: 1.42;
  }

  .media {
    border-radius: 18px;
    min-height: 330px;
  }

  .post-actions {
    border-radius: 0 0 24px 24px;
    overflow: hidden;
  }

  .post-actions button {
    min-height: 66px;
    font-size: clamp(18px, 2.4vw, 24px);
  }

  .post-comments {
    font-size: 17px;
    padding: 18px 24px 22px;
  }

  .mobile-nav {
    left: 24px;
    right: 24px;
    bottom: 16px;
    z-index: 220;
    height: 88px;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
    padding: 8px;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,.13);
    background: rgba(7,11,16,.90);
    backdrop-filter: blur(24px) saturate(1.1);
    box-shadow: 0 24px 70px rgba(0,0,0,.56);
  }

  .mobile-nav a,
  .mobile-nav button {
    min-width: 0;
    display: grid;
    grid-template-rows: 30px 20px;
    place-items: center;
    gap: 6px;
    color: #d8dee8;
    font-size: 0;
    border-radius: 16px;
    position: relative;
  }

  .mobile-nav a::before,
  .mobile-nav button::before {
    font-size: 29px;
    line-height: 1;
  }

  .mobile-nav a:nth-child(1)::before { content: "⌂"; }
  .mobile-nav a:nth-child(2)::before { content: "⌖"; }
  .mobile-nav a:nth-child(3)::before { content: "+"; font-size: 42px; }
  .mobile-nav button:nth-child(4)::before { content: "💬"; font-size: 27px; }
  .mobile-nav a:nth-child(5)::before { content: "♙"; }

  .mobile-nav a:nth-child(1)::after { content: "Home"; }
  .mobile-nav a:nth-child(2)::after { content: "Città"; }
  .mobile-nav a:nth-child(3)::after { content: "Pubblica"; }
  .mobile-nav button:nth-child(4)::after { content: "Chat"; }
  .mobile-nav a:nth-child(5)::after { content: "Profilo"; }

  .mobile-nav a::after,
  .mobile-nav button::after {
    font-size: 15px;
    line-height: 1;
    font-weight: 850;
  }

  .mobile-nav a.active {
    background: transparent;
    color: var(--yellow);
  }

  .mobile-nav a:nth-child(3) {
    width: 78px;
    height: 78px;
    margin: -27px auto 0;
    border-radius: 50%;
    grid-template-rows: 42px 16px;
    color: #07110f;
    background: linear-gradient(135deg, #ffd21f, #ffb326);
    box-shadow: 0 18px 42px rgba(255,210,31,.24);
  }

  .mobile-nav a:nth-child(3)::after {
    position: absolute;
    bottom: -24px;
    color: #d8dee8;
    font-size: 14px;
  }

  .mobile-badge {
    right: 22%;
    top: 8px;
    min-width: 21px;
    height: 21px;
    border-radius: 7px;
    font-size: 11px;
  }

  .chat-drawer {
    z-index: 260;
  }

  .chat-backdrop {
    z-index: 250;
  }

  /* Hide/neutralize external floating notification widgets near the bottom when they overlap the app nav */
  iframe[src*="onesignal"],
  div[id*="onesignal"],
  div[class*="onesignal"],
  .onesignal-bell-launcher,
  .onesignal-customlink-container,
  .onesignal-slidedown-container,
  .onesignal-popover-container {
    bottom: 118px !important;
  }
}

@media (max-width: 520px) {
  .app {
    padding-left: 22px;
    padding-right: 22px;
  }

  .home-brand {
    grid-template-columns: 74px 1fr 52px;
    min-height: 96px;
    gap: 14px;
  }

  .home-brand img {
    width: 68px;
    height: 68px;
  }

  .home-brand b {
    font-size: 40px;
  }

  .home-brand small {
    font-size: 12px;
    letter-spacing: .28em;
  }

  .home-brand::after {
    width: 52px;
    height: 52px;
    border-radius: 16px;
  }

  .search {
    height: 70px;
    font-size: 22px;
  }

  .wall-tab,
  .topic {
    min-height: 56px;
    padding: 0 20px;
    font-size: 20px;
  }

  .composer {
    padding: 20px;
  }

  .composer-top {
    grid-template-columns: 66px 1fr;
    gap: 16px;
  }

  .avatar {
    width: 62px;
    height: 62px;
  }

  .composer-placeholder {
    min-height: 62px;
    font-size: 21px;
    padding: 0 18px;
  }

  .composer-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .composer-actions button {
    height: 62px;
    font-size: 18px;
  }
}


/* === RESPONSIVE REFINEMENT — smartphone + tablet === */

/* Tablet portrait / small desktop */
@media (min-width: 981px) and (max-width: 1220px) {
  .app {
    width: min(100% - 28px, 1120px);
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 20px;
  }

  .right {
    display: none;
  }

  .center {
    max-width: none;
  }

  .rail {
    height: calc(100vh - 28px);
    top: 14px;
  }

  .brand {
    height: 86px;
    padding: 12px;
  }

  .brand-icon {
    width: 58px;
    height: 58px;
  }

  .side-nav {
    padding: 10px 8px;
  }

  .side-nav a,
  .side-nav button {
    min-height: 58px;
  }

  .topbar {
    margin-top: 0;
  }

  .home-brand-row {
    display: block;
  }

  .home-brand {
    width: 100%;
  }

  .search-row {
    grid-template-columns: 1fr 54px 54px 54px;
  }

  .search {
    height: 56px;
  }

  .wall-tabs,
  .topic-tabs {
    padding-bottom: 8px;
  }

  .composer-actions {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .post {
    border-radius: 20px;
  }

  .media {
    min-height: 390px;
  }

  .chat-drawer {
    width: min(470px, calc(100vw - 24px));
  }
}

/* Tablet landscape */
@media (min-width: 768px) and (max-width: 980px) {
  .app {
    width: min(100% - 32px, 880px);
    padding: 20px 0 116px;
  }

  .home-brand-row {
    margin-bottom: 18px;
  }

  .home-brand {
    min-height: 96px;
    grid-template-columns: 76px 1fr 58px;
    gap: 16px;
  }

  .home-brand img {
    width: 74px;
    height: 74px;
  }

  .home-brand b {
    font-size: 48px;
  }

  .home-brand small {
    font-size: 13px;
  }

  .search {
    height: 72px;
    font-size: 24px;
  }

  .wall-tab {
    min-height: 60px;
    padding: 0 24px;
    font-size: 23px;
  }

  .topic {
    min-height: 56px;
    padding: 0 20px;
    font-size: 20px;
  }

  .composer {
    padding: 22px;
  }

  .composer-top {
    grid-template-columns: 74px 1fr;
  }

  .avatar {
    width: 68px;
    height: 68px;
  }

  .composer-placeholder {
    min-height: 68px;
    font-size: 25px;
  }

  .composer-actions {
    grid-template-columns: repeat(4, 1fr);
  }

  .post-body h2 {
    font-size: 34px;
  }

  .post-body p {
    font-size: 22px;
  }

  .media {
    min-height: 420px;
  }

  .mobile-nav {
    left: 32px;
    right: 32px;
    height: 90px;
  }

  .chat-drawer {
    left: auto;
    right: 18px;
    bottom: 18px;
    width: min(460px, calc(100vw - 36px));
    height: min(82vh, 720px);
    border-radius: 20px;
    transform: translateX(calc(100% + 36px));
  }

  .chat-drawer.open {
    transform: translateX(0);
  }

  .profile-drawer {
    left: auto;
    right: 24px;
    bottom: 112px;
    width: min(430px, calc(100vw - 48px));
  }
}

/* Smartphone grande */
@media (min-width: 521px) and (max-width: 767px) {
  .app {
    width: 100%;
    padding: 18px 18px 116px;
  }

  .home-brand {
    min-height: 86px;
    grid-template-columns: 66px 1fr 52px;
    gap: 14px;
  }

  .home-brand img {
    width: 64px;
    height: 64px;
    border-radius: 18px;
  }

  .home-brand b {
    font-size: 38px;
  }

  .home-brand small {
    margin-top: 7px;
    font-size: 11px;
    letter-spacing: .24em;
  }

  .home-brand::after {
    width: 50px;
    height: 50px;
    border-radius: 15px;
    font-size: 22px;
  }

  .home-brand::before {
    right: 1px;
    top: 9px;
  }

  .search {
    height: 66px;
    font-size: 21px;
    padding: 0 20px;
  }

  .wall-tabs,
  .topic-tabs {
    gap: 10px;
    margin-left: -18px;
    margin-right: -18px;
    padding-left: 18px;
    padding-right: 18px;
    scroll-snap-type: x proximity;
  }

  .wall-tab,
  .topic {
    scroll-snap-align: start;
  }

  .wall-tab {
    min-height: 54px;
    padding: 0 19px;
    font-size: 19px;
    border-radius: 18px;
  }

  .topic {
    min-height: 52px;
    padding: 0 17px;
    font-size: 17px;
  }

  .composer {
    padding: 18px;
    border-radius: 20px;
  }

  .composer-top {
    grid-template-columns: 62px 1fr;
    gap: 14px;
  }

  .avatar {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    font-size: 22px;
  }

  .composer-placeholder {
    min-height: 58px;
    padding: 0 16px;
    font-size: 20px;
  }

  .composer-actions {
    grid-template-columns: repeat(2, 1fr);
    border-radius: 14px;
  }

  .composer-actions button {
    height: 58px;
    font-size: 17px;
  }

  .post-head {
    grid-template-columns: 54px 1fr;
    gap: 13px;
    padding: 18px;
  }

  .post-avatar {
    width: 52px;
    height: 52px;
    border-radius: 15px;
  }

  .post-meta b {
    font-size: 24px;
  }

  .post-meta span {
    font-size: 14px;
  }

  .wall-pill {
    grid-column: 1 / -1;
    margin-left: 65px;
  }

  .post-body {
    padding: 0 18px 18px;
  }

  .post-body h2 {
    font-size: 27px;
  }

  .post-body p {
    font-size: 18px;
  }

  .media {
    min-height: 320px;
  }

  .post-actions button {
    min-height: 56px;
  }

  .mobile-nav {
    left: 14px;
    right: 14px;
    bottom: 12px;
    height: 82px;
    border-radius: 20px;
  }

  .mobile-nav a:nth-child(3) {
    width: 72px;
    height: 72px;
  }

  .chat-drawer {
    height: min(86vh, 720px);
  }
}

/* Smartphone piccolo */
@media (max-width: 390px) {
  .app {
    padding-left: 14px;
    padding-right: 14px;
    padding-bottom: 108px;
  }

  .home-brand {
    grid-template-columns: 58px 1fr 46px;
    gap: 11px;
  }

  .home-brand img {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }

  .home-brand b {
    font-size: 32px;
  }

  .home-brand small {
    font-size: 9px;
    letter-spacing: .22em;
  }

  .home-brand::after {
    width: 44px;
    height: 44px;
    font-size: 19px;
  }

  .home-brand::before {
    min-width: 19px;
    height: 19px;
    font-size: 10px;
  }

  .search {
    height: 58px;
    padding: 0 16px;
    font-size: 18px;
    border-radius: 16px;
  }

  .wall-tabs,
  .topic-tabs {
    margin-left: -14px;
    margin-right: -14px;
    padding-left: 14px;
    padding-right: 14px;
  }

  .wall-tab {
    min-height: 48px;
    padding: 0 16px;
    font-size: 16px;
  }

  .topic {
    min-height: 46px;
    padding: 0 14px;
    font-size: 15px;
  }

  .composer {
    padding: 14px;
  }

  .composer-top {
    grid-template-columns: 52px 1fr;
    gap: 11px;
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    font-size: 19px;
  }

  .composer-placeholder {
    min-height: 50px;
    padding: 0 13px;
    font-size: 17px;
  }

  .composer-actions button {
    height: 52px;
    font-size: 15px;
  }

  .post-head {
    padding: 14px;
  }

  .post-body {
    padding: 0 14px 14px;
  }

  .post-body h2 {
    font-size: 23px;
  }

  .post-body p {
    font-size: 16px;
  }

  .media {
    min-height: 260px;
  }

  .post-actions {
    grid-template-columns: repeat(5, minmax(0,1fr));
  }

  .post-actions button {
    min-height: 50px;
  }

  .mobile-nav {
    left: 10px;
    right: 10px;
    height: 76px;
    bottom: 10px;
    border-radius: 18px;
  }

  .mobile-nav a,
  .mobile-nav button {
    grid-template-rows: 26px 18px;
  }

  .mobile-nav a::before,
  .mobile-nav button::before {
    font-size: 24px;
  }

  .mobile-nav a::after,
  .mobile-nav button::after {
    font-size: 12px;
  }

  .mobile-nav a:nth-child(3) {
    width: 64px;
    height: 64px;
    margin-top: -22px;
  }

  .mobile-nav a:nth-child(3)::before {
    font-size: 34px;
  }

  .chat-drawer {
    height: min(88vh, 700px);
  }

  .chat-head h2 {
    font-size: 23px;
  }

  .mini-thread-title {
    letter-spacing: .07em;
  }
}

/* Safe area for iPhone home indicator */
@supports (padding: max(0px)) {
  @media (max-width: 980px) {
    .app {
      padding-bottom: max(118px, calc(104px + env(safe-area-inset-bottom)));
    }

    .mobile-nav {
      bottom: max(10px, env(safe-area-inset-bottom));
    }

    .chat-drawer {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}


/* === SOCIAL EDGE-TO-EDGE VIBRANT REDESIGN === */
@media (max-width: 980px) {
  :root {
    --bg: #0a1018;
    --panel: #121a27;
    --panel-2: #182235;
    --ink: #ffffff;
    --muted: #aab7cc;
    --line: rgba(255,255,255,.16);
    --line-2: rgba(255,255,255,.24);
    --yellow: #ffd21f;
    --orange: #ff8a2a;
    --cyan: #20f2df;
    --blue: #3da2ff;
    --pink: #ff3d8b;
    --green: #9dff38;
  }

  html,
  body {
    background: #0b111a !important;
  }

  .feed-shell {
    background:
      radial-gradient(circle at 0% 4%, rgba(255,210,31,.34), transparent 26%),
      radial-gradient(circle at 100% 9%, rgba(32,242,223,.25), transparent 28%),
      radial-gradient(circle at 90% 36%, rgba(255,61,139,.18), transparent 30%),
      linear-gradient(180deg, #152318 0%, #0c1822 34%, #0a111a 100%);
  }

  .feed-shell::before {
    opacity: .22;
    background-size: 34px 34px;
  }

  .app {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-top: 14px;
    padding-bottom: max(118px, calc(104px + env(safe-area-inset-bottom)));
  }

  .center {
    width: 100%;
    max-width: 100%;
  }

  .topbar {
    padding-left: 14px;
    padding-right: 14px;
  }

  .home-brand-row {
    margin-bottom: 16px;
  }

  .home-brand {
    min-height: 92px;
    padding: 12px 0;
    grid-template-columns: 72px 1fr 54px;
  }

  .home-brand img {
    width: 68px;
    height: 68px;
    border-radius: 18px;
    border: 2px solid rgba(255,210,31,.72);
    box-shadow:
      0 0 0 6px rgba(255,210,31,.12),
      0 18px 40px rgba(255,138,42,.28);
  }

  .home-brand b {
    color: #ffffff;
    text-shadow: 0 10px 28px rgba(0,0,0,.35);
  }

  .home-brand small {
    color: #c4d2e8;
  }

  .home-brand::after {
    background:
      radial-gradient(circle at 30% 20%, rgba(255,255,255,.20), transparent 26%),
      linear-gradient(145deg, rgba(255,210,31,.18), rgba(32,242,223,.12)),
      rgba(11,17,26,.94);
    border-color: rgba(255,210,31,.42);
  }

  .search {
    height: 66px;
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025)),
      rgba(10,16,25,.88);
    border-color: rgba(255,255,255,.20);
    color: #d8e0ec;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.035),
      0 16px 42px rgba(0,0,0,.20);
  }

  .wall-tabs,
  .topic-tabs {
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
  }

  .wall-tab {
    color: #f4f8ff;
    background:
      linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.035)),
      rgba(14,21,32,.84);
    border-color: rgba(255,255,255,.18);
    box-shadow: 0 14px 36px rgba(0,0,0,.20);
  }

  .wall-tab.active {
    color: #101622;
    background: linear-gradient(135deg, #ffe536 0%, #ffb21f 55%, #ff7a28 100%);
    box-shadow: 0 18px 44px rgba(255,178,31,.26);
  }

  .topic {
    color: #edf5ff;
    background:
      linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.035)),
      rgba(13,20,30,.86);
    border-color: rgba(255,255,255,.17);
  }

  .topic.active {
    color: #061513;
    background: linear-gradient(135deg, #20f2df, #78ffca);
    border-color: rgba(32,242,223,.55);
    box-shadow: 0 16px 36px rgba(32,242,223,.20);
  }

  .composer,
  .home-link-search,
  .post,
  .wall-publisher,
  .publisher-panel,
  .publisher-card {
    margin-left: 0 !important;
    margin-right: 0 !important;
    border-left: 0 !important;
    border-right: 0 !important;
    border-radius: 0 !important;
    width: 100% !important;
  }

  .composer {
    padding: 20px 14px;
    background:
      radial-gradient(circle at 12% 0%, rgba(255,210,31,.18), transparent 28%),
      radial-gradient(circle at 92% 12%, rgba(32,242,223,.13), transparent 30%),
      linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
      rgba(18,26,38,.88);
    border-top: 1px solid rgba(255,255,255,.18);
    border-bottom: 1px solid rgba(255,255,255,.14);
    box-shadow: 0 24px 58px rgba(0,0,0,.22);
  }

  .composer-top {
    grid-template-columns: 64px 1fr;
    gap: 14px;
  }

  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    color: #07110f;
    background: linear-gradient(135deg, #ffe536, #ff3d8b 52%, #3da2ff);
    box-shadow: 0 14px 36px rgba(255,61,139,.22);
  }

  .composer-placeholder {
    min-height: 60px;
    border-radius: 18px;
    color: #dce5f5;
    background:
      linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.025)),
      rgba(8,12,19,.74);
    border-color: rgba(255,255,255,.18);
  }

  .composer-actions {
    border-color: rgba(255,255,255,.18);
    background: rgba(7,12,18,.42);
  }

  .composer-actions button {
    color: #f2f7ff;
    background:
      radial-gradient(circle at 50% 0%, rgba(255,255,255,.08), transparent 34%),
      rgba(8,13,20,.56);
  }

  .home-link-search {
    padding: 22px 14px;
    background:
      radial-gradient(circle at 0% 0%, rgba(32,242,223,.18), transparent 28%),
      radial-gradient(circle at 100% 0%, rgba(255,210,31,.13), transparent 28%),
      rgba(18,26,38,.86);
    border-top: 1px solid rgba(255,255,255,.16);
    border-bottom: 1px solid rgba(255,255,255,.14);
  }

  .feed {
    gap: 18px;
  }

  .post {
    background:
      radial-gradient(circle at 0% 0%, rgba(255,210,31,.12), transparent 26%),
      radial-gradient(circle at 100% 8%, rgba(32,242,223,.10), transparent 28%),
      linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
      rgba(14,21,31,.91);
    border-top: 1px solid rgba(255,255,255,.16);
    border-bottom: 1px solid rgba(255,255,255,.14);
    box-shadow: none;
  }

  .post + .post {
    margin-top: 6px;
  }

  .post-head {
    padding-left: 14px;
    padding-right: 14px;
  }

  .post-avatar {
    background: linear-gradient(135deg, #ffe536, #ff8a2a);
    box-shadow: 0 16px 38px rgba(255,138,42,.18);
  }

  .post-body {
    padding-left: 14px;
    padding-right: 14px;
  }

  .post-body h2,
  .post-meta b {
    color: #ffffff;
  }

  .post-body p {
    color: #d8e1ef;
  }

  .wall-pill {
    color: #061513;
    background: linear-gradient(135deg, #20f2df, #78ffca);
    border-color: transparent;
  }

  .media {
    margin-left: -14px;
    margin-right: -14px;
    border-radius: 0 !important;
    min-height: 300px;
  }

  .photo-media {
    background:
      linear-gradient(0deg, rgba(0,0,0,.52), transparent 58%),
      radial-gradient(circle at 20% 18%, rgba(255,229,54,.74), transparent 18%),
      radial-gradient(circle at 74% 28%, rgba(32,242,223,.48), transparent 23%),
      linear-gradient(135deg, #31405c, #111a29 62%, #162335);
  }

  .post-actions {
    border-top-color: rgba(255,255,255,.14);
    background: rgba(7,11,17,.30);
  }

  .post-actions button {
    color: #f0f6ff;
    background: rgba(7,11,17,.22);
  }

  .post-actions button.primary {
    color: #07110f;
    background: linear-gradient(135deg, #ffe536, #ff8a2a);
  }

  .post-comments {
    color: #b8c5d8;
  }

  .mobile-nav {
    left: 0 !important;
    right: 0 !important;
    bottom: max(0px, env(safe-area-inset-bottom)) !important;
    width: 100% !important;
    height: 82px;
    border-radius: 22px 22px 0 0 !important;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    padding-left: 8px;
    padding-right: 8px;
    background:
      linear-gradient(180deg, rgba(20,29,42,.96), rgba(7,11,17,.96)),
      rgba(7,11,17,.96);
    box-shadow: 0 -20px 58px rgba(0,0,0,.46);
  }

  .mobile-nav a,
  .mobile-nav button {
    color: #e7eef9;
  }

  .mobile-nav a.active {
    color: #ffe536;
  }

  .mobile-nav a:nth-child(3) {
    width: 74px;
    height: 74px;
    margin-top: -31px;
    background: linear-gradient(135deg, #ffe536, #ffb21f 48%, #ff8a2a);
    box-shadow:
      0 0 0 8px rgba(255,210,31,.10),
      0 20px 48px rgba(255,178,31,.34);
  }

  .chat-drawer {
    border-radius: 24px 24px 0 0 !important;
    border-left: 0;
    border-right: 0;
    background:
      radial-gradient(circle at 0% 0%, rgba(32,242,223,.18), transparent 32%),
      radial-gradient(circle at 100% 0%, rgba(255,210,31,.13), transparent 30%),
      linear-gradient(180deg, rgba(20,29,42,.98), rgba(8,12,18,.98));
  }

  .profile-drawer {
    border-radius: 24px !important;
  }

  iframe[src*="onesignal"],
  div[id*="onesignal"],
  div[class*="onesignal"],
  .onesignal-bell-launcher,
  .onesignal-customlink-container,
  .onesignal-slidedown-container,
  .onesignal-popover-container {
    right: 14px !important;
    bottom: 102px !important;
    transform: scale(.82) !important;
    transform-origin: bottom right !important;
  }
}

@media (max-width: 520px) {
  .topbar {
    padding-left: 12px;
    padding-right: 12px;
  }

  .wall-tabs,
  .topic-tabs {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  .composer,
  .home-link-search {
    padding-left: 12px;
    padding-right: 12px;
  }

  .post-head,
  .post-body {
    padding-left: 12px;
    padding-right: 12px;
  }

  .media {
    margin-left: -12px;
    margin-right: -12px;
  }

  .mobile-nav {
    height: 80px;
  }

  .mobile-nav a:nth-child(3) {
    width: 70px;
    height: 70px;
  }
}

@media (max-width: 390px) {
  .topbar {
    padding-left: 10px;
    padding-right: 10px;
  }

  .wall-tabs,
  .topic-tabs {
    padding-left: 10px !important;
    padding-right: 10px !important;
  }

  .composer,
  .home-link-search {
    padding-left: 10px;
    padding-right: 10px;
  }

  .post-head,
  .post-body {
    padding-left: 10px;
    padding-right: 10px;
  }

  .media {
    margin-left: -10px;
    margin-right: -10px;
  }
}


/* === THE SQUARE — LIGHT WARM UI, STANDARD FONT, LOW MARGINS === */
@media (max-width: 980px) {
  :root {
    --bg: #fff7ec;
    --panel: #ffffff;
    --panel-2: #fff2df;
    --ink: #17120d;
    --muted: #7a6c5d;
    --line: rgba(120,78,35,.16);
    --line-2: rgba(120,78,35,.22);
    --yellow: #ffc93d;
    --orange: #ff7a2f;
    --cyan: #44bfff;
    --blue: #2f94e8;
    --pink: #ff6f61;
    --green: #7bd85c;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    --title: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .feed-shell {
    color: var(--ink);
    font-family: var(--font);
    background:
      radial-gradient(circle at 0% 0%, rgba(255,201,61,.42), transparent 28%),
      radial-gradient(circle at 100% 6%, rgba(68,191,255,.24), transparent 28%),
      radial-gradient(circle at 84% 40%, rgba(255,111,97,.16), transparent 30%),
      radial-gradient(circle at 4% 68%, rgba(255,122,47,.16), transparent 34%),
      linear-gradient(180deg,#fffaf2 0%,#fff3e1 44%,#fff8f0 100%) !important;
  }

  .feed-shell::before {
    opacity: .34;
    background:
      linear-gradient(90deg, rgba(120,78,35,.08) 1px, transparent 1px),
      linear-gradient(0deg, rgba(120,78,35,.08) 1px, transparent 1px);
    background-size: 34px 34px;
  }

  .app {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-top: 12px;
    padding-bottom: max(112px, calc(96px + env(safe-area-inset-bottom)));
  }

  .center {
    width: 100%;
    max-width: 100%;
  }

  .topbar {
    padding: 0 12px 16px;
    background: transparent !important;
    backdrop-filter: none !important;
  }

  .home-brand-row {
    display: block;
    margin-bottom: 12px;
  }

  .home-brand {
    min-height: 76px;
    display: grid;
    grid-template-columns: 56px 1fr 46px;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 8px 0;
    border: 0;
    background: transparent;
    clip-path: none;
  }

  .home-brand::after {
    content: "🔔";
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    justify-self: end;
    border-radius: 14px;
    border: 1px solid rgba(255,167,38,.38);
    background: linear-gradient(145deg, rgba(255,255,255,.95), rgba(255,242,216,.92));
    box-shadow: 0 16px 34px rgba(120,78,35,.16);
    font-size: 18px;
  }

  .home-brand::before {
    content: "3";
    position: absolute;
    right: -4px;
    top: 4px;
    z-index: 2;
    min-width: 19px;
    height: 19px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    background: var(--yellow);
    color: #201610;
    font-size: 10px;
    font-weight: 800;
    box-shadow: 0 0 0 3px rgba(255,247,236,.95);
  }

  .home-brand img {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    border: 2px solid rgba(255,167,38,.75);
    box-shadow: 0 0 0 6px rgba(255,201,61,.18), 0 16px 34px rgba(255,122,47,.20);
  }

  .home-brand b {
    color: #201610;
    font-family: var(--title);
    font-size: 28px;
    line-height: .96;
    letter-spacing: -.02em;
    font-weight: 800;
    text-shadow: none;
  }

  .home-brand small {
    display: block;
    margin-top: 4px;
    color: #8a745f;
    font-size: 10px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  .search-row {
    display: grid;
    grid-template-columns: 1fr;
    min-height: auto;
    margin-bottom: 12px;
  }

  .search-row > .icon-btn {
    display: none;
  }

  .search {
    height: 52px;
    border-radius: 16px;
    clip-path: none;
    background: rgba(255,255,255,.82);
    border: 1px solid rgba(120,78,35,.16);
    color: #6e6258;
    padding: 0 16px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0;
    box-shadow: 0 12px 28px rgba(120,78,35,.10);
  }

  .wall-tabs,
  .topic-tabs {
    gap: 10px;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
    padding-bottom: 10px;
    scroll-snap-type: x proximity;
  }

  .wall-tab,
  .topic {
    scroll-snap-align: start;
    color: #332319;
    background: rgba(255,255,255,.82);
    border: 1px solid rgba(120,78,35,.14);
    box-shadow: 0 12px 26px rgba(120,78,35,.10);
    font-family: var(--font);
    font-weight: 700;
  }

  .wall-tab {
    min-height: 44px;
    border-radius: 16px;
    padding: 0 14px;
    font-size: 15px;
  }

  .wall-tab.active {
    color: #22150a;
    background: linear-gradient(135deg,#ffe39a 0%,#ffc04d 52%,#ff8b3d 100%);
    border-color: rgba(255,167,38,.34);
    box-shadow: 0 14px 28px rgba(255,122,47,.22);
  }

  .topic {
    min-height: 40px;
    border-radius: 12px;
    padding: 0 12px;
    font-size: 14px;
  }

  .topic.active {
    color: #09202d;
    background: linear-gradient(135deg,#bfeeff,#62c9ff);
    border-color: rgba(68,191,255,.26);
    box-shadow: 0 14px 28px rgba(68,191,255,.20);
  }

  .composer,
  .home-link-search,
  .post,
  .wall-publisher,
  .publisher-panel,
  .publisher-card {
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    border-left: 0 !important;
    border-right: 0 !important;
    border-radius: 0 !important;
    clip-path: none !important;
  }

  .composer {
    margin: 8px 0 14px;
    padding: 16px 12px;
    background:
      radial-gradient(circle at 10% 0%, rgba(255,201,61,.22), transparent 30%),
      radial-gradient(circle at 95% 0%, rgba(68,191,255,.14), transparent 30%),
      rgba(255,255,255,.78);
    border-top: 1px solid rgba(120,78,35,.14);
    border-bottom: 1px solid rgba(120,78,35,.12);
    box-shadow: 0 16px 36px rgba(120,78,35,.10);
  }

  .composer-top {
    grid-template-columns: 50px 1fr;
    gap: 12px;
  }

  .avatar {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    color: #201610;
    background: linear-gradient(135deg,#ffc93d,#ff7a2f 52%,#44bfff);
    box-shadow: 0 12px 24px rgba(255,122,47,.20);
    font-size: 18px;
    font-weight: 800;
  }

  .composer-placeholder {
    min-height: 46px;
    border-radius: 14px;
    color: #655648;
    background: #fffaf2;
    border: 1px solid rgba(120,78,35,.16);
    padding: 0 14px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0;
  }

  .composer-actions {
    margin-top: 12px;
    grid-template-columns: repeat(2,1fr);
    border-radius: 12px;
    border-color: rgba(120,78,35,.14);
    background: rgba(255,255,255,.65);
    overflow: hidden;
  }

  .composer-actions button {
    height: 46px;
    color: #3a2a1e;
    background: rgba(255,250,242,.74);
    border-color: rgba(120,78,35,.12);
    font-size: 14px;
    font-weight: 700;
  }

  .home-link-search {
    padding: 16px 12px;
    background:
      radial-gradient(circle at 100% 0%, rgba(68,191,255,.12), transparent 28%),
      radial-gradient(circle at 0% 100%, rgba(255,201,61,.12), transparent 30%),
      rgba(255,255,255,.76);
    border-top: 1px solid rgba(120,78,35,.14);
    border-bottom: 1px solid rgba(120,78,35,.12);
    box-shadow: 0 14px 34px rgba(120,78,35,.10);
  }

  .home-link-search-head h2 {
    color: #201610;
    font-size: 18px;
    line-height: 1.15;
    letter-spacing: -.01em;
    font-weight: 800;
  }

  .home-link-search-head p {
    color: #d97016;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .14em;
  }

  .home-link-search-box {
    min-height: 44px;
    border-radius: 14px;
    background: #fffaf2;
    border-color: rgba(120,78,35,.16);
  }

  .home-link-search-box input {
    height: 44px;
    color: #201610;
    font-size: 14px;
    font-weight: 600;
  }

  .feed {
    gap: 14px;
  }

  .post {
    margin: 0 0 14px;
    background:
      radial-gradient(circle at 0% 0%, rgba(255,201,61,.15), transparent 28%),
      radial-gradient(circle at 100% 0%, rgba(68,191,255,.12), transparent 30%),
      rgba(255,255,255,.84);
    border-top: 1px solid rgba(120,78,35,.14);
    border-bottom: 1px solid rgba(120,78,35,.12);
    box-shadow: 0 14px 34px rgba(120,78,35,.10);
  }

  .post-head {
    grid-template-columns: 54px 1fr auto;
    gap: 12px;
    padding: 14px 12px;
  }

  .post-avatar {
    width: 48px;
    height: 48px;
    border-radius: 15px;
    background: linear-gradient(135deg,#ffc93d,#ff7a2f);
    color: #201610;
    font-size: 16px;
    font-weight: 800;
  }

  .post-meta b,
  .post-body h2 {
    color: #201610;
    font-family: var(--title);
    letter-spacing: -.01em;
    font-weight: 800;
  }

  .post-meta b {
    font-size: 17px;
  }

  .post-meta span {
    color: #7a6c5d;
    font-size: 12px;
    font-weight: 600;
  }

  .wall-pill {
    min-height: 32px;
    border-radius: 10px;
    padding: 0 10px;
    color: #09202d;
    background: linear-gradient(135deg,#bfeeff,#62c9ff);
    border-color: transparent;
    font-size: 11px;
    font-weight: 700;
  }

  .post-body {
    padding: 0 12px 14px;
  }

  .post-body h2 {
    font-size: 21px;
    line-height: 1.15;
  }

  .post-body p {
    color: #6f6256;
    font-size: 15px;
    line-height: 1.45;
    font-weight: 500;
  }

  .media {
    min-height: 220px;
    margin-left: -12px;
    margin-right: -12px;
    border-radius: 0 !important;
    background:
      linear-gradient(0deg, rgba(255,255,255,.14), transparent 58%),
      radial-gradient(circle at 20% 18%, rgba(255,201,61,.75), transparent 18%),
      radial-gradient(circle at 74% 28%, rgba(68,191,255,.42), transparent 23%),
      radial-gradient(circle at 48% 64%, rgba(255,122,47,.28), transparent 30%),
      linear-gradient(135deg,#ffe2af,#ffd0a8 54%,#d9f1ff);
  }

  .post-actions {
    background: rgba(255,250,242,.56);
    border-top-color: rgba(120,78,35,.12);
  }

  .post-actions button {
    min-height: 46px;
    color: #3a2a1e;
    background: rgba(255,250,242,.70);
    font-size: 13px;
    font-weight: 700;
  }

  .post-actions button.primary {
    color: #201610;
    background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
  }

  .post-comments {
    color: #7a6c5d;
    font-size: 12px;
    font-weight: 600;
    padding: 12px;
  }

  .mobile-nav {
    left: 0 !important;
    right: 0 !important;
    bottom: max(0px, env(safe-area-inset-bottom)) !important;
    width: 100% !important;
    height: 78px;
    grid-template-columns: repeat(5,1fr);
    border-radius: 22px 22px 0 0 !important;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    border-top: 1px solid rgba(120,78,35,.14);
    padding: 8px 8px max(8px, env(safe-area-inset-bottom));
    background: rgba(255,255,255,.92);
    box-shadow: 0 -14px 36px rgba(120,78,35,.14);
  }

  .mobile-nav a,
  .mobile-nav button {
    color: #6d5e50;
    grid-template-rows: 26px 18px;
    gap: 5px;
    font-weight: 600;
  }

  .mobile-nav a::before,
  .mobile-nav button::before {
    font-size: 23px;
  }

  .mobile-nav a::after,
  .mobile-nav button::after {
    font-size: 12px;
    font-weight: 600;
  }

  .mobile-nav a.active {
    color: #d97016;
    background: transparent;
  }

  .mobile-nav a:nth-child(3) {
    width: 62px;
    height: 62px;
    margin: -24px auto 0;
    color: #201610;
    background: linear-gradient(135deg,#ffc93d,#ff9f35 48%,#ff7a2f);
    box-shadow: 0 0 0 8px rgba(255,201,61,.18), 0 18px 38px rgba(255,122,47,.24);
  }

  .mobile-nav a:nth-child(3)::before {
    font-size: 34px;
  }

  .mobile-nav a:nth-child(3)::after {
    bottom: -20px;
    color: #5d4d3f;
    font-size: 11px;
  }

  .mobile-badge {
    right: 22%;
    top: 7px;
    min-width: 18px;
    height: 18px;
    font-size: 10px;
  }

  .chat-drawer {
    border-radius: 22px 22px 0 0 !important;
    background:
      radial-gradient(circle at 100% 0%, rgba(68,191,255,.14), transparent 30%),
      linear-gradient(180deg, rgba(255,255,255,.98), rgba(255,247,236,.98));
    color: #201610;
  }

  .chat-head h2,
  .chat-copy b,
  .profile-head h2 {
    color: #201610;
    font-family: var(--title);
  }

  .chat-head p,
  .chat-copy span,
  .chat-meta {
    color: #7a6c5d;
  }

  .chat-search input,
  .reply-row input {
    background: #fffaf2;
    color: #201610;
    border-color: rgba(120,78,35,.16);
  }

  .bubble {
    background: #fff4e6;
    color: #201610;
  }

  .bubble.me {
    color: #201610;
    background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
  }

  iframe[src*="onesignal"],
  div[id*="onesignal"],
  div[class*="onesignal"],
  .onesignal-bell-launcher,
  .onesignal-customlink-container,
  .onesignal-slidedown-container,
  .onesignal-popover-container {
    right: 12px !important;
    bottom: 96px !important;
    transform: scale(.82) !important;
    transform-origin: bottom right !important;
  }
}

@media (max-width: 390px) {
  .topbar {
    padding-left: 10px;
    padding-right: 10px;
  }

  .wall-tabs,
  .topic-tabs {
    padding-left: 10px !important;
    padding-right: 10px !important;
  }

  .composer,
  .home-link-search {
    padding-left: 10px;
    padding-right: 10px;
  }

  .post-head,
  .post-body {
    padding-left: 10px;
    padding-right: 10px;
  }

  .media {
    margin-left: -10px;
    margin-right: -10px;
  }
}


/* === FUNCTIONAL BUTTONS PATCH === */
.search {
  display: grid !important;
  grid-template-columns: 24px 1fr !important;
  align-items: center !important;
  gap: 8px !important;
}

.search span {
  color: #d97016;
  font-weight: 800;
}

.search input {
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.search input::placeholder {
  color: inherit;
  opacity: .86;
}

.composer-actions a {
  height: 46px;
  display: grid;
  place-items: center;
  color: #3a2a1e;
  background: rgba(255,250,242,.74);
  border: 0;
  border-left: 1px solid rgba(120,78,35,.12);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.side-post {
  border: 0;
  cursor: pointer;
  font-family: inherit;
}

.empty-feed {
  padding: 24px 16px;
  background: rgba(255,255,255,.78);
  border-top: 1px solid rgba(120,78,35,.14);
  border-bottom: 1px solid rgba(120,78,35,.12);
  color: #201610;
}

.empty-feed h2,
.empty-feed b {
  display: block;
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.empty-feed p,
.empty-feed span {
  display: block;
  margin: 6px 0 0;
  color: #7a6c5d;
  font-size: 14px;
  font-weight: 500;
}


/* === THE SQUARE PULSE UI === */
.pulse-strip {
  margin: 8px 0 16px;
  padding: 16px 12px;
  background:
    radial-gradient(circle at 100% 0%, rgba(68,191,255,.13), transparent 28%),
    radial-gradient(circle at 0% 100%, rgba(255,201,61,.16), transparent 30%),
    rgba(255,255,255,.78);
  border-top: 1px solid rgba(120,78,35,.14);
  border-bottom: 1px solid rgba(120,78,35,.12);
  box-shadow: 0 14px 34px rgba(120,78,35,.10);
}

.pulse-strip-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.pulse-strip-head p {
  margin: 0 0 6px;
  color: #d97016;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.pulse-strip-head h2 {
  margin: 0;
  color: #201610;
  font-size: 21px;
  line-height: 1.05;
  letter-spacing: -.02em;
  font-weight: 800;
}

.pulse-strip-head a {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  border-radius: 13px;
  padding: 0 12px;
  background: linear-gradient(135deg,#bfeeff,#62c9ff);
  color: #09202d;
  text-decoration: none;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.pulse-message {
  margin-bottom: 12px;
  border-radius: 14px;
  padding: 10px 12px;
  background: #fffaf2;
  border: 1px solid rgba(120,78,35,.16);
  color: #201610;
  font-size: 13px;
  font-weight: 700;
}

.pulse-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  gap: 10px;
}

.pulse-card,
.pulse-empty {
  min-height: 170px;
  display: grid;
  align-content: start;
  gap: 9px;
  border-radius: 20px;
  padding: 14px;
  background:
    radial-gradient(circle at 100% 0%, rgba(68,191,255,.12), transparent 30%),
    rgba(255,250,242,.82);
  border: 1px solid rgba(120,78,35,.14);
  color: #201610;
  text-decoration: none;
}

.pulse-card.active,
.pulse-card.room_open {
  border-color: rgba(68,191,255,.42);
  box-shadow: 0 14px 26px rgba(68,191,255,.14);
}

.pulse-city {
  width: fit-content;
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0 9px;
  background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
  color: #201610;
  font-size: 11px;
  font-weight: 800;
}

.pulse-card b,
.pulse-empty b {
  font-size: 17px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -.02em;
}

.pulse-card small,
.pulse-empty span {
  color: #7a6c5d;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 600;
}

.pulse-meter {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(120,78,35,.12);
}

.pulse-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg,#ffc93d,#ff7a2f,#44bfff);
}

.pulse-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pulse-stats span {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0 8px;
  background: rgba(255,255,255,.72);
  color: #6e6258;
  font-size: 11px;
  font-weight: 700;
}

.post-actions a.primary {
  min-height: 46px;
  display: grid;
  place-items: center;
  color: #201610;
  background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}

.post-actions button.pulse-linked {
  color: #09202d;
  background: linear-gradient(135deg,#bfeeff,#62c9ff);
  font-weight: 800;
}

@media (max-width: 1180px) {
  .pulse-cards {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }
}

@media (max-width: 620px) {
  .pulse-strip-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .pulse-strip-head a {
    width: 100%;
    justify-content: center;
  }

  .pulse-cards {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
    scroll-snap-type: x proximity;
  }

  .pulse-card,
  .pulse-empty {
    min-width: 260px;
    scroll-snap-align: start;
  }
}


/* === MOBILE NAV RESTORE — publish button + updated icons === */
@media (max-width: 980px) {
  .mobile-nav {
    left: 0 !important;
    right: 0 !important;
    bottom: max(0px, env(safe-area-inset-bottom)) !important;
    width: 100% !important;
    height: 86px !important;
    display: grid !important;
    grid-template-columns: repeat(5, 1fr) !important;
    align-items: center !important;
    gap: 0 !important;
    border-radius: 24px 24px 0 0 !important;
    border-top: 1px solid rgba(120,78,35,.14) !important;
    border-left: 0 !important;
    border-right: 0 !important;
    border-bottom: 0 !important;
    padding: 8px 8px max(8px, env(safe-area-inset-bottom)) !important;
    background: rgba(255,255,255,.94) !important;
    box-shadow: 0 -14px 36px rgba(120,78,35,.16) !important;
    backdrop-filter: blur(24px) saturate(1.12) !important;
  }

  .mobile-nav a,
  .mobile-nav button {
    min-width: 0 !important;
    width: 100% !important;
    height: 64px !important;
    display: grid !important;
    grid-template-rows: 28px 18px !important;
    place-items: center !important;
    gap: 5px !important;
    border: 0 !important;
    border-radius: 18px !important;
    background: transparent !important;
    color: #6d5e50 !important;
    text-decoration: none !important;
    font-family: var(--font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif) !important;
    font-size: 0 !important;
    font-weight: 700 !important;
    position: relative !important;
  }

  .mobile-nav a::before,
  .mobile-nav a::after,
  .mobile-nav button::before,
  .mobile-nav button::after {
    content: none !important;
  }

  .mobile-nav .nav-ico {
    display: grid !important;
    place-items: center !important;
    width: 30px !important;
    height: 30px !important;
    color: inherit !important;
    font-size: 24px !important;
    line-height: 1 !important;
  }

  .mobile-nav .nav-label {
    display: block !important;
    color: inherit !important;
    font-size: 12px !important;
    line-height: 1 !important;
    font-weight: 800 !important;
    letter-spacing: -.01em !important;
  }

  .mobile-nav .active {
    color: #d97016 !important;
    background: rgba(255,201,61,.10) !important;
  }

  .mobile-nav .nav-home .nav-ico {
    color: #d97016 !important;
  }

  .mobile-nav .nav-city .nav-ico {
    color: #5f6b78 !important;
  }

  .mobile-nav .nav-chat .nav-ico {
    color: #4a3f36 !important;
  }

  .mobile-nav .nav-profile .nav-ico {
    color: #6d5e50 !important;
  }

  .mobile-nav .nav-publish {
    width: 70px !important;
    height: 70px !important;
    margin: -28px auto 0 !important;
    border-radius: 50% !important;
    grid-template-rows: 40px 16px !important;
    color: #201610 !important;
    background: linear-gradient(135deg,#ffc93d,#ff9f35 50%,#ff7a2f) !important;
    box-shadow:
      0 0 0 9px rgba(255,201,61,.18),
      0 18px 38px rgba(255,122,47,.26) !important;
    transform: translateY(-2px) !important;
  }

  .mobile-nav .nav-publish .nav-ico {
    width: 40px !important;
    height: 38px !important;
    font-size: 38px !important;
    font-weight: 900 !important;
  }

  .mobile-nav .nav-publish .nav-label {
    position: absolute !important;
    left: 50% !important;
    bottom: -23px !important;
    transform: translateX(-50%) !important;
    width: max-content !important;
    color: #5d4d3f !important;
    font-size: 11px !important;
    font-weight: 900 !important;
  }

  .mobile-badge {
    position: absolute !important;
    right: 16px !important;
    top: 3px !important;
    min-width: 18px !important;
    height: 18px !important;
    display: grid !important;
    place-items: center !important;
    border-radius: 999px !important;
    background: #ff6f61 !important;
    color: #fff !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,.94) !important;
  }

  iframe[src*="onesignal"],
  div[id*="onesignal"],
  div[class*="onesignal"],
  .onesignal-bell-launcher,
  .onesignal-customlink-container,
  .onesignal-slidedown-container,
  .onesignal-popover-container {
    right: 12px !important;
    bottom: 106px !important;
    transform: scale(.78) !important;
    transform-origin: bottom right !important;
  }
}

@media (max-width: 390px) {
  .mobile-nav .nav-label {
    font-size: 11px !important;
  }

  .mobile-nav .nav-publish {
    width: 66px !important;
    height: 66px !important;
  }

  .mobile-nav .nav-publish .nav-ico {
    font-size: 35px !important;
  }
}

`;
