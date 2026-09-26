import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  ApiRequestError,
  createProjectFromApiRequest,
} from "@/features/wave-studio/domain/api";
import { createSvgMarkup } from "@/features/wave-studio/domain/svg";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { format, project } = createProjectFromApiRequest(payload);
    const svg = createSvgMarkup(project);
    const filename = `wave-studio-${project.width}x${project.height}.${format}`;

    if (format === "svg") {
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Тіло запиту повинно бути валідним JSON." },
        { status: 400 },
      );
    }

    if (error instanceof ApiRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Не вдалося згенерувати файл." },
      { status: 500 },
    );
  }
}
