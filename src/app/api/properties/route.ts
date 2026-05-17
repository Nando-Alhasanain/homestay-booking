import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createProperty, listProperties } from "@/services/property.service";
import { createPropertySchema } from "@/validators/property.validator";

export async function GET() {
  try {
    await requireUser();
    return jsonOk({ properties: await listProperties() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const input = createPropertySchema.parse(await request.json());
    return jsonOk({ property: await createProperty(input) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
