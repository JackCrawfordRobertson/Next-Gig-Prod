export async function POST(req) {
  try {
    const { input } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!input) {
      return Response.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return Response.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:uk`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: `Google Maps API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return Response.json({
      predictions: data.predictions || []
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Address suggestions error:", error);
    }
    return Response.json(
      { error: "Failed to fetch address suggestions" },
      { status: 500 }
    );
  }
}
