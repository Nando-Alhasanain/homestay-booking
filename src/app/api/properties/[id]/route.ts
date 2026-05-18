import { handleApiError, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { deleteOrDeactivateProperty, getPropertyById, updateProperty } from "@/services/property.service";
import { updatePropertySchema } from "@/validators/property.validator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    return jsonOk({ property: await getPropertyById(id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const input = updatePropertySchema.parse(await request.json());
    return jsonOk({ property: await updateProperty(id, input) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    return jsonOk(await deleteOrDeactivateProperty(id));
  } catch (error) {
    return handleApiError(error);
  }
}
