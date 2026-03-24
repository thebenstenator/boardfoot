import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a woodworking materials expert. Given a project description, output a JSON bill of materials.

Rules:
- Lumber thickness uses rough measurement (4/4 = 1.0", 5/4 = 1.25", 8/4 = 2.0")
- Include realistic quantities based on the project description
- Hardware should be practical and specific (not just "screws" — use "1-5/8" pocket screws")
- Finishing materials should include sandpaper grits, not just the finish product
- Prices: use typical US retail ranges for 2025

Output ONLY valid JSON in this exact shape, with no markdown or explanation:
{
  "lumberItems": [{ "species": string, "thickness_in": number, "width_in": number, "length_ft": number, "quantity": number, "pricing_mode": "per_bf" | "per_lf", "price_per_unit": number }],
  "hardwareItems": [{ "description": string, "quantity": number, "unit": string, "unit_cost": number }],
  "finishItems": [{ "description": string, "container_cost": number, "fraction_used": number }]
}`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, ai_generations_used")
      .eq("id", user.id)
      .single();

    const isFree = profile?.subscription_tier !== "pro";
    const generationsUsed = profile?.ai_generations_used ?? 0;

    if (isFree && generationsUsed >= 5) {
      return NextResponse.json({ error: "limit_reached" }, { status: 403 });
    }

    const body = await request.json();
    const { prompt, projectId } = body as {
      prompt: string;
      projectId: string;
    };

    if (!prompt || !projectId) {
      return NextResponse.json(
        { error: "prompt and projectId are required" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Generation failed" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content.text) as {
      lumberItems: Array<{
        species: string;
        thickness_in: number;
        width_in: number;
        length_ft: number;
        quantity: number;
        pricing_mode: "per_bf" | "per_lf";
        price_per_unit: number;
      }>;
      hardwareItems: Array<{
        description: string;
        quantity: number;
        unit: string;
        unit_cost: number;
      }>;
      finishItems: Array<{
        description: string;
        container_cost: number;
        fraction_used: number;
      }>;
    };

    if (isFree) {
      await supabase
        .from("profiles")
        .update({ ai_generations_used: generationsUsed + 1 })
        .eq("id", user.id);
    }

    return NextResponse.json({
      lumberItems: parsed.lumberItems,
      hardwareItems: parsed.hardwareItems,
      finishItems: parsed.finishItems,
    });
  } catch (error) {
    console.error("AI BOM generation failed:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
