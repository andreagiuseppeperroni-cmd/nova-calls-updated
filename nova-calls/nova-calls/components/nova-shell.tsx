'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { demoCalls, makeSlug, type NovaCall } from '@/lib/local-call';
import { ProfileOrb } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const STORAGE_KEY = 'nova:calls';

…      </section>
    </aside>
  );
}
