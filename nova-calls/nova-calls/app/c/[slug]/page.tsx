import { CallRoom } from '@/components/call-room';

export const dynamic = 'force-dynamic';

export default function CallPage({ params }: { params: { slug: string } }) {
  return <CallRoom slug={params.slug} />;
}
