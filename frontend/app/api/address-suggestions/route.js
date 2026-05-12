// UK bounding box: west, south, east, north
const UK_BBOX = "-10,49,2,61";
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/i;

export async function POST(req) {
  try {
    const { input } = await req.json();

    if (!input || input.length < 2) {
      return Response.json({ predictions: [] });
    }

    const isPostcodeQuery = UK_POSTCODE_RE.test(input.trim());

    const response = await fetch(
      `https://photon.komoot.io/api/?` +
        `q=${encodeURIComponent(input)}&` +
        `limit=10&` +
        `lang=en&` +
        `bbox=${UK_BBOX}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      return Response.json(
        { error: `Geocoder error: ${response.status}` },
        { status: response.status }
      );
    }

    let { features = [] } = await response.json();

    // Float postcode results to top when query looks like a postcode
    if (isPostcodeQuery) {
      features = [
        ...features.filter((f) => f.properties?.osm_value === "postcode"),
        ...features.filter((f) => f.properties?.osm_value !== "postcode"),
      ];
    }

    const predictions = features.map((f) => {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      const isPostcodeResult = p.osm_value === "postcode";

      // For postcode results, the postcode IS the name field
      const resolvedPostcode = p.postcode || (isPostcodeResult ? p.name : "") || "";

      const firstLineParts = [p.housenumber, p.street].filter(Boolean);
      const firstLine = isPostcodeResult ? "" : firstLineParts.join(" ") || p.name || "";
      const city = p.city || p.locality || p.county || "";
      const secondary = [city, resolvedPostcode].filter(Boolean).join(", ");
      const formatted = [firstLine || (isPostcodeResult ? p.name : ""), city, p.country]
        .filter(Boolean)
        .join(", ");

      return {
        place_id: `${p.osm_type}${p.osm_id}`,
        main_text: isPostcodeResult ? p.name : (firstLine || p.name || formatted.split(",")[0]),
        secondary_text: secondary,
        formatted_address: formatted,
        lat,
        lon,
        type: isPostcodeResult ? "postcode" : (p.type || "house"),
        address_components: {
          house_number: p.housenumber || "",
          road: p.street || "",
          suburb: p.locality || p.district || "",
          village: "",
          city: p.city || "",
          town: p.locality || "",
          county: p.county || p.state || "",
          postcode: resolvedPostcode,
          country: p.country || "United Kingdom",
        },
      };
    });

    return Response.json({ predictions });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Address suggestions error:", error);
    }
    return Response.json(
      { error: "Failed to fetch address suggestions" },
      { status: 500 }
    );
  }
}
