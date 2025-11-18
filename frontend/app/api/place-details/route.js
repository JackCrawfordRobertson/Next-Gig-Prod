export async function POST(req) {
  try {
    const { placeId, apiKey } = await req.json();

    if (!placeId || !apiKey) {
      return Response.json(
        { error: "Place ID and API key are required" },
        { status: 400 }
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
    console.error("Place details error:", error);
    return Response.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
