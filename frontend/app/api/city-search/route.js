export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query || query.length < 2) {
      return Response.json({ cities: [] });
    }

    const response = await fetch(
      `https://photon.komoot.io/api/?` +
        `q=${encodeURIComponent(query)}&` +
        `limit=20&` +
        `lang=en`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      return Response.json(
        { error: `Geocoder error: ${response.status}` },
        { status: response.status }
      );
    }

    const { features = [] } = await response.json();

    const seen = new Set();
    const cities = [];

    for (const f of features) {
      const p = f.properties;
      // Only include city/town/village level results, skip streets/buildings
      if (p.type !== "city" && p.type !== "town" && p.type !== "village" && p.type !== "municipality") continue;

      const name = p.name || p.city || "";
      const country = p.country || "";
      const display = country ? `${name}, ${country}` : name;

      if (!name || seen.has(display)) continue;
      seen.add(display);

      cities.push({
        id: `${p.osm_type}${p.osm_id}`,
        name,
        country,
        display,
      });
    }

    return Response.json({ cities });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("City search error:", error);
    }
    return Response.json(
      { error: "Failed to search cities" },
      { status: 500 }
    );
  }
}
