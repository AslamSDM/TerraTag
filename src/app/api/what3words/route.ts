import { W3W_API_KEY } from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const coordinates = searchParams.get("coordinates");
  const words = searchParams.get("words");

  if (!coordinates && !words) {
    return NextResponse.json(
      { error: "Missing coordinates or words parameter" },
      { status: 400 }
    );
  }

  try {
    let url: string;

    if (coordinates) {
      // Convert coordinates to what3words (forward conversion)
      url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${coordinates}&key=${W3W_API_KEY}`;
    } else {
      // Convert what3words to coordinates (reverse conversion)
      url = `https://api.what3words.com/v3/convert-to-coordinates?words=${words}&key=${W3W_API_KEY}`;
    }

    const response = await fetch(url, {
      referrer: "https://developer.what3words.com/",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("what3words API error:", error);
    return NextResponse.json(
      { error: error.message || "Error processing request" },
      { status: 500 }
    );
  }
}
