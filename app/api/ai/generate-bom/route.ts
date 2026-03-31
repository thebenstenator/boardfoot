import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a woodworking materials expert. Given a project description, output a JSON bill of materials.

Rules:
- Lumber thickness uses rough measurement (4/4 = 1.0", 5/4 = 1.25", 8/4 = 2.0")
- Include realistic quantities based on the project description
- Hardware should be practical and specific (e.g. "1-5/8\" pocket screws", "3\" wood screws", "#8 x 1-1/4\" flat head screws")
- Hardware unit must always be one of: "each", "box", "pair", "set", "lb", "oz" — never leave it blank
  - Use "box" when hardware is typically sold in boxes (screws, nails, bolts)
  - Use "each" for individual items (hinges, brackets, knobs, handles)
  - Use "pair" for items sold in pairs (drawer slides, hinges when paired)
  - Use "lb" for items sold by weight
- IMPORTANT: Wood glue, adhesives, CA glue, epoxy, and all similar bonding products belong in finishItems (consumables) — NOT hardwareItems
- Finishing/consumables should include: the finish coat product, primer if needed, sandpaper (list each grit separately), brushes or applicators, wood filler or putty if relevant, tack cloth, wood glue or adhesive if needed
- Prices: use typical US retail ranges for 2025
- pricing_mode rules:
  - Use "per_piece" for sheet goods (plywood, MDF, OSB, melamine) and any material sold by the sheet or panel — price_per_unit is the cost per sheet
  - Use "per_bf" for dimensional hardwood and softwood lumber sold by the board foot
  - Use "per_lf" for moulding, trim, and dowels sold by the linear foot

Consumables (finishItems) rules:
- container_size: the size of the container as sold (e.g. 32 for a quart of finish, 80 for 80-sheet sandpaper pack)
- container_cost: retail price of that container
- amount_used: how much of the container this project will use (same unit as container_size)
- fraction_used: amount_used / container_size (between 0 and 1)
- unit: the unit for container_size and amount_used — use "fl oz" for liquids, "sheets" for sandpaper, "oz" for fillers/putty, "item" for brushes/tack cloths
- Example — quart of polyurethane for a small project: container_size=32, amount_used=16, fraction_used=0.5, unit="fl oz", container_cost=18.99

Output ONLY valid JSON in this exact shape, with no markdown or explanation:
{
  "projectName": string (short descriptive name, 2-5 words, e.g. "Walnut Floating Shelf", "Plywood Bookshelf", "Pine Workbench"),
  "lumberItems": [{ "species": string, "thickness_in": number, "width_in": number, "length_ft": number, "quantity": number, "pricing_mode": "per_bf" | "per_lf" | "per_piece", "price_per_unit": number }],
  "hardwareItems": [{ "description": string, "quantity": number, "unit": string, "unit_cost": number }],
  "finishItems": [{ "description": string, "container_size": number, "container_cost": number, "amount_used": number, "fraction_used": number, "unit": string }]
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
    const { prompt } = body as { prompt: string; projectId?: string };

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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

    let jsonText = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    // Extract just the JSON object in case there's any surrounding text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonText = jsonMatch[0]
    const parsed = JSON.parse(jsonText) as {
      projectName: string;
      lumberItems: Array<{
        species: string;
        thickness_in: number;
        width_in: number;
        length_ft: number;
        quantity: number;
        pricing_mode: "per_bf" | "per_lf" | "per_piece";
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
        container_size: number;
        container_cost: number;
        amount_used: number;
        fraction_used: number;
        unit: string;
      }>;
    };

    if (isFree) {
      await supabase
        .from("profiles")
        .update({ ai_generations_used: generationsUsed + 1 })
        .eq("id", user.id);
    }

    return NextResponse.json({
      projectName: parsed.projectName,
      lumberItems: parsed.lumberItems,
      hardwareItems: parsed.hardwareItems,
      finishItems: parsed.finishItems,
    });
  } catch (error) {
    console.error("AI BOM generation failed:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
