// Route handler to prevent 404 errors from Chrome DevTools
export async function GET() {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

