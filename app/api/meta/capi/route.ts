import { NextResponse } from "next/server";

interface MetaCapiBody {
    eventName: "Lead";
    eventId: string;
    source?: string;
    ctaText?: string;
    eventSourceUrl?: string;
    fbp?: string;
    fbc?: string;
}

export async function POST(req: Request) {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    // Keep endpoint no-op if CAPI is not configured yet.
    if (!pixelId || !accessToken) {
        return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    let body: MetaCapiBody;
    try {
        body = (await req.json()) as MetaCapiBody;
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.eventName !== "Lead" || !body.eventId) {
        return NextResponse.json({ ok: false, error: "Invalid event payload" }, { status: 400 });
    }

    const headers = req.headers;
    const forwardedFor = headers.get("x-forwarded-for");
    const userIpAddress = forwardedFor?.split(",")[0]?.trim();
    const userAgent = headers.get("user-agent") || undefined;

    const payload = {
        data: [
            {
                event_name: body.eventName,
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                event_id: body.eventId,
                event_source_url: body.eventSourceUrl,
                user_data: {
                    client_ip_address: userIpAddress,
                    client_user_agent: userAgent,
                    fbp: body.fbp,
                    fbc: body.fbc,
                },
                custom_data: {
                    source: body.source,
                    cta_text: body.ctaText,
                },
            },
        ],
        test_event_code: process.env.META_TEST_EVENT_CODE,
    };

    const response = await fetch(
        `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        const errorBody = await response.text();
        return NextResponse.json(
            { ok: false, error: "Meta CAPI request failed", detail: errorBody },
            { status: 502 },
        );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
}
