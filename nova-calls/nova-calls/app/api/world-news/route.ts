export async function GET() {
  return Response.json({
    items: [
      {
        title: 'Titolo notizia',
        source: 'Fonte',
        url: 'https://...',
        description: 'Breve descrizione',
        category: 'Mondo',
      },
    ],
  });
}
