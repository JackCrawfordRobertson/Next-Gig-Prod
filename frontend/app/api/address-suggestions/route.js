export async function POST(req) {
  try {
    const { input, apiKey } = await req.json();

    console.log("📍 Address suggestions request:", { input, hasApiKey: !!apiKey });

    if (!input || !apiKey) {
      console.error("❌ Missing input or API key");
      return Response.json(
        { error: "Input and API key are required" },
        { status: 400 }
      );
    }

    console.log("🔍 Calling Google Maps API...");
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:uk`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );

    if (!response.ok) {
      console.error(`❌ Google Maps API error: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error("Error response:", errorData);
      return Response.json(
        { error: `Google Maps API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ Address suggestions received:", data.predictions?.length || 0);

    return Response.json({
      predictions: data.predictions || []
    });
  } catch (error) {
    console.error("❌ Address suggestions error:", error);
    return Response.json(
      { error: "Failed to fetch address suggestions", details: error.message },
      { status: 500 }
    );
  }
}
