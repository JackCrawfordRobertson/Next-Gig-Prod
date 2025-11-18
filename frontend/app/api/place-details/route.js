export async function POST(req) {
  try {
    const { placeId } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!placeId) {
      return Response.json(
        { error: "Place ID is required" },
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
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=address_components,geometry,formatted_address`
    );

    const data = await response.json();

    return Response.json({
      result: data.result || null,
      status: data.status
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Place details error:", error);
    }
    return Response.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
