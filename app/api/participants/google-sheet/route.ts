import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const GOOGLE_WEBAPP_URL = process.env.GOOGLE_WEBAPP_FEEDBACK_URL;

export async function GET() {
  try {
    const response = await axios.post(GOOGLE_WEBAPP_URL!, {
      action: "getImportantData",
    });

    return NextResponse.json({ message: "Success", data: response.data.data });
  } catch (error: any) {
    console.error(
      "Error submitting form:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
